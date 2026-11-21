const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Medicine } = require('../src/models/medicine.model');
const { DoseSchedule } = require('../src/models/doseSchedule.model');
const { DoseLog } = require('../src/models/doseLog.model');

const patientUser = {
  name: 'Schedule Patient',
  email: 'dose_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;
let medicineId;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Medicine.deleteMany({}),
    DoseSchedule.deleteMany({}),
    DoseLog.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;

  // Create a medicine with quantity 10
  const medRes = await request(app)
    .post('/api/v1/medicines')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Amoxicillin 500mg',
      quantity: 10,
      dosage_form: 'capsule'
    });
  medicineId = medRes.body.data.medicine._id;
});

describe('Schedule and Dose Routes', () => {
  describe('POST /api/v1/medicines/:id/schedule', () => {
    it('should create a dose schedule and auto-generate dose logs for today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .post(`/api/v1/medicines/${medicineId}/schedule`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          dose_amount: '1 capsule',
          times_per_day: 2,
          specific_times: ['09:00', '21:00'],
          start_date: todayStr,
          food_instruction: 'after_food',
          days_of_week: [0, 1, 2, 3, 4, 5, 6]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedule.dose_amount).toBe('1 capsule');
      expect(res.body.data.schedule.times_per_day).toBe(2);
      expect(res.body.data.schedule.specific_times).toEqual(['09:00', '21:00']);

      // Check that dose logs were created for today
      const logs = await DoseLog.find({ schedule_id: res.body.data.schedule._id });
      expect(logs.length).toBe(2);
    });

    it('should reject schedule creation for non-existent medicine', async () => {
      const res = await request(app)
        .post('/api/v1/medicines/650000000000000000000000/schedule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          dose_amount: '1 tablet',
          times_per_day: 1,
          specific_times: ['08:00'],
          start_date: '2026-01-01'
        });

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/schedule/today', () => {
    it('should retrieve today schedule with dose counts', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      await request(app)
        .post(`/api/v1/medicines/${medicineId}/schedule`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          dose_amount: '1 capsule',
          times_per_day: 2,
          specific_times: ['08:00', '20:00'],
          start_date: todayStr,
          days_of_week: [0, 1, 2, 3, 4, 5, 6]
        });

      const res = await request(app)
        .get('/api/v1/schedule/today')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDoses).toBe(2);
      expect(res.body.data.pendingCount).toBe(2);
      expect(res.body.data.takenCount).toBe(0);
      expect(res.body.data.doses.length).toBe(2);
    });
  });

  describe('Dose Action Endpoints: /doses/:id/take & /doses/:id/skip', () => {
    let doseId;

    beforeEach(async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const schedRes = await request(app)
        .post(`/api/v1/medicines/${medicineId}/schedule`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          dose_amount: '1 capsule',
          times_per_day: 1,
          specific_times: ['12:00'],
          start_date: todayStr,
          days_of_week: [0, 1, 2, 3, 4, 5, 6]
        });

      const log = await DoseLog.findOne({ schedule_id: schedRes.body.data.schedule._id });
      doseId = log._id;
    });

    it('should mark dose as taken and decrement medicine stock by 1', async () => {
      const res = await request(app)
        .post(`/api/v1/doses/${doseId}/take`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'Taken with warm water' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dose.status).toBe('taken');
      expect(res.body.data.dose.notes).toBe('Taken with warm water');
      expect(res.body.data.dose).toHaveProperty('taken_time');
      // Stock was 10, now should be 9
      expect(res.body.data.remainingQuantity).toBe(9);

      // Verify medicine in database
      const med = await Medicine.findById(medicineId);
      expect(med.quantity).toBe(9);
    });

    it('should mark dose as skipped without decrementing stock', async () => {
      const res = await request(app)
        .post(`/api/v1/doses/${doseId}/skip`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'Felt nauseous' });

      expect(res.status).toBe(200);
      expect(res.body.data.dose.status).toBe('skipped');
      expect(res.body.data.dose.notes).toBe('Felt nauseous');

      // Verify stock untouched
      const med = await Medicine.findById(medicineId);
      expect(med.quantity).toBe(10);
    });
  });
});
