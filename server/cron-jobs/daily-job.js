
const cron = require('node-cron');
const API = require('../services/circleCIService');
const { pollDeployments } = require('../services/circleCIPoller');

const projects = ['yot-ui', 'pathways-ui'];

cron.schedule('0 0 * * *', async () => {
  console.log('Running test job every minute');
  for (const currentProject of projects) {
    await pollDeployments(currentProject);
  }
});