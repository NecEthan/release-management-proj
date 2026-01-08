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