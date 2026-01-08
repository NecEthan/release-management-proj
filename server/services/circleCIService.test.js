const { getEnvironmentVersions } = require('./circleCIService');

global.fetch = jest.fn();

describe('CircleCI Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CIRCLECI_TOKEN: 'test-token',
      CIRCLECI_PROJECT_SLUG_YOT: 'gh/org/yot',
      CIRCLECI_PROJECT_SLUG_PATHWAYS_UI: 'gh/org/pathways-ui'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvironmentVersions', () => {
    test('fetches environment versions successfully', async () => {
      const mockData = { items: [{ id: '123', vcs: { branch: 'develop' } }] };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await getEnvironmentVersions('YOT');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
          'https://circleci.com/api/v2/project/gh/org/yot/pipeline',
          expect.objectContaining({
            headers: {
              'Circle-Token': 'test-token',
              'Accept': 'application/json'
            }
          })
      );
    });

    test('fetches pipelines for pathways-ui project', async () => {

        const mockData = { items: [] };

        global.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockData,
        });

        await getEnvironmentVersions('pathways-ui');
        expect(fetch).toHaveBeenCalledWith(
            'https://circleci.com/api/v2/project/gh/org/pathways-ui/pipeline',
            expect.any(Object)
        );

    });

    test('throws error when token is missing', async () => {
        delete process.env.CIRCLECI_TOKEN;
        await expect(
            getEnvironmentVersions('YOT'))
            .rejects.
            toThrow('Missing environment variables for project: YOT');
    });

    test('throws error when project slug is missing', async () => {
        delete process.env.CIRCLECI_PROJECT_SLUG_YOT;
        await expect(
            getEnvironmentVersions('YOT'))
            .rejects.
            toThrow('Missing environment variables for project: YOT');
    });

    test('throws error when API request fails', async () => {
        global.fetch.mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        });

        await expect(getEnvironmentVersions('YOT'))
          .rejects
          .toThrow('CircleCI API error: 403 Forbidden');
    });
  });
});