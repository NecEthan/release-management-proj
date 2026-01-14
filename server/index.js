require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jiraRoutes = require('./routes/jiraRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const hotfixRoutes = require('./routes/hotfixRoutes');
const authenticateToken = require('./middleware/auth');

require('./cron-jobs/daily-job');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
  try {
    const https = require('https');
    const data = JSON.stringify(req.body);
    
    const options = {
      hostname: 'stable-yot.i2ncloud.com',
      path: '/authenticate/user-credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      rejectUnauthorized: false
    };
    
    const proxyReq = https.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => { body += chunk; });
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).send(body);
      });
    });
    
    proxyReq.on('error', (error) => {
      res.status(500).json({ message: 'Authentication service unavailable' });
    });
    
    proxyReq.write(data);
    proxyReq.end();
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed' });
  }
});

app.use('/api/jira', authenticateToken, jiraRoutes);
app.use('/api/releases', authenticateToken, releaseRoutes);
app.use('/api/circleci', authenticateToken, require('./routes/circleCIRoutes'));
app.use('/api/deployments', authenticateToken, require('./routes/deploymentRoutes'));
app.use('/api/hotfixes', authenticateToken, hotfixRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
