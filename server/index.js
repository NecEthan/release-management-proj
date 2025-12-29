require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jiraRoutes = require('./routes/jiraRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const hotfixRoutes = require('./routes/hotfixRoutes');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/jira', authenticateToken, jiraRoutes);
app.use('/api/releases', authenticateToken, releaseRoutes);
app.use('/api/circleci', authenticateToken, require('./routes/circleCIRoutes'));
app.use('/api/deployments', authenticateToken, require('./routes/deploymentRoutes'));
app.use('/api/hotfixes', authenticateToken, hotfixRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
