const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Medicine } = require('../src/models/medicine.model');
const { DoseSchedule } = require('../src/models/doseSchedule.model');

const patientUser = {
  name: 'Stock Patient',
  email: 'stock_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;
let medicineId;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Medicine.deleteMany({}),
    DoseSchedule.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;

  // Create medicine with quantity 6 and low_stock_threshold 5
  const medRes = await request(app)
    .post('/api/v1/medicines')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Atorvastatin 20mg',
      quantity: 6,
      low_stock_threshold: 5,
      expiry_date: new Date(Date.now() + 15 * 86400000).toISOString() // 15 days from now
    });
  medicineId = medRes.body.data.medicine._id;

  // Create active schedule consuming 2 tablets per day
  // 6 tablets / 2 per day = 3 days remaining (low stock!)
  await request(app)
    .post(`/api/v1/medicines/${medicineId}/schedule`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      dose_amount: '1 tablet',
      times_per_day: 2,
      specific_times: ['08:00', '20:00'],
      start_date: new Date().toISOString().split('T')[0]
    });
});

describe('Stock and Refill Tracking Routes', () => {
  describe('GET /api/v1/stock', () => {
    it('should return stock overview with predicted finish date and consumption rate', async () => {
      const res = await request(app)
        .get('/api/v1/stock')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalMedicines).toBe(1);
      expect(res.body.data.lowStockCount).toBe(1);

      const item = res.body.data.stockItems[0];
      expect(item.name).toBe('Atorvastatin 20mg');
      expect(item.dailyConsumption).toBe(2);
      expect(item.daysRemaining).toBe(3);
      expect(item.isLowStock).toBe(true);
      expect(item).toHaveProperty('predictedFinishDate');
    });
  });

  describe('PUT /api/v1/stock/:medicineId', () => {
    it('should refill medicine by adding quantity', async () => {
      const res = await request(app)
        .put(`/api/v1/stock/${medicineId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          quantity: 20,
          action: 'add'
        });

      expect(res.status).toBe(200);
      // 6 + 20 = 26 tablets
      expect(res.body.data.stock.quantity).toBe(26);
      expect(res.body.data.stock.daysRemaining).toBe(13); // 26 / 2
      expect(res.body.data.stock.isLowStock).toBe(false);
    });

    it('should set exact quantity', async () => {
      const res = await request(app)
        .put(`/api/v1/stock/${medicineId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          quantity: 40,
          action: 'set'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stock.quantity).toBe(40);
    });
  });

  describe('GET /api/v1/stock/low', () => {
    it('should list only medicines running low', async () => {
      const res = await request(app)
        .get('/api/v1/stock/low')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.lowStockMedicines.length).toBe(1);
      expect(res.body.data.lowStockMedicines[0].name).toBe('Atorvastatin 20mg');
    });
  });

  describe('GET /api/v1/stock/expiring', () => {
    it('should list medicines expiring within the specified days', async () => {
      const res = await request(app)
        .get('/api/v1/stock/expiring?days=30')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalExpiring).toBe(1);
      expect(res.body.data.medicines[0].name).toBe('Atorvastatin 20mg');
      expect(res.body.data.medicines[0].daysUntilExpiry).toBeLessThanOrEqual(16);
    });
  });
});
