require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');
const jiraRoutes = require('./routes/jiraRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const hotfixRoutes = require('./routes/hotfixRoutes');
const authenticateToken = require('./middleware/auth');

require('./cron-jobs/daily-job');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET loaded:', JWT_SECRET ? 'YES' : 'NO', 'Length:', JWT_SECRET?.length);

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.status(200).json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
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

app.use('/api/jira', authenticateToken, jiraRoutes);
app.use('/api/releases', authenticateToken, releaseRoutes);
app.use('/api/circleci', authenticateToken, require('./routes/circleCIRoutes'));
app.use('/api/deployments', authenticateToken, require('./routes/deploymentRoutes'));
app.use('/api/hotfixes', authenticateToken, hotfixRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
