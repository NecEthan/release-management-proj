const circleCIService = require('./circleCIService');
const jiraService = require('./jiraService');
const pool = require('../db');

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
    
    if (name === 'testing') return 'Release-Candidate';
    if (name === 'development' || branchName === 'develop') return 'Develop';
    if (name === 'release' || branchName === 'release') return 'Release';
    if (name === 'master' || branchName === 'master') return 'Master';
    
    return 'Develop';
}

async function pollDeployments() {
    const deployments = [];
    
    try {
        console.log('📡 Polling CircleCI for recent deployments...');
        const { items: pipelines } = await circleCIService.getEnvironmentVersions();
        console.log(`Found ${pipelines.length} pipelines to check\n`);
        
        for (const pipeline of pipelines.slice(0, 50)) {
            const workflows = await getWorkflowsForPipeline(pipeline.id);
            
            for (const workflow of workflows) {
                if (workflow.status === 'success') {
                    console.log(`\n🔍 Found successful workflow: ${workflow.name} on ${pipeline.vcs.branch}`);
                    console.log(`   Pipeline #${pipeline.number} | Commit: ${pipeline.vcs.revision.substring(0, 7)}`);
                    console.log(`   Message: "${pipeline.vcs.commit?.subject || 'N/A'}"`);
                    
                    const deployment = await processDeployment(pipeline, workflow);
                    if (deployment) {
                        deployments.push(deployment);
                    }
                }
            }
        }
        
        console.log(`\n✅ Polling completed - Processed ${deployments.length} new deployments\n`);
        return deployments;
    } catch (error) {
        console.error('Error polling CircleCI:', error.message);
        throw error;
    }
}

async function processDeployment(pipeline, workflow) {
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
                    console.log(`   ⚠️ Develop has no version, skipping`);
                    return null;
                }
                console.log(`   ↪️  Cascading from Develop (commit mentions 'develop' → 'release')`);
            } else if (environmentName === 'Release') {
                const devVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Develop'`
                );
                version = devVersion.rows[0]?.current_version;
                if (!version) {
                    console.log(`   ⚠️ Develop has no version, skipping release deployment`);
                    return null;
                }
                console.log(`   Version: ${version} (cascaded from Develop)`);
            } else if (environmentName === 'Release-Candidate') {
                const releaseVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release'`
                );
                version = releaseVersion.rows[0]?.current_version;
                if (!version) {
                    console.log(`   ⚠️ Release has no version, skipping release-candidate deployment`);
                    return null;
                }
                console.log(`   Version: ${version} (cascaded from Release)`);
            } else if (environmentName === 'Master') {
                const rcVersion = await pool.query(
                    `SELECT current_version FROM environments WHERE name = 'Release-Candidate'`
                );
                version = rcVersion.rows[0]?.current_version;
                if (!version) {
                    console.log(`   ⚠️ Release-Candidate has no version, skipping master deployment`);
                    return null;
                }
                console.log(`   Version: ${version} (cascaded from Release-Candidate)`);
            } else {
                console.log(`   ⚠️ No version found in commit for ${environmentName}, skipping`);
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
        if (releaseResult.rows.length === 0) {
            const newRelease = await pool.query(
                `INSERT INTO releases (version, status, release_date)
                 VALUES ($1, 'active', NOW())
                 RETURNING id`,
                [version]
            );
            releaseId = newRelease.rows[0].id;
            
            try {
                const { tickets } = await jiraService.getJiraTicketsForRelease(version);
                
                for (const ticket of tickets) {
                    await pool.query(
                        `INSERT INTO jira_tickets (jira_key, summary, url, status, release_id)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT DO NOTHING`,
                        [ticket.key, ticket.summary, ticket.url, ticket.status, releaseId]
                    );
                    
                    for (const pr of ticket.pullRequests) {
                        await pool.query(
                            `INSERT INTO pull_requests (pr_number, title, url, author, release_id)
                             VALUES ($1, $2, $3, $4, $5)
                             ON CONFLICT DO NOTHING`,
                            [pr.number, pr.title, pr.url, pr.author, releaseId]
                        );
                    }
                }
            } catch (error) {
                console.error(`   ❌ Failed to fetch Jira tickets: ${error.message}`);
            }
        } else {
            releaseId = releaseResult.rows[0].id;
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
        
        if (pipeline.vcs.branch.toLowerCase().includes('hotfix')) {
            await pool.query(
                `INSERT INTO hotfixes (release_id, title, description, status, created_at)
                 VALUES ($1, $2, $3, 'deployed', $4)`,
                [releaseId, `Hotfix: ${pipeline.vcs.branch}`, commitMessage, workflow.stopped_at]
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
