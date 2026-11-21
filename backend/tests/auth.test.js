const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');

// Test user data
const testUser = {
  name: 'Test Patient',
  email: 'patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

const doctorUser = {
  name: 'Dr. Smith',
  email: 'doctor@test.com',
  password: 'SecurePass1',
  role: 'doctor'
};

let refreshToken;

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes', () => {

  // ─── REGISTER ────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('should register a new patient successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      // Password must never be returned
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should register a doctor', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(doctorUser);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('doctor');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, password: '1234' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject missing name', async () => {
      const noName = { ...testUser };
      delete noName.name;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(noName);

      expect(res.status).toBe(400);
    });
  });

  // ─── LOGIN ───────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1' });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'SecurePass1' });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should reject deactivated account', async () => {
      // Deactivate the user directly
      await User.updateOne({ email: testUser.email }, { isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  // ─── REFRESH TOKEN ──────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      refreshToken = res.body.data.refreshToken;
    });

    it('should issue new tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      // New refresh token should differ from old one
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject reused refresh token (rotation)', async () => {
      // Use it once
      await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

      // Try to reuse the same old token
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('TOKEN_REUSE');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  // ─── FORGOT & RESET PASSWORD ────────────────────────────────
  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should return success for existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('resetToken'); // returned in non-production
    });

    it('should not reveal non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody@test.com' });

      expect(res.status).toBe(200);
      // Should still say "if that email is registered"
      expect(res.body.message).toMatch(/if that email is registered/i);
    });

    it('should reset password with valid token', async () => {
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      const resetToken = forgotRes.body.data.resetToken;

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewSecure1' });

      expect(resetRes.status).toBe(200);

      // Should be able to login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'NewSecure1' });

      expect(loginRes.status).toBe(200);
    });

    it('should reject invalid reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewSecure1' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_RESET_TOKEN');
    });
  });

  // ─── LOGOUT ─────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const { accessToken: at, refreshToken: rt } = regRes.body.data;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${at}`)
        .send({ refreshToken: rt });

      expect(res.status).toBe(200);

      // Old refresh token should no longer work
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rt });

      expect(refreshRes.status).toBe(401);
    });
  });
});
