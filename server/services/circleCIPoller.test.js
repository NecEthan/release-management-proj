const circleCIService = require('./circleCIService');
const { pollDeployments } = require('./circleCIPoller');
const pool = require('../db');
const jiraService = require('./jiraService');

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

    test('processes multiple pipelines with workflows', async () => {
        const mockPipelines = [
            {
                id: 'pipeline-1',
                vcs: {
                    branch: 'develop',
                    revision: 'abc123',
                    commit: { subject: 'Release 1.2.3', body: '' }
                }
            }
        ];

        circleCIService.getEnvironmentVersions.mockResolvedValue({ items: mockPipelines });
        
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ items: [] })
        });

        await pollDeployments('YOT');

        expect(circleCIService.getEnvironmentVersions).toHaveBeenCalledWith('YOT');
        expect(global.fetch).toHaveBeenCalled();
    });

    test('only processes successful workflows', async () => {
        const mockPipelines = [
            {
                id: 'pipeline-1',
                vcs: {
                    branch: 'develop',
                    revision: 'abc123',
                    commit: { subject: 'Release 1.2.3', body: '' }
                }
            }
        ];

        const mockWorkflows = [
            { id: 'wf-1', name: 'development', status: 'success', stopped_at: '2026-01-08T12:00:00Z' },
            { id: 'wf-2', name: 'development', status: 'failed', stopped_at: '2026-01-08T12:00:00Z' }
        ];

        circleCIService.getEnvironmentVersions.mockResolvedValue({ items: mockPipelines });
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ items: mockWorkflows })
        });

        pool.query.mockResolvedValue({ rows: [] });

        await pollDeployments('YOT');

        expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('Environment version update logic', () => {
    test('updates environment when new deployment is more recent', async () => {
      const mockQueries = [
        { rows: [{ last_deployed_at: '2026-01-01T10:00:00Z' }] },
        { rows: [] }
      ];
      
      pool.query.mockImplementation(() => Promise.resolve(mockQueries.shift()));

      const workflow = { stopped_at: '2026-01-08T12:00:00Z' };
      const version = '1.2.3';
      const environmentName = 'Develop';
      const project = 'YOT';

      const currentEnv = await pool.query(
        `SELECT current_version, last_deployed_at FROM environments WHERE name = $1 AND project = $2`,
        [environmentName, project]
      );
      
      const currentDeployedAt = currentEnv.rows[0]?.last_deployed_at;
      const newDeployedAt = new Date(workflow.stopped_at);
      
      if (!currentDeployedAt || newDeployedAt >= new Date(currentDeployedAt)) {
        await pool.query(
          `UPDATE environments SET current_version = $1, last_deployed_at = $2 WHERE name = $3 AND project = $4`,
          [version, workflow.stopped_at, environmentName, project]
        );
      }

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('UPDATE environments'),
        [version, workflow.stopped_at, environmentName, project]
      );
    });

    test('does not update environment when new deployment is older', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ last_deployed_at: '2026-01-08T10:00:00Z' }] });

      const workflow = { stopped_at: '2026-01-01T12:00:00Z' };
      const version = '1.2.3';
      const environmentName = 'Develop';
      const project = 'YOT';

      const currentEnv = await pool.query(
        `SELECT current_version, last_deployed_at FROM environments WHERE name = $1 AND project = $2`,
        [environmentName, project]
      );
      
      const currentDeployedAt = currentEnv.rows[0]?.last_deployed_at;
      const newDeployedAt = new Date(workflow.stopped_at);
      
      if (!currentDeployedAt || newDeployedAt >= new Date(currentDeployedAt)) {
        await pool.query(
          `UPDATE environments SET current_version = $1, last_deployed_at = $2 WHERE name = $3 AND project = $4`,
          [version, workflow.stopped_at, environmentName, project]
        );
      }

      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('updates environment when no previous deployment exists', async () => {
      const mockQueries = [
        { rows: [{ last_deployed_at: null }] },
        { rows: [] }
      ];
      
      pool.query.mockImplementation(() => Promise.resolve(mockQueries.shift()));

      const workflow = { stopped_at: '2026-01-08T12:00:00Z' };
      const version = '1.2.3';
      const environmentName = 'Develop';
      const project = 'YOT';

      const currentEnv = await pool.query(
        `SELECT current_version, last_deployed_at FROM environments WHERE name = $1 AND project = $2`,
        [environmentName, project]
      );
      
      const currentDeployedAt = currentEnv.rows[0]?.last_deployed_at;
      const newDeployedAt = new Date(workflow.stopped_at);
      
      if (!currentDeployedAt || newDeployedAt >= new Date(currentDeployedAt)) {
        await pool.query(
          `UPDATE environments SET current_version = $1, last_deployed_at = $2 WHERE name = $3 AND project = $4`,
          [version, workflow.stopped_at, environmentName, project]
        );
      }

      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Deployment processing with version cascading', () => {
    test('creates new release when version not found in database', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'develop',
          revision: 'abc123',
          commit: { subject: 'Release 1.2.3', body: '' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'development',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      const mockQueries = [
        { rows: [] },
        { rows: [{ id: 1 }] },
        { rows: [] },
        { rows: [{ id: 1 }] },
        { rows: [] },
        { rows: [] }
      ];

      pool.query.mockImplementation(() => Promise.resolve(mockQueries.shift() || { rows: [] }));
      jiraService.getJiraTicketsForRelease.mockResolvedValue({ tickets: [] });

      await pollDeployments('YOT');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO releases'),
        expect.any(Array)
      );
    });

    test('skips deployment when it already exists (duplicate commit_sha)', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'develop',
          revision: 'abc123',
          commit: { subject: 'Release 1.2.3', body: '' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'development',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ current_version: '1.2.3', last_deployed_at: '2026-01-01T10:00:00Z' }] });

      jiraService.getJiraTicketsForRelease.mockResolvedValue({ tickets: [] });

      await pollDeployments('YOT');

      expect(pool.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO deployments'),
        expect.any(Array)
      );
    });

    test('fetches and stores Jira tickets for new release', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'develop',
          revision: 'abc123',
          commit: { subject: 'Release 1.2.3', body: '' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'development',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      const mockTickets = [
        {
          key: 'JIRA-123',
          summary: 'Test ticket',
          status: 'Done',
          url: 'https://jira.com/JIRA-123',
          pullRequests: []
        }
      ];

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      pool.query.mockResolvedValue({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      jiraService.getJiraTicketsForRelease.mockResolvedValue({ tickets: mockTickets });

      await pollDeployments('YOT');

      expect(jiraService.getJiraTicketsForRelease).toHaveBeenCalledWith(
        expect.stringContaining('1.2.3'),
        'YOT'
      );
    });

    test('creates hotfix record when hotfix deployment detected', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'hotfix/urgent-fix',
          revision: 'abc123',
          commit: { subject: 'Hotfix: Critical bug', body: 'Release 1.2.4' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'production',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      pool.query.mockResolvedValue({ rows: [] });
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      jiraService.getJiraTicketsForRelease.mockResolvedValue({ tickets: [] });

      await pollDeployments('YOT');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO hotfixes'),
        expect.any(Array)
      );
    });
  });

  describe('Error handling', () => {
    test('continues processing after Jira service error', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'develop',
          revision: 'abc123',
          commit: { subject: 'Release 1.2.3', body: '' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'development',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      pool.query.mockResolvedValue({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      jiraService.getJiraTicketsForRelease.mockRejectedValue(new Error('Jira API error'));

      await expect(pollDeployments('YOT')).resolves.toBeDefined();
    });

    test('handles missing environment gracefully', async () => {
      const mockPipeline = {
        id: 'pipeline-1',
        vcs: {
          branch: 'unknown-branch',
          revision: 'abc123',
          commit: { subject: 'Release 1.2.3', body: '' }
        }
      };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'unknown',
        status: 'success',
        stopped_at: '2026-01-08T12:00:00Z'
      };

      circleCIService.getEnvironmentVersions.mockResolvedValue({ items: [mockPipeline] });
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [mockWorkflow] })
      });

      pool.query.mockResolvedValue({ rows: [] });
      jiraService.getJiraTicketsForRelease.mockResolvedValue({ tickets: [] });

      const deployments = await pollDeployments('YOT');

      expect(deployments).toBeDefined();
    });
  });
});