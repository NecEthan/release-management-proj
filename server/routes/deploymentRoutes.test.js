const request = require("supertest");
const express = require("express");
const deploymentRoutes = require("./deploymentRoutes");
const pool = require("../db");
const { afterEach, describe } = require("node:test");

jest.mock("../db");

const app = express();
app.use(express.json());
app.use("/api/deployments", deploymentRoutes);

describe("Deployment Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/deployments", () => {
    test("returns 200 and deployments list with default project", async () => {
      const mockDeployments = [
        {
          id: 1,
          deployed_at: "2026-01-05",
          branch: "main",
          commit_sha: "abc123",
          environment: "production",
          release_version: "1.0.0",
        },
        {
          id: 2,
          deployed_at: "2026-01-04",
          branch: "develop",
          commit_sha: "def456",
          environment: "staging",
          release_version: "0.9.0",
        },
      ];

      pool.query.mockResolvedValue({ rows: mockDeployments });

      const response = await request(app).get("/api/deployments");

      expect(response.status).toBe(200);
      expect(response.body.deployments).toEqual(mockDeployments);
      expect(response.body.total).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["YOT"]);
    });

    test("returns 200 and deployments for specific project", async () => {
      const mockDeployments = [
        {
          id: 3,
          deployed_at: "2026-01-03",
          branch: "main",
          commit_sha: "ghi789",
          environment: "production",
          release_version: "2.0.0",
        },
      ];

      pool.query.mockResolvedValue({ rows: mockDeployments });
      const response = await request(app).get("/api/deployments?project=ABC");

      expect(response.status).toBe(200);
      expect(response.body.deployments).toEqual(mockDeployments);
      expect(response.body.total).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
        "ABC",
      ]);
    });

    test("returns 500 on database error", async () => {
      pool.query.mockRejectedValue(new Error("Database error"));
      const response = await request(app).get("/api/deployments");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Database error");
    });

    test("returns 404 when deployment not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const response = await request(app).get("/api/deployments/999");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Deployment not found");
    });
  });
});
