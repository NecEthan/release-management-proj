const express = require('express');
const router = express.Router();
const pool = require('../db');

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
        
        const searchText = `${hotfix.title || ''} ${hotfix.description || ''}`;
        
        const prsResult = await pool.query(
            `SELECT * FROM pull_requests 
             WHERE release_id = $1 
             AND project = $2 
             AND $3 ILIKE '%#' || pr_number || '%'
             ORDER BY pr_number
             LIMIT 1`,
            [hotfix.release_id, project, searchText]
        );
        
        let combinedSearchText = searchText;
        if (prsResult.rows.length > 0) {
            const pr = prsResult.rows[0];
            combinedSearchText += ` ${pr.title || ''} ${pr.description || ''}`;
        }
        
        const ticketPattern = project.toUpperCase() === 'PATHWAYS-UI' ? /IDV-\d+/i : /PP-\d+/i;
        const ticketMatch = combinedSearchText.match(ticketPattern);
        
        let ticketsResult = { rows: [] };
        
        if (ticketMatch) {
            const ticketKey = ticketMatch[0].toUpperCase();
            
            ticketsResult = await pool.query(
                `SELECT * FROM jira_tickets 
                 WHERE project = $1 
                 AND jira_key = $2
                 LIMIT 1`,
                [project, ticketKey]
            );
        }
        
        hotfix.jiraTickets = ticketsResult.rows;
        hotfix.pullRequests = prsResult.rows;
        
        res.json({ hotfix });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
