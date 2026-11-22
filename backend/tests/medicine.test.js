const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Medicine } = require('../src/models/medicine.model');

jest.setTimeout(25000);

const patientUser = {
  name: 'Medicine Patient',
  email: 'med_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Medicine.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;
});

describe('Medicine Routes', () => {
  describe('POST /api/v1/medicines', () => {
    it('should create a medicine with full details', async () => {
      const res = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Paracetamol',
          generic_name: 'Acetaminophen',
          salt_composition: 'Paracetamol 500mg',
          dosage_form: 'tablet',
          strength: '500mg',
          quantity: 30,
          low_stock_threshold: 10,
          added_via: 'manual'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.medicine.name).toBe('Paracetamol');
      expect(res.body.data.medicine.quantity).toBe(30);
    });

    it('should reject creation without a medicine name', async () => {
      const res = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/medicines', () => {
    beforeEach(async () => {
      // Active medicine
      await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Ibuprofen',
          expiry_date: '2028-12-31',
          quantity: 20
        });

      // Expired medicine
      await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Old Cough Syrup',
          expiry_date: '2020-01-01',
          quantity: 5
        });
    });

    it('should list all medicines with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.medicines.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter by active medicines', async () => {
      const res = await request(app)
        .get('/api/v1/medicines?filter=active')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.medicines.length).toBe(1);
      expect(res.body.data.medicines[0].name).toBe('Ibuprofen');
    });

    it('should filter by expired medicines', async () => {
      const res = await request(app)
        .get('/api/v1/medicines?filter=expired')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.medicines.length).toBe(1);
      expect(res.body.data.medicines[0].name).toBe('Old Cough Syrup');
    });

    it('should search medicines by name', async () => {
      const res = await request(app)
        .get('/api/v1/medicines?search=ibu')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.medicines.length).toBe(1);
      expect(res.body.data.medicines[0].name).toBe('Ibuprofen');
    });
  });

  describe('PUT /api/v1/medicines/:id', () => {
    it('should update medicine quantity and strength', async () => {
      const createRes = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Metformin', quantity: 60 });

      const medId = createRes.body.data.medicine._id;

      const res = await request(app)
        .put(`/api/v1/medicines/${medId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 90, strength: '850mg' });

      expect(res.status).toBe(200);
      expect(res.body.data.medicine.quantity).toBe(90);
      expect(res.body.data.medicine.strength).toBe('850mg');
    });
  });

  describe('DELETE /api/v1/medicines/:id', () => {
    it('should delete medicine', async () => {
      const createRes = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Aspirin' });

      const medId = createRes.body.data.medicine._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/medicines/${medId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/v1/medicines/${medId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
