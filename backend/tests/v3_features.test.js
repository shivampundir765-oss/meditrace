const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Profile } = require('../src/models/profile.model');
const { Cabinet } = require('../src/models/cabinet.model');
const { Medicine } = require('../src/models/medicine.model');
const { MedicineRevision } = require('../src/models/medicineRevision.model');
const { DoseSchedule } = require('../src/models/doseSchedule.model');
const { DoseLog } = require('../src/models/doseLog.model');
const { generateAccessToken } = require('../src/services/auth.service');

describe('MediTrace v3 Comprehensive Feature Suite', () => {
  let patientUser, pharmacistUser;
  let patientToken, pharmacistToken;
  let selfProfile, motherProfile;
  let createdCabinet;
  let createdMedicine;

  beforeAll(async () => {
    // 1. Create Patient and Pharmacist users
    patientUser = await User.create({
      name: 'V3 Test Patient',
      email: `patient_v3_${Date.now()}@meditrace.health`,
      password: 'Password123!',
      role: 'patient',
      phone: '+919876543210'
    });
    patientToken = generateAccessToken(patientUser._id, patientUser.role);

    pharmacistUser = await User.create({
      name: 'V3 Test Pharmacist',
      email: `pharmacist_v3_${Date.now()}@meditrace.health`,
      password: 'Password123!',
      role: 'pharmacist',
      phone: '+919876543211'
    });
    pharmacistToken = generateAccessToken(pharmacistUser._id, pharmacistUser.role);

    // 2. Create Profiles for Patient
    selfProfile = await Profile.create({
      user_id: patientUser._id,
      name: 'V3 Test Patient',
      relationship: 'self',
      access_level: 'owner',
      is_default: true
    });

    motherProfile = await Profile.create({
      user_id: patientUser._id,
      name: 'Lakshmi Rao (Mother)',
      relationship: 'mother',
      access_level: 'caregiver_edit',
      is_default: false
    });
  });

  describe('Feature 1 & 2: Cabinet Management & Stock Tracking', () => {
    it('creates a new cabinet with condition chips and profile scoping', async () => {
      const res = await request(app)
        .post('/api/v1/cabinets')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          name: 'Fever & Pain Relief',
          medical_condition: 'Fever',
          condition_code: 'fever',
          time_slot: 'Morning'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cabinet.name).toBe('Fever & Pain Relief');
      expect(res.body.data.cabinet.profile_id).toBe(selfProfile._id.toString());
      createdCabinet = res.body.data.cabinet;
    });

    it('adds multiple medicines to the cabinet with stock calculations', async () => {
      // Medicine 1: In Stock
      const med1Res = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          name: 'Dolo 650',
          salt_composition: 'Paracetamol IP 650mg',
          strength: '650mg',
          quantity: 20,
          original_quantity: 20,
          cabinet_id: createdCabinet._id,
          category: 'Common',
          usedFor: 'Fever and body pain',
          cautions: 'Take after food'
        });

      expect(med1Res.status).toBe(201);
      createdMedicine = med1Res.body.data.medicine;

      // Medicine 2: Few Left (Stock threshold calculation)
      const med2Res = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          name: 'Combiflam',
          salt_composition: 'Ibuprofen + Paracetamol',
          strength: '400mg',
          quantity: 3,
          original_quantity: 20,
          cabinet_id: createdCabinet._id,
          category: 'Common'
        });

      expect(med2Res.status).toBe(201);

      // Verify cabinet stock summary
      const cabRes = await request(app)
        .get(`/api/v1/cabinets/${createdCabinet._id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(cabRes.status).toBe(200);
      expect(cabRes.body.data.cabinet.stock_summary.in_stock).toBe(1);
      expect(cabRes.body.data.cabinet.stock_summary.few_left).toBe(1);
    });

    it('supports backward-compatible /api/v1/catalogs route alias', async () => {
      const res = await request(app)
        .get('/api/v1/catalogs')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(res.status).toBe(200);
      const list = res.body.data.cabinets || res.body.data;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('Feature 4: Append-Only Medicine Revisions & Audit Stamps', () => {
    it('creates Revision 1 labeled Added by Pharmacist with audit stamp', async () => {
      const res = await request(app)
        .get(`/api/v1/medicines/${createdMedicine._id}/revisions`)
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.revisions.length).toBe(1);
      const rev1 = res.body.data.revisions[0];
      expect(rev1.revision_number).toBe(1);
      expect(rev1.action_label).toBe('Added by Pharmacist');
      expect(rev1.audit_stamp).toBeDefined();
      expect(rev1.audit_stamp.timestamp).toBeDefined();
    });

    it('appends Revision 2 on patient edit and preserves immutable Revision 1', async () => {
      const editRes = await request(app)
        .put(`/api/v1/medicines/${createdMedicine._id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          cautions: 'Updated caution: Take with warm water after meals',
          nickname: 'Headache Reliever'
        });

      expect(editRes.status).toBe(200);

      const revsRes = await request(app)
        .get(`/api/v1/medicines/${createdMedicine._id}/revisions`)
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(revsRes.status).toBe(200);
      expect(revsRes.body.data.revisions.length).toBe(2);
      const rev2 = revsRes.body.data.revisions[1];
      expect(rev2.revision_number).toBe(2);
      expect(rev2.action_label).toContain('Edited by');
      expect(rev2.changed_fields).toContain('cautions');
    });
  });

  describe('Feature 5: Monthly Dose History & Adherence Calendar', () => {
    beforeAll(async () => {
      // Seed a dose log
      const schedule = await DoseSchedule.create({
        patient_id: patientUser._id,
        user_id: patientUser._id,
        profile_id: selfProfile._id,
        medicine_id: createdMedicine._id,
        dose_amount: '1 tablet',
        times_per_day: 1,
        specific_times: ['08:00'],
        food_instruction: 'after_food',
        time_slot: 'Morning',
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        start_date: new Date('2026-11-01')
      });

      await DoseLog.create({
        patient_id: patientUser._id,
        user_id: patientUser._id,
        profile_id: selfProfile._id,
        schedule_id: schedule._id,
        medicine_id: createdMedicine._id,
        scheduled_time: new Date('2026-11-02T08:00:00Z'),
        status: 'taken',
        taken_time: new Date('2026-11-02T08:15:00Z'),
        dose_amount: '1 tablet'
      });

      await DoseLog.create({
        patient_id: patientUser._id,
        user_id: patientUser._id,
        profile_id: selfProfile._id,
        schedule_id: schedule._id,
        medicine_id: createdMedicine._id,
        scheduled_time: new Date('2026-11-03T08:00:00Z'),
        status: 'missed',
        dose_amount: '1 tablet'
      });
    });

    it('returns monthly calendar data with adherence stats', async () => {
      const res = await request(app)
        .get(`/api/v1/medicines/${createdMedicine._id}/dose-history?month=2026-11`)
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.month).toBe('2026-11');
      expect(Array.isArray(res.body.data.days)).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.total_taken).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.total_missed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Feature 6: Family Mode Multi-Profile Isolation', () => {
    it('isolates cabinet queries strictly to active profile', async () => {
      // Create a cabinet under Mother Profile
      await request(app)
        .post('/api/v1/cabinets')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', motherProfile._id.toString())
        .send({
          name: 'Mother Diabetes Kit',
          medical_condition: 'Diabetes',
          time_slot: 'Morning'
        });

      // Querying with Self Profile should return Self's cabinet and not Mother's cabinet
      const selfCabs = await request(app)
        .get('/api/v1/cabinets')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(selfCabs.status).toBe(200);
      const names = selfCabs.body.data.cabinets.map(c => c.name);
      expect(names).toContain('Fever & Pain Relief');
      expect(names).not.toContain('Mother Diabetes Kit');

      // Querying with Mother Profile should return Mother's cabinet and not Fever & Pain Relief
      const motherCabs = await request(app)
        .get('/api/v1/cabinets')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', motherProfile._id.toString());

      expect(motherCabs.status).toBe(200);
      const motherNames = motherCabs.body.data.cabinets.map(c => c.name);
      expect(motherNames).toContain('Mother Diabetes Kit');
      expect(motherNames).not.toContain('Fever & Pain Relief');
    });
  });

  describe('Feature 3 & 7: AI Chatbot Scoped Tools & Medical Disclaimer', () => {
    it('executes tool calling scoped to profile and includes mandatory disclaimer', async () => {
      const res = await request(app)
        .post('/api/v1/chatbot/message')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          message: 'What cabinets do I have in my profile?',
          language: 'en'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.disclaimer).toContain('I am an AI assistant, not a doctor or pharmacist');
    });

    it('detects emergency symptoms and provides immediate hotline notice', async () => {
      const res = await request(app)
        .post('/api/v1/chatbot/message')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          message: 'I have severe chest pain and cannot breathe',
          language: 'en'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toContain('112');
      expect(res.body.data.reply).toContain('108');
    });
  });

  describe('Feature 1 (Scan): 2-Sided Packaging Scan & Draft Saving', () => {
    it('saves and retrieves leaving-scan draft', async () => {
      const draftData = {
        name: 'Azithral 500 Draft',
        salt_composition: 'Azithromycin IP 500mg',
        quantity: 10,
        batch_number: 'AZT-990'
      };

      const saveRes = await request(app)
        .post('/api/v1/scan/draft')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({ draft_data: draftData });

      expect(saveRes.status).toBe(200);

      const getRes = await request(app)
        .get('/api/v1/scan/draft')
        .set('Authorization', `Bearer ${patientToken}`)
        .set('x-profile-id', selfProfile._id.toString());

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.draft).toBeDefined();
      expect(getRes.body.data.draft.autofill_data.name).toBe('Azithral 500 Draft');
    });

    it('processes two-sided scan with quality evaluation', async () => {
      const res = await request(app)
        .post('/api/v1/scan/two-sided')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .set('x-profile-id', selfProfile._id.toString())
        .send({
          front_image: 'data:image/jpeg;base64,mockFrontBase64',
          back_image: 'data:image/jpeg;base64,mockBackBase64',
          simulated_text: 'DOLO 650 TABLETS\nParacetamol IP 650mg\nBatch: B240918\nExp: 04/2027\nMicro Labs Ltd.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quality_report).toBeDefined();
      expect(res.body.data.detected_fields.name.toLowerCase()).toContain('dolo');
      expect(['database', 'scanned']).toContain(res.body.data.field_sources.name);
    });
  });
});
