const request = require('supertest');
const express = require('express');
const circleCIRoutes = require('./circleCIRoutes');
const circleCIPoller = require('../services/circleCIPoller');
const { describe } = require('node:test');
jest.mock('../services/circleCIPoller');

const app = express();
app.use(express.json());
app.use('/api/circleci', circleCIRoutes);


describe('CircleCI Routes', () => {

    describe('POST /api/circleci/poll', () => {
        test('returns 200 and deployments on success', async () => {
            circleCIPoller.pollDeployments.mockResolvedValue([
                { version: '1.0.0', environment: 'production' },
            ])

            const response = await request(app)
                .post('/api/circleci/poll')
                .send({project: 'YOT' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.deployments).toEqual([
                { version: '1.0.0', environment: 'production' },
            ]);
            expect(response.body.project).toBe('YOT');
        })

        test('returns 500 on service error', async () => {
            circleCIPoller.pollDeployments.mockRejectedValue(
                new Error('Service error')
            );

            const response = await request(app)
                .post('/api/circleci/poll')
                .send({ project: 'YOT' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Service error');
        })
    })

});