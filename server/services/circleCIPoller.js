const circleCIService = require('./circleCIService');
const jiraService = require('./jiraService');
const pool = require('../db');


function isHotfixDeployment(commitMessage, branch) {
    const msg = commitMessage.toLowerCase();
    const hotfixCommit = msg.toLowerCase().includes('hotfix');
    const HotfixBranch = branch.toLowerCase().includes('hotfix');

    return HotfixBranch || hotfixCommit;
}

async function getWorkflowsForPipeline(pipelineId) {
    const token = process.env.CIRCLECI_TOKEN;
    const url = `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`;

    const response = await fetch(url, {
        headers: {
            'Circle-Token': token,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        console.error(`Failed to fetch workflows for pipeline ${pipelineId}`);
        return [];
    }

    const data = await response.json();
    return data.items || [];
}

function extractVersionFromCommit(commitMessage) {
    const versionPattern = /\b(\d+\.\d+\.\d+)\b/g;
    const matches = [...commitMessage.matchAll(versionPattern)];
    
    if (matches.length === 0) {
        return null;
    }
    
    if (matches.length === 1) {
        return matches[0][1];
    }
    
    const versions = matches.map(m => m[1]);
    
    versions.sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (aParts[i] !== bParts[i]) {
                return bParts[i] - aParts[i];
            }
        }
        return 0;
    });
    
    return versions[0]; 
}

function shouldCascadeFromDevelop(commitMessage, branch) {
    const msg = commitMessage.toLowerCase();
    const branchLower = branch.toLowerCase();
    
    if (msg.includes('develop') && branchLower === 'release') {
        return true;
    }
    
    return false;
}

function mapWorkflowToEnvironment(workflowName, branch) {
    const name = workflowName.toLowerCase();
    const branchName = branch.toLowerCase();
    
    if (name === 'testing') return 'Release';
    if (name === 'development' || branchName === 'develop') return 'Develop';
    if (name === 'preprod' || branchName === 'release-candidate') return 'Release-Candidate';
    if (name === 'production' || branchName === 'master') return 'Master';
    
    return 'Develop';
}

async function pollDeployments(project = 'YOT') {
    const deployments = [];
    
    try {
        const { items: pipelines } = await circleCIService.getEnvironmentVersions(project);
        
        for (const pipeline of pipelines) {
            const workflows = await getWorkflowsForPipeline(pipeline.id);
            
            for (const workflow of workflows) {
                if (workflow.status === 'success') {
                    const deployment = await processDeployment(pipeline, workflow, project);
                    if (deployment) {
                        deployments.push(deployment);
                    }
                } 
            }
        }
        
        return deployments;
    } catch (error) {
        throw error;
    }
}

