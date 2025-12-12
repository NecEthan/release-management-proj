
const express = require('express');
const router = express.Router();
const jiraService = require('../services/jiraService');

router.get('/releases/:version/tickets', async (req, res) => {
    try {
        const version = req.params.version;
        const result = await jiraService.getJiraTicketsForRelease(version);
        res.json(result);
    } catch (error) {
        console.error('Error in /releases/:version/tickets:', error.message);
        res.status(500).json({ error: 'Failed to fetch Jira tickets' });
    }
});

module.exports = router;