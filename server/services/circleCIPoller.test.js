const circleCIService = require('./circleCIService');
const { pollDeployments } = require('./circleCIPoller');

jest.mock('./circleCIService');
jest.mock('./jiraService');
jest.mock('../db');

global.fetch = jest.fn();

describe('CircleCI Poller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pollDeployments', () => {
    test('processes successful deployment', async () => {
        circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [] });

        const deployments = await pollDeployments('YOT');

        expect(deployments).toEqual([]);
        expect(circleCIService.getEnvironmentVersions).toHaveBeenCalledWith('YOT');
    });

    test('handles Circle API error', async () => {
        circleCIService.getEnvironmentVersions.mockRejectedValue(
            new Error('CircleCI API error')
        );

        await expect(pollDeployments('YOT')).rejects.toThrow('CircleCI API error');
    });
  });
});