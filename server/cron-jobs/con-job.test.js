const cron = require('node-cron');
const { pollDeployments } = require('../services/circleCIPoller');

jest.mock('node-cron');
jest.mock('../services/circleCIPoller');

describe('Daily cron job', () => {
  let scheduledFunction;

  beforeAll(() => {
    require('./daily-job');
    scheduledFunction = cron.schedule.mock.calls[0][1];
  });

  beforeEach(() => {
    pollDeployments.mockClear();
  });

  test('schedules a daily cron job at midnight', () => {
    expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
  });

  test('schedules async function', async () => {
    pollDeployments.mockResolvedValue([]);
    
    await scheduledFunction();
    
    expect(pollDeployments).toHaveBeenCalled();
  });

  test('polls deployments for yot-ui project', async () => {
    pollDeployments.mockResolvedValue([]);
    
    await scheduledFunction();
    
    expect(pollDeployments).toHaveBeenCalledWith('yot-ui');
  });

  test('polls deployments for pathways-ui project', async () => {
    pollDeployments.mockResolvedValue([]);
    
    await scheduledFunction();
    
    expect(pollDeployments).toHaveBeenCalledWith('pathways-ui');
  });

  test('executes polling for all projects in sequence', async () => {
    pollDeployments.mockResolvedValue([]);

    await scheduledFunction();

    expect(pollDeployments).toHaveBeenCalledTimes(2);
    expect(pollDeployments).toHaveBeenNthCalledWith(1, 'yot-ui');
    expect(pollDeployments).toHaveBeenNthCalledWith(2, 'pathways-ui');
  });

  test('waits for first project to complete before starting second', async () => {
    const executionOrder = [];
    
    pollDeployments.mockImplementation((project) => {
      executionOrder.push(`start-${project}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          executionOrder.push(`end-${project}`);
          resolve([]);
        }, 10);
      });
    });

    await scheduledFunction();

    expect(executionOrder).toEqual([
      'start-yot-ui',
      'end-yot-ui',
      'start-pathways-ui',
      'end-pathways-ui'
    ]);
  });

});