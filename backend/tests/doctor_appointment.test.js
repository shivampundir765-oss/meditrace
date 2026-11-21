const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Doctor } = require('../src/models/doctor.model');
const { Appointment } = require('../src/models/appointment.model');
const { Notification } = require('../src/models/notification.model');

const doctorUser = {
  name: 'Dr. Jane Foster',
  email: 'jane.foster@hospital.com',
  password: 'SecurePass1',
  role: 'doctor'
};

const patientUser = {
  name: 'Oliver Queen',
  email: 'oliver@queen.com',
  password: 'SecurePass1',
  role: 'patient'
};

let doctorToken;
let patientToken;
let doctorDocId;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Notification.deleteMany({})
  ]);

  // Register Doctor
  const docRes = await request(app).post('/api/v1/auth/register').send(doctorUser);
  doctorToken = docRes.body.data.accessToken;

  // Set up Doctor Profile (Mon to Sat, 10:00 to 12:00 -> 4 slots of 30 mins)
  const profileRes = await request(app)
    .post('/api/v1/doctors/profile/me')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({
      name: 'Dr. Jane Foster',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology)',
      experience_years: 12,
      clinic_address: {
        clinic_name: 'Metro Heart Care',
        city: 'Mumbai',
        street: 'Marine Lines'
      },
      fee: 800,
      available_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      available_time_slots: [{ start_time: '10:00', end_time: '12:00' }],
      slot_duration_minutes: 30
    });
  doctorDocId = profileRes.body.data.doctor._id;

  // Register Patient
  const patRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  patientToken = patRes.body.data.accessToken;
});

// Helper to get next Monday's date string (guaranteed working day)
const getNextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(10, 0, 0, 0);
  return d;
};

describe('Doctors and Appointments Routes', () => {
  describe('Doctor Search and Profile', () => {
    it('should search doctors by specialization and city', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?specialization=Cardiologist&city=Mumbai');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.doctors.length).toBe(1);
      expect(res.body.data.doctors[0].name).toBe('Dr. Jane Foster');
      expect(res.body.data.doctors[0].fee).toBe(800);
    });

    it('should view doctor free slots on a working day', async () => {
      const nextMon = getNextMonday();
      const dateStr = nextMon.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/v1/doctors/${doctorDocId}/slots?date=${dateStr}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailableDay).toBe(true);
      // 10:00 to 12:00 = 4 slots: 10:00, 10:30, 11:00, 11:30
      expect(res.body.data.totalSlots).toBe(4);
      expect(res.body.data.availableSlotsCount).toBe(4);
    });
  });

  describe('Appointment Booking & Concurrency Protection', () => {
    it('should book an appointment and notify patient', async () => {
      const slotStart = getNextMonday();

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart.toISOString(),
          reason: 'Routine ECG Checkup',
          consultation_type: 'in_person'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.status).toBe('booked');
      expect(res.body.data.appointment.reason).toBe('Routine ECG Checkup');

      // Verify notification generated
      const notifs = await Notification.find({ type: 'appointment' });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toContain('Dr. Jane Foster');
    });

    it('should reject double booking on the same time slot with 409 conflict', async () => {
      const slotStart = getNextMonday();

      // 1. First booking succeeds
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart.toISOString()
        });

      // 2. Second booking on the exact same slot MUST fail
      const conflictRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart.toISOString()
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.errorCode).toBe('SLOT_ALREADY_BOOKED');
    });
  });

  describe('Rescheduling & Cancellation Flow', () => {
    it('should reschedule appointment to a new slot', async () => {
      const slotStart1 = getNextMonday();
      const slotStart2 = new Date(slotStart1.getTime() + 30 * 60000); // 10:30

      const bookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart1.toISOString()
        });

      const aptId = bookRes.body.data.appointment._id;

      // Reschedule to 10:30
      const reschedRes = await request(app)
        .put(`/api/v1/appointments/${aptId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          slot_start: slotStart2.toISOString(),
          reason: 'Meeting delay'
        });

      expect(reschedRes.status).toBe(200);
      expect(reschedRes.body.data.appointment.status).toBe('rescheduled');
    });

    it('should cancel appointment and allow another patient to book that slot', async () => {
      const slotStart = getNextMonday();

      const bookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart.toISOString()
        });

      const aptId = bookRes.body.data.appointment._id;

      // Cancel appointment
      const cancelRes = await request(app)
        .delete(`/api/v1/appointments/${aptId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ reason: 'Recovered fully' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.appointment.status).toBe('cancelled');

      // Now booking the previously cancelled slot succeeds!
      const rebookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorDocId,
          slot_start: slotStart.toISOString()
        });

      expect(rebookRes.status).toBe(201);
      expect(rebookRes.body.data.appointment.status).toBe('booked');
    });
  });
});
