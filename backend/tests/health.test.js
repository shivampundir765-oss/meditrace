const request = require('supertest');
const app = require('../src/app');

describe('Health and System Routes', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 with operational health status and database connectivity', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('status', 'UP');
      expect(response.body.data).toHaveProperty('uptimeSeconds');
      expect(response.body.data.services.database).toHaveProperty('status', 'connected');
      expect(response.body.data.services.database).toHaveProperty('connected', true);
    });
  });

  describe('GET /api/docs.json', () => {
    it('should serve OpenAPI / Swagger specification JSON', async () => {
      const response = await request(app).get('/api/docs.json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body.info).toHaveProperty('title', 'Meditrace API Documentation');
    });
  });

  describe('Non-existent route handler', () => {
    it('should return 404 with standardized error format', async () => {
      const response = await request(app).get('/api/v1/non-existent-route-xyz');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errorCode', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message');
    });
  });
});
