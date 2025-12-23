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
    const versionPattern = /\b(\d+\.\d+\.\d+)/;
    const match = commitMessage.match(versionPattern);
    return match ? match[1] : null;
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
    if (name === 'preprod' || branchName === 'release-candidate') return 'Release-candidate';
    if (name === 'production' || branchName === 'master') return 'Master';
    
    return 'Develop';
}

async function pollDeployments(project = 'YOT') {
    const deployments = [];
    
    try {
        const { items: pipelines } = await circleCIService.getEnvironmentVersions();
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
        console.error('Error polling CircleCI:', error.message);
        throw error;
    }
}

async function processDeployment(pipeline, workflow, project = 'YOT') {
    try {
        const commitMessage = pipeline.vcs.commit?.subject || '';
        let version = extractVersionFromCommit(commitMessage);
        const environmentName = mapWorkflowToEnvironment(workflow.name, pipeline.vcs.branch);
        
        if (!version) {
            if (shouldCascadeFromDevelop(commitMessage, pipeline.vcs.branch)) {
                const devVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Develop'`
                );
                version = devVersion.rows[0]?.current_version;
                if (!version) {
                    return null;
                }
            } else if (environmentName === 'Release') {
                const devVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Develop'`
                );
                version = devVersion.rows[0]?.current_version;
                if (!version) {
                    return null;
                }
            } else if (environmentName === 'Release-Candidate') {
                const releaseVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release'`
                );
                version = releaseVersion.rows[0]?.current_version;
                if (!version) {
                    return null;
                }
            } else if (environmentName === 'Master') {
                const rcVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release-Candidate'`
                );
                version = rcVersion.rows[0]?.current_version;
                if (!version) {
                    return null;
                }
            } else {
                return null;
            }
        }
        
        const existing = await pool.query(
            `SELECT id FROM deployments 
             WHERE commit_sha = $1 AND environment_id = (
                 SELECT id FROM environments WHERE name = $2
             )`,
            [pipeline.vcs.revision, environmentName]
        );
        
        if (existing.rows.length > 0) {
            return null;
        }
        
        let releaseResult = await pool.query(
            'SELECT id FROM releases WHERE version = $1',
            [version]
        );
        
        let releaseId;
        let isNewRelease = false;
        if (releaseResult.rows.length === 0) {
            const newRelease = await pool.query(
                `INSERT INTO releases (version, status, release_date, project)
                 VALUES ($1, 'active', NOW(), $2)
                 RETURNING id`,
                [version, project]
            );
            releaseId = newRelease.rows[0].id;
            isNewRelease = true;
        } else {
            releaseId = releaseResult.rows[0].id;
        }
        
        try {
            const jiraVersion = `${version} (YOT)`;
            const { tickets } = await jiraService.getJiraTicketsForRelease(jiraVersion);
            
            let ticketCount = 0;
            let prCount = 0;
            
            for (const ticket of tickets) {
                const result = await pool.query(
                    `INSERT INTO jira_tickets (jira_key, summary, url, status, release_id)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (jira_key, release_id) 
                     DO UPDATE SET 
                         status = EXCLUDED.status,
                         summary = EXCLUDED.summary,
                         url = EXCLUDED.url
                     RETURNING id`,
                    [ticket.key, ticket.summary, ticket.url, ticket.status, releaseId]
                );
                
                if (result.rows.length > 0) ticketCount++;
                
                for (const pr of ticket.pullRequests) {
                    const prResult = await pool.query(
                        `INSERT INTO pull_requests (pr_number, title, url, author, release_id)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (pr_number, release_id) 
                         DO UPDATE SET 
                             title = EXCLUDED.title,
                             url = EXCLUDED.url,
                             author = EXCLUDED.author
                         RETURNING id`,
                        [pr.number, pr.title, pr.url, pr.author, releaseId]
                    );
                    
                    if (prResult.rows.length > 0) prCount++;
                }
            }
            
        } catch (error) {
            console.error(`Failed to fetch Jira tickets for ${version}: ${error.message}`);
        }
        
        const envResult = await pool.query(
            'SELECT id FROM environments WHERE name = $1',
            [environmentName]
        );
        
        if (envResult.rows.length === 0) {
            return null;
        }
        
        const environmentId = envResult.rows[0].id;
        
        await pool.query(
            `UPDATE environments 
             SET current_version = $1, last_deployed_at = $2
             WHERE id = $3`,
            [version, workflow.stopped_at, environmentId]
        );
        
        await pool.query(
            `INSERT INTO deployments (environment_id, release_id, deployed_at, branch, commit_sha)
             VALUES ($1, $2, $3, $4, $5)`,
            [environmentId, releaseId, workflow.stopped_at, pipeline.vcs.branch, pipeline.vcs.revision]
        );
        
        if (isHotfixDeployment(commitMessage, pipeline.vcs.branch)) {
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
