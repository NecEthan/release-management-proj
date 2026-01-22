const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Attempting login for:', username);

        const response = await fetch('https://portal-stable.i2ncloud.com/api/two-fa/authenticate/user-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('i2ncloud response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('i2ncloud error:', errorText);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const data = await response.json();
        console.log('Login successful for:', username);
        res.json(data);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;