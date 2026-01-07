const request = require('supertest');
const express = require('express');
const jiraRoutes = require('./jiraRoutes');
const jiraService = require('../services/jiraService');
const pool = require('../db');
const { describe } = require('node:test');

jest.mock('../services/jiraService');
jest.mock('../db');

const app = express();
app.use(express.json());
app.use('/api/jira', jiraRoutes);

describe('Jira Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
});

describe('GET /api/jira/releases/:version/tickets', () => {
    test('returns 200 and tickets for a valid version', async () => {
        const mockTickets = {
            tickets: [
                { key: 'JIRA-123', summary: 'Fix critical bug' },
                { key: 'JIRA-456', summary: 'Implement feature B' },
            ]
        };
        jiraService.getJiraTicketsForRelease.mockResolvedValue(mockTickets);

        const response = await request(app).get('/api/jira/releases/1.0.0/tickets');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockTickets);
        expect(jiraService.getJiraTicketsForRelease).toHaveBeenCalledWith('1.0.0');
    });

    test('returns 500 on service error', async () => {
        jiraService.getJiraTicketsForRelease.mockRejectedValue(
            new Error('Service error')
        );
        const response = await request(app).get('/api/jira/releases/1.0.0/tickets');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to fetch Jira tickets');
    });
});

describe('POST /api/jira', () => {
     let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    test(' creates release with tickets and PRs successfully', async () => {
        const mockTickets = {
            tickets: [
                { key: 'JIRA-123', summary: 'Fix critical bug',
                    url: 'http://jira/browse/JIRA-123',
                    status: 'Done',
                    pullRequests: [
                        { number: 1, title:'fix bug', url: 'http://github/pr/1', author: 'dev1' },
                        { number: 2, title:'add tests', url: 'http://github/pr/2', author: 'dev2' }
                    ]
                },
                { key: 'JIRA-1234', summary: 'Fix critical bug',
                    url: 'http://jira/browse/JIRA-1234',
                    status: 'Done',
                    pullRequests: [
                        { number: 1, title:'fix bug', url: 'http://github/pr/1', author: 'dev1' },
                        { number: 2, title:'add tests', url: 'http://github/pr/2', author: 'dev2' }
                    ]
                },

            ]
        };


        jiraService.getJiraTicketsForRelease.mockResolvedValue(mockTickets);
        mockClient.query.mockResolvedValueOnce(undefined); 
        mockClient.query.mockResolvedValueOnce({ rows: [ { id: 1 } ] });
        mockClient.query.mockResolvedValue(undefined);

        const response = await reques(app)
        .post('/api/jira')
        .send({ version: '1.0.0' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.releaseId).toBe(1);
        expect(response.body.ticketsCount).toBe(2);

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.query).toHaveBeenCalled();
    });


});