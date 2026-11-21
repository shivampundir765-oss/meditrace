const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Prescription } = require('../src/models/prescription.model');
const { Medicine } = require('../src/models/medicine.model');

const patientUser = {
  name: 'Prescription Patient',
  email: 'rx_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Prescription.deleteMany({}),
    Medicine.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;
});

describe('Prescription Routes', () => {
  describe('POST /api/v1/prescriptions', () => {
    it('should create a new prescription successfully', async () => {
      const res = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          doctor_name: 'Dr. Gregory House',
          hospital_name: 'Princeton-Plainsboro',
          notes: 'Take after meals for 7 days',
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prescription).toHaveProperty('_id');
      expect(res.body.data.prescription.doctor_name).toBe('Dr. Gregory House');
      expect(res.body.data.prescription.status).toBe('active');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/v1/prescriptions')
        .send({ doctor_name: 'Dr. No' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/prescriptions', () => {
    it('should list prescriptions for the authenticated patient', async () => {
      await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ doctor_name: 'Dr. Watson', status: 'active' });

      const res = await request(app)
        .get('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prescriptions.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
    });
  });

  describe('GET /api/v1/prescriptions/:id', () => {
    it('should get prescription with linked medicines', async () => {
      const createRes = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ doctor_name: 'Dr. Strange' });

      const prescriptionId = createRes.body.data.prescription._id;

      // Add a linked medicine
      await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Amoxicillin 500mg',
          prescription_id: prescriptionId,
          quantity: 20
        });

      const res = await request(app)
        .get(`/api/v1/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.prescription.doctor_name).toBe('Dr. Strange');
      expect(res.body.data.medicines.length).toBe(1);
      expect(res.body.data.medicines[0].name).toBe('Amoxicillin 500mg');
    });

    it('should return 404 for invalid or non-existent prescription ID', async () => {
      const res = await request(app)
        .get('/api/v1/prescriptions/650000000000000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/prescriptions/:id', () => {
    it('should update prescription notes and status', async () => {
      const createRes = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ doctor_name: 'Dr. Adams' });

      const prescriptionId = createRes.body.data.prescription._id;

      const res = await request(app)
        .put(`/api/v1/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'Updated notes', status: 'expired' });

      expect(res.status).toBe(200);
      expect(res.body.data.prescription.notes).toBe('Updated notes');
      expect(res.body.data.prescription.status).toBe('expired');
    });
  });

  describe('DELETE /api/v1/prescriptions/:id', () => {
    it('should delete prescription and unlink medicines', async () => {
      const createRes = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ doctor_name: 'Dr. House' });

      const prescriptionId = createRes.body.data.prescription._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify prescription is gone
      const checkRes = await request(app)
        .get(`/api/v1/prescriptions/${prescriptionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