async function processDeployment(pipeline, workflow, project = 'YOT') {
    try {
        const commitSubject = pipeline.vcs.commit?.subject || '';
        const commitBody = pipeline.vcs.commit?.body || '';
        const commitMessage = `${commitSubject} ${commitBody}`.trim();
        
        let version = extractVersionFromCommit(commitMessage);
        const environmentName = mapWorkflowToEnvironment(workflow.name, pipeline.vcs.branch);
        
        if (!version) {
            if (shouldCascadeFromDevelop(commitMessage, pipeline.vcs.branch)) {
                const devVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Develop' AND project = $1`,
                    [project]
                );
                version = devVersion.rows[0]?.current_version;
             
            } else if (environmentName === 'Release') {
                const devVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Develop' AND project = $1`,
                    [project]
                );
                version = devVersion.rows[0]?.current_version;
            } else if (environmentName === 'Release-Candidate') {
                const releaseVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release' AND project = $1`,
                    [project]
                );
                version = releaseVersion.rows[0]?.current_version;
               
            } else if (environmentName === 'Master') {
                const rcVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release-Candidate' AND project = $1`,
                    [project]
                );
                version = rcVersion.rows[0]?.current_version;
                
            }
            
        }
        
        let releaseId = null;
        
        if (version) {
            let releaseResult = await pool.query(
                'SELECT id FROM releases WHERE version = $1 AND project = $2',
                [version, project]
            );
            
            if (releaseResult.rows.length === 0) {
                const newRelease = await pool.query(
                    `INSERT INTO releases (version, status, release_date, project)
                     VALUES ($1, 'active', NOW(), $2)
                     RETURNING id`,
                    [version, project]
                );
                releaseId = newRelease.rows[0].id;
            } else {
                releaseId = releaseResult.rows[0].id;
            }
            
            try {
                let jiraVersion = project === 'pathways-ui' ? `${version} (MM)` : `${version} (${project})`;
                let { tickets } = await jiraService.getJiraTicketsForRelease(jiraVersion, project);
                
                if (!tickets || tickets.length === 0) {
                    jiraVersion = version;
                    const result = await jiraService.getJiraTicketsForRelease(jiraVersion, project);
                    tickets = result.tickets;
                }
                
                let ticketCount = 0;
                let prCount = 0;
                
                await pool.query(
                    `DELETE FROM jira_tickets 
                     WHERE release_id = $1 
                     AND project = $2 
                     AND jira_key NOT IN (${tickets.length > 0 ? tickets.map((_, i) => `$${i + 3}`).join(',') : 'NULL'})`,
                    [releaseId, project, ...tickets.map(t => t.key)]
                );
                
                for (const ticket of tickets) {
                    const existingTicket = await pool.query(
                        `SELECT id FROM jira_tickets WHERE jira_key = $1`,
                        [ticket.key]
                    );
                    
                    if (existingTicket.rows.length > 0) {
                        await pool.query(
                            `UPDATE jira_tickets 
                             SET status = $1, summary = $2, url = $3, release_id = $4, project = $5
                             WHERE jira_key = $6`,
                            [ticket.status, ticket.summary, ticket.url, releaseId, project, ticket.key]
                        );
                    } else {
                        await pool.query(
                            `INSERT INTO jira_tickets (jira_key, summary, url, status, release_id, project)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [ticket.key, ticket.summary, ticket.url, ticket.status, releaseId, project]
                        );
                    }
                    ticketCount++;
                    
                    if (ticket.pullRequests.length > 0) {
                        await pool.query(
                            `DELETE FROM pull_requests 
                             WHERE release_id = $1 
                             AND project = $2 
                             AND pr_number NOT IN (${ticket.pullRequests.map((_, i) => `$${i + 3}`).join(',')})`,
                            [releaseId, project, ...ticket.pullRequests.map(pr => pr.number)]
                        );
                    }
                    
                    for (const pr of ticket.pullRequests) {
                        const existingPR = await pool.query(
                            `SELECT id FROM pull_requests WHERE pr_number = $1`,
                            [pr.number]
                        );
                        
                        if (existingPR.rows.length > 0) {
                            await pool.query(
                                `UPDATE pull_requests 
                                 SET title = $1, url = $2, author = $3, release_id = $4, project = $5
                                 WHERE pr_number = $6`,
                                [pr.title, pr.url, pr.author, releaseId, project, pr.number]
                            );
                        } else {
                            await pool.query(
                                `INSERT INTO pull_requests (pr_number, title, url, author, release_id, project)
                                 VALUES ($1, $2, $3, $4, $5, $6)`,
                                [pr.number, pr.title, pr.url, pr.author, releaseId, project]
                            );
                        }
                        prCount++;
                    }
                }
                
            } catch (error) {
                console.error(`Failed to fetch Jira tickets for ${version}: ${error.message}`);
            }
        }
        
        const existing = await pool.query(
            `SELECT id FROM deployments 
             WHERE commit_sha = $1 AND environment_id = (
                 SELECT id FROM environments WHERE name = $2 AND project = $3
             )`,
            [pipeline.vcs.revision, environmentName, project]
        );
        
        if (existing.rows.length > 0) {
            if (version) {
                await pool.query(
                    `UPDATE environments 
                     SET current_version = $1, last_deployed_at = $2
                     WHERE name = $3 AND project = $4`,
                    [version, workflow.stopped_at, environmentName, project]
                );
            }
            return null;
        }
        
        const envResult = await pool.query(
            'SELECT id FROM environments WHERE name = $1 AND project = $2',
            [environmentName, project]
        );
        
        if (envResult.rows.length === 0) {
            return null;
        }
        
        const environmentId = envResult.rows[0].id;
        
        if (version) {
            await pool.query(
                `UPDATE environments 
                 SET current_version = $1, last_deployed_at = $2
                 WHERE id = $3`,
                [version, workflow.stopped_at, environmentId]
            );
        } else {
            await pool.query(
                `UPDATE environments 
                 SET last_deployed_at = $1
                 WHERE id = $2 AND current_version IS NOT NULL`,
                [workflow.stopped_at, environmentId]
            );
        }
        
        await pool.query(
            `INSERT INTO deployments (environment_id, release_id, deployed_at, branch, commit_sha, project)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [environmentId, releaseId, workflow.stopped_at, pipeline.vcs.branch, pipeline.vcs.revision, project]
        );
        
        if (releaseId && isHotfixDeployment(commitMessage, pipeline.vcs.branch)) {
            await pool.query(
                `INSERT INTO hotfixes (release_id, title, description, status, created_at, project)
                 VALUES ($1, $2, $3, 'deployed', $4, $5)
                 ON CONFLICT DO NOTHING`,
                [releaseId, `Hotfix: ${pipeline.vcs.branch}`, commitMessage, workflow.stopped_at, project]
            );
        }
        
        return {
            version,
            environment: environmentName,
            branch: pipeline.vcs.branch,
            commitMessage,
            deployedAt: workflow.stopped_at
        };
    } catch (error) {
        console.error('Error processing deployment:', error.message);
        return null;
    }
}

module.exports = {
    pollDeployments
};
