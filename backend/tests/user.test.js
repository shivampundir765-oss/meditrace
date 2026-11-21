const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');

const testUser = {
  name: 'Profile User',
  email: 'profile@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'SecurePass1',
  role: 'admin'
};

let accessToken;

// Helper to register and get tokens
const registerAndGetTokens = async (userData) => {
  const res = await request(app).post('/api/v1/auth/register').send(userData);
  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    user: res.body.data.user
  };
};

beforeEach(async () => {
  await User.deleteMany({});
  const tokens = await registerAndGetTokens(testUser);
  accessToken = tokens.accessToken;
});

describe('User Profile Routes', () => {

  // ─── GET PROFILE ────────────────────────────────────────────
  describe('GET /api/v1/users/me', () => {
    it('should return the authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('refreshTokens');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-jwt-token-xyz');

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_TOKEN');
    });
  });

  // ─── UPDATE PROFILE ─────────────────────────────────────────
  describe('PUT /api/v1/users/me', () => {
    it('should update name and phone', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name', phone: '+919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.phone).toBe('+919876543210');
    });

    it('should update address', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' } });

      expect(res.status).toBe(200);
      expect(res.body.data.user.address.city).toBe('Mumbai');
    });

    it('should update notification settings', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notificationSettings: {
            push: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.notificationSettings.push).toBe(false);
      expect(res.body.data.user.notificationSettings.quietHoursStart).toBe('22:00');
    });

    it('should not allow role change via profile update', async () => {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      // Role should remain patient
      expect(res.body.data.user.role).toBe('patient');
    });
  });

  // ─── CHANGE PASSWORD ────────────────────────────────────────
  describe('PUT /api/v1/users/me/password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'SecurePass1', newPassword: 'NewSecure2' });

      expect(res.status).toBe(200);

      // Should be able to login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'NewSecure2' });

      expect(loginRes.status).toBe(200);
    });

    it('should reject with wrong current password', async () => {
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'WrongPass1', newPassword: 'NewSecure2' });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_PASSWORD');
    });

    it('should reject weak new password', async () => {
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'SecurePass1', newPassword: '123' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  // ─── DELETE ACCOUNT ─────────────────────────────────────────
  describe('DELETE /api/v1/users/me', () => {
    it('should deactivate account', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toMatch(/deactivated/i);

      // Should not be able to login anymore
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(loginRes.status).toBe(403);
    });
  });
});

describe('Role-Based Access Control', () => {

  // ─── ADMIN-ONLY ROUTES ──────────────────────────────────────
  describe('GET /api/v1/admin/users', () => {
    it('should allow admin to list users', async () => {
      const { accessToken: adminAt } = await registerAndGetTokens(adminUser);

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminAt}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('should deny non-admin access to admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('INSUFFICIENT_ROLE');
    });

    it('should filter users by role', async () => {
      await registerAndGetTokens(adminUser);
      const { accessToken: adminAt } = await registerAndGetTokens({
        ...adminUser,
        email: 'admin2@test.com'
      });

      const res = await request(app)
        .get('/api/v1/admin/users?role=patient')
        .set('Authorization', `Bearer ${adminAt}`);

      expect(res.status).toBe(200);
      res.body.data.users.forEach((user) => {
        expect(user.role).toBe('patient');
      });
    });

    it('should search users by name', async () => {
      const { accessToken: adminAt } = await registerAndGetTokens(adminUser);

      const res = await request(app)
        .get('/api/v1/admin/users?search=Profile')
        .set('Authorization', `Bearer ${adminAt}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results', async () => {
      const { accessToken: adminAt } = await registerAndGetTokens(adminUser);

      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminAt}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.users.length).toBeLessThanOrEqual(1);
    });
  });
});
