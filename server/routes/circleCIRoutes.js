
const express = require('express');
const router = express.Router();
const circleCIService = require('../services/circleCIService');

router.get('/environments', async (req, res) => {
    try {
        const environments = await circleCIService.getEnvironmentVersions();
        res.json(environments);
    } catch (error) {
        console.error('Error in /environments:', error.message);
        res.status(500).json({ error: 'Failed to fetch environment versions' });
    }
});

module.exports = router;