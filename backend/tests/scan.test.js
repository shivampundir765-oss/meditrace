const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Scan } = require('../src/models/scan.model');
const { Medicine } = require('../src/models/medicine.model');

const patientUser = {
  name: 'Scanner Patient',
  email: 'scan_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Scan.deleteMany({}),
    Medicine.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;
});

describe('Scan Feature (OCR, Barcode & Auto-fill)', () => {
  describe('POST /api/v1/scan/image (OCR Extraction)', () => {
    it('should extract medicine name, expiry date, batch number, manufacturer and return confidence score', async () => {
      const sampleOcrText = `
        PARACETAMOL 500mg TABLETS IP
        Batch No: B240918
        Mfg Date: 01/2024
        EXPIRY DATE: 12/2027
        MFD BY: SUN PHARMACEUTICAL INDUSTRIES LTD
        Keep in a dry place.
      `;

      const res = await request(app)
        .post('/api/v1/scan/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ raw_text: sampleOcrText });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { scan, autofill } = res.body.data;
      expect(scan.extracted_name).toContain('PARACETAMOL 500mg');
      expect(scan.extracted_batch).toBe('B240918');
      expect(scan.extracted_manufacturer).toContain('SUN PHARMACEUTICAL');
      expect(scan.confidence).toBeGreaterThanOrEqual(80);
      expect(scan.extracted_expiry).toBeDefined();

      // Verify autofill structure ready for Add Medicine form
      expect(autofill).toBeDefined();
      expect(autofill.name).toContain('PARACETAMOL 500mg');
      expect(autofill.batch_number).toBe('B240918');
      expect(autofill.dosage_form).toBe('tablet');
    });

    it('should extract month word format expiry (e.g. EXP: OCT-2028)', async () => {
      const text = `
        Azithromycin 500mg
        B.NO: AZ-8801
        EXP: OCT 2028
        MFD BY: CIPLA LIMITED
      `;

      const res = await request(app)
        .post('/api/v1/scan/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ raw_text: text });

      expect(res.status).toBe(200);
      expect(res.body.data.scan.extracted_name).toContain('Azithromycin 500mg');
      expect(res.body.data.scan.extracted_batch).toBe('AZ-8801');
      const expiry = new Date(res.body.data.scan.extracted_expiry);
      expect(expiry.getFullYear()).toBe(2028);
      expect(expiry.getMonth()).toBe(9); // October (0-indexed: 9)
    });

    it('should support confirming the autofill payload directly into /medicines', async () => {
      const ocrText = `
        Augmentin 625 Duo
        BATCH: AG-102
        EXP: 06/2027
        MFD BY: GLAXOSMITHKLINE
      `;

      // 1. Scan image
      const scanRes = await request(app)
        .post('/api/v1/scan/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ raw_text: ocrText });

      const { autofill } = scanRes.body.data;

      // 2. User confirms auto-fill form and adds medicine
      const addRes = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...autofill,
          added_via: 'scan'
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.medicine.name).toContain('Augmentin 625 Duo');
      expect(addRes.body.data.medicine.batch_number).toBe('AG-102');
      expect(addRes.body.data.medicine.added_via).toBe('scan');
    });
  });

  describe('POST /api/v1/scan/barcode (Barcode Lookup)', () => {
    it('should match a known barcode and return verified medicine details', async () => {
      const doloBarcode = '8901086001234';

      const res = await request(app)
        .post('/api/v1/scan/barcode')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ barcode: doloBarcode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { scan, autofill } = res.body.data;
      expect(scan.extracted_name).toBe('Dolo 650mg Tablet');
      expect(scan.confidence).toBe(98);
      expect(autofill.generic_name).toBe('Paracetamol');
      expect(autofill.salt_composition).toBe('Paracetamol (650mg)');
      expect(autofill.manufacturer).toBe('Micro Labs Ltd');
      expect(autofill.dosage_form).toBe('tablet');
    });

    it('should return fallback structure for uncatalogued barcode', async () => {
      const unknownBarcode = '9999888877771';

      const res = await request(app)
        .post('/api/v1/scan/barcode')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ barcode: unknownBarcode });

      expect(res.status).toBe(200);
      expect(res.body.data.scan.confidence).toBe(50);
      expect(res.body.data.autofill.name).toContain('9999888877771');
    });

    it('should reject invalid short barcode', async () => {
      const res = await request(app)
        .post('/api/v1/scan/barcode')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ barcode: '1' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/scan/history', () => {
    it('should return list of user past scans', async () => {
      await request(app)
        .post('/api/v1/scan/barcode')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ barcode: '8901086001234' });

      const res = await request(app)
        .get('/api/v1/scan/history')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.scans.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.scans[0].barcode).toBe('8901086001234');
    });
  });
});
