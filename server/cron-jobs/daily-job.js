
const cron = require('node-cron');
const { pollDeployments } = require('../services/circleCIPoller');

const projects = ['yot-ui', 'pathways-ui'];

cron.schedule('0 0 * * *', async () => {
  for (const currentProject of projects) {
    await pollDeployments(currentProject);
  }
});