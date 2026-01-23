require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');
const jiraRoutes = require('./routes/jiraRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const hotfixRoutes = require('./routes/hotfixRoutes');
const authenticateToken = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
require('./cron-jobs/daily-job');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://release-management-proj.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)',
      [username, hashedPassword, email]
    );
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Username already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/jira', authenticateToken, jiraRoutes);
app.use('/api/releases', authenticateToken, releaseRoutes);
app.use('/api/circleci', authenticateToken, require('./routes/circleCIRoutes'));
app.use('/api/deployments', authenticateToken, require('./routes/deploymentRoutes'));
app.use('/api/hotfixes', authenticateToken, hotfixRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
