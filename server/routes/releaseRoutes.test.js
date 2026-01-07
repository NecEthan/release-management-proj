const express = require('express');
const releaseRoutes = require('./releaseRoutes');
const pool = require('../db');

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

    });
});


