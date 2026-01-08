const express = require('express');
const releaseRoutes = require('./releaseRoutes');
const pool = require('../db');
const request = require('supertest');
const jiraService = require('../services/jiraService');

jest.mock('../services/jiraService');
jest.mock('../db');

const app = express();
app.use(express.json());
app.use('/api/releases', releaseRoutes);

describe('Release Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  })

    describe('POST /api/releases', () => {
        let mockClient;
        beforeEach(() => {
            mockClient = {
                query: jest.fn(),
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(mockClient);
        });

        test('creates release with tickets and PRs successfully', async () => {
            const mockTickets = {
                tickets: [
                {
                    key: 'PROJ-123',
                    summary: 'Bug fix',
                    url: 'http://jira.com/PROJ-123',
                    status: 'Done',
                    pullRequests: [
                    { number: 42, title: 'Fix bug', url: 'http://github.com/pr/42', author: 'john' }
                    ]
                }
                ]
            };

            jiraService.getJiraTicketsForRelease.mockResolvedValue(mockTickets);
            mockClient.query
               .mockResolvedValueOnce(undefined) 
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
                .mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/releases')
                .send({ version: '1.0.0', project: 'YOT' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.releaseId).toBe(1);
            expect(response.body.ticketsCount).toBe(1);
            expect(response.body.project).toBe('YOT');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.query).toHaveBeenCalled()
        });

        test('rolls back transaction on error', async () => {
            jiraService.getJiraTicketsForRelease.mockRejectedValue(
                new Error('Jira service unavailable')
            );
            mockClient.query.mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const response = await request(app)
            .post('/api/releases')
            .send({ version: '2.0.0', project: 'YOT' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Jira service unavailable');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();

        })


    });
});


describe('GET /api/releases/stats/last-month', () => {
    test('returns release count for current month', async () => {
        pool.query.mockResolvedValue({ rows: [{ count: '5' }] });

        const response = await request(app)
        .get('/api/releases/stats/last-month')
        .query({ project: 'YOT' });
        
        expect(response.status).toBe(200);
        expect(response.body.count).toBe('5');
        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String), ['YOT']
        );
    })
});

describe('GET /api/releases', () => {

    test('returns list of releases', async () => {
        const mockReleases = [
            { id: 1, version: '1.0.0', created_at: '2026-01-01', project: 'YOT' },
            { id: 2, version: '1.1.0', created_at: '2026-01-15', project: 'YOT' },
        ];

        pool.query.mockResolvedValue({ rows: mockReleases });

        const response = await request(app)
        .get('/api/releases')
        .query({ project: 'YOT' }); 

        expect(response.status).toBe(200);
        expect(response.body.releases).toEqual(mockReleases);
        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String), ['YOT']
        );


    })

});


