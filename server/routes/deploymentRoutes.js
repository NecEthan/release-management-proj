const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                d.id,
                d.deployed_at,
                d.branch,
                d.commit_sha,
                e.name as environment,
                r.version as release_version
             FROM deployments d
             JOIN environments e ON d.environment_id = e.id
             LEFT JOIN releases r ON d.release_id = r.id
             ORDER BY d.deployed_at DESC
             LIMIT 50`
        );
        
        res.json({ 
            deployments: result.rows,
            total: result.rows.length 
        });
    } catch (error) {
        console.error('Error fetching deployments:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deploymentResult = await pool.query(
            `SELECT 
                d.id,
                d.deployed_at,
                d.deployed_by,
                d.branch,
                d.commit_sha,
                e.id as environment_id,
                e.name as environment,
                r.id as release_id,
                r.version as release_version,
                r.status as release_status,
                r.release_date
             FROM deployments d
             JOIN environments e ON d.environment_id = e.id
             LEFT JOIN releases r ON d.release_id = r.id
             WHERE d.id = $1`,
            [id]
        );
        
        if (deploymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        const deployment = deploymentResult.rows[0];
        
        if (deployment.release_id) {
            const ticketsResult = await pool.query(
                `SELECT * FROM jira_tickets WHERE release_id = $1 ORDER BY jira_key`,
                [deployment.release_id]
            );
            
            const prsResult = await pool.query(
                `SELECT * FROM pull_requests WHERE release_id = $1 ORDER BY pr_number`,
                [deployment.release_id]
            );
            
            deployment.jiraTickets = ticketsResult.rows;
            deployment.pullRequests = prsResult.rows;
        } else {
            deployment.jiraTickets = [];
            deployment.pullRequests = [];
        }
        
        res.json({ deployment });
    } catch (error) {
        console.error('Error fetching deployment details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
