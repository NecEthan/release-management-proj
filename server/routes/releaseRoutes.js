const express = require('express');
const router = express.Router();
const jiraService = require('../services/jiraService');
const pool = require('../db');

router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        const { version } = req.body;

        await client.query('BEGIN');

        const releaseResult = await client.query(
            `INSERT INTO releases (version, status, release_date) 
             VALUES ($1, 'active', NOW()) 
             ON CONFLICT (version) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [version]
        );

        const releaseId = releaseResult.rows[0].id;

        const { tickets } = await jiraService.getJiraTicketsForRelease(version);

        for (const ticket of tickets) {
            await client.query(
                `INSERT INTO jira_tickets (jira_key, summary, url, status, release_id)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING`,
                [ticket.key, ticket.summary, ticket.url, ticket.status, releaseId]
            );
            
            for (const pr of ticket.pullRequests) {
                await client.query(
                    `INSERT INTO pull_requests (pr_number, title, url, author, release_id)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT DO NOTHING`,
                    [pr.number, pr.title, pr.url, pr.author, releaseId]
                );
            }
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            releaseId,
            ticketsCount: tickets.length 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating release:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, 
                    COUNT(DISTINCT jt.id) as ticket_count,
                    COUNT(DISTINCT pr.id) as pr_count
             FROM releases r
             LEFT JOIN jira_tickets jt ON jt.release_id = r.id
             LEFT JOIN pull_requests pr ON pr.release_id = r.id
             GROUP BY r.id
             ORDER BY r.created_at DESC`
        );
        
        res.json({ 
            releases: result.rows,
            total: result.rows.length 
        });
    } catch (error) {
        console.error('Error fetching releases:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/environments', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM environments ORDER BY id`
        );
        res.json({ environments: result.rows });
    } catch (error) {
        console.error('Error fetching environments:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
