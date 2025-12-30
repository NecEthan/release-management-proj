const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all hotfixes
router.get('/', async (req, res) => {
    try {
        const { project = 'YOT' } = req.query;
        
        const result = await pool.query(
            `SELECT 
                h.*,
                r.version as release_version,
                e.name as environment_name
             FROM hotfixes h
             LEFT JOIN releases r ON h.release_id = r.id
             LEFT JOIN environments e ON r.environment_id = e.id
             WHERE h.project = $1
             ORDER BY h.created_at DESC`,
            [project]
        );
        
        res.json({ 
            hotfixes: result.rows,
            total: result.rows.length 
        });
    } catch (error) {
        console.error('Error fetching hotfixes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single hotfix details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { project = 'YOT' } = req.query;
        
        const hotfixResult = await pool.query(
            `SELECT 
                h.*,
                r.version as release_version,
                r.release_date,
                e.name as environment_name
             FROM hotfixes h
             LEFT JOIN releases r ON h.release_id = r.id
             LEFT JOIN environments e ON r.environment_id = e.id
             WHERE h.id = $1 AND h.project = $2`,
            [id, project]
        );
        
        if (hotfixResult.rows.length === 0) {
            return res.status(404).json({ error: 'Hotfix not found' });
        }
        
        const hotfix = hotfixResult.rows[0];
        
        if (hotfix.release_id) {
            const searchText = `${hotfix.title || ''} ${hotfix.description || ''}`;
            
            const ticketsResult = await pool.query(
                `SELECT * FROM jira_tickets 
                 WHERE release_id = $1 
                 AND project = $2 
                 AND $3 ILIKE '%' || jira_key || '%'
                 ORDER BY jira_key`,
                [hotfix.release_id, project, searchText]
            );
            
            const prsResult = await pool.query(
                `SELECT * FROM pull_requests 
                 WHERE release_id = $1 
                 AND project = $2 
                 AND $3 ILIKE '%#' || pr_number || '%'
                 ORDER BY pr_number`,
                [hotfix.release_id, project, searchText]
            );
            
            hotfix.jiraTickets = ticketsResult.rows;
            hotfix.pullRequests = prsResult.rows;
        } else {
            hotfix.jiraTickets = [];
            hotfix.pullRequests = [];
        }
        
        res.json({ hotfix });
    } catch (error) {
        console.error('Error fetching hotfix details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
