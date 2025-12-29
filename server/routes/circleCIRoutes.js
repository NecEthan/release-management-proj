
const express = require('express');
const router = express.Router();
const circleCIService = require('../services/circleCIService');
const circleCIPoller = require('../services/circleCIPoller');

router.get('/environments', async (req, res) => {
    try {
        const environments = await circleCIService.getEnvironmentVersions();
        res.json(environments);
    } catch (error) {
        console.error('Error in /environments:', error.message);
        res.status(500).json({ error: 'Failed to fetch environment versions' });
    }
});

router.get('/deployments', async (req, res) => {
    try {
        const { project = 'YOT' } = req.query;
        const { items: pipelines } = await circleCIService.getEnvironmentVersions(project);
        
        const deployments = [];
        
        for (const pipeline of pipelines.slice(0, 50)) {
            const token = process.env.CIRCLECI_TOKEN;
            const workflowUrl = `https://circleci.com/api/v2/pipeline/${pipeline.id}/workflow`;
            
            const workflowResponse = await fetch(workflowUrl, {
                headers: {
                    'Circle-Token': token,
                    'Accept': 'application/json'
                }
            });
            
            if (workflowResponse.ok) {
                const workflowData = await workflowResponse.json();
                
                for (const workflow of workflowData.items || []) {
                    if (workflow.status === 'success') {
                        deployments.push({
                            pipelineNumber: pipeline.number,
                            workflowName: workflow.name,
                            branch: pipeline.vcs.branch,
                            version: pipeline.vcs.tag || pipeline.vcs.branch,
                            commitSha: pipeline.vcs.revision.substring(0, 7),
                            commitMessage: pipeline.vcs.commit?.subject || '',
                            author: pipeline.trigger?.actor?.login || 'unknown',
                            deployedAt: workflow.stopped_at || workflow.created_at,
                            status: workflow.status
                        });
                    }
                }
            }
        }
        
        res.json({ 
            deployments,
            count: deployments.length 
        });
    } catch (error) {
        console.error('Error fetching deployments:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/poll', async (req, res) => {
    try {
        const { project = 'YOT' } = req.body;
        
        const deployments = await circleCIPoller.pollDeployments(project);
        
        res.json({ 
            success: true, 
            deployments,
            count: deployments.length,
            project
        });
    } catch (error) {
        console.error(`❌ Error in /poll for project:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;