const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Doctor } = require('../src/models/doctor.model');
const { Retailer } = require('../src/models/retailer.model');
const { RetailerInventory } = require('../src/models/retailerInventory.model');
const { Prescription } = require('../src/models/prescription.model');
const { Medicine } = require('../src/models/medicine.model');
const { Order } = require('../src/models/order.model');
const { DoseSchedule } = require('../src/models/doseSchedule.model');
const { DoseLog } = require('../src/models/doseLog.model');

// Helper to get next Monday's date string (guaranteed working day for doctors)
const getNextMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(10, 0, 0, 0);
  return d;
};

describe('Meditrace End-to-End User Lifecycle & Platform Workflow', () => {
  let patientToken;
  let patientId;
  let doctorToken;
  let retailerToken;
  let doctorId;
  let retailerId;
  let brandInventoryId;
  let genericInventoryId;
  let prescriptionId;
  let medicineId;
  let doseId;
  let orderId;

  // 1. Multi-role Registration & Profiles
  describe('Step 1: Multi-role Registration & Profiles', () => {
    it('should register a patient and receive authentication tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Vikram Mehta',
          email: 'vikram.patient@test.com',
          password: 'Password123!',
          role: 'patient',
          phone: '+91 99887 76655'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      patientToken = res.body.data.accessToken;
      patientId = res.body.data.user._id;
    });

    it('should register a doctor and create a clinical consultation profile', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Sunita Rao',
          email: 'dr.sunita@test.com',
          password: 'Password123!',
          role: 'doctor'
        });

      expect(regRes.status).toBe(201);
      doctorToken = regRes.body.data.accessToken;

      const profileRes = await request(app)
        .post('/api/v1/doctors/profile/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Dr. Sunita Rao',
          specialization: 'Cardiologist',
          qualification: 'MBBS, MD',
          experience_years: 12,
          clinic_address: {
            clinic_name: 'Metro Heart Care',
            city: 'Bengaluru',
            street: '14th Cross, Malleshwaram'
          },
          fee: 650,
          available_days: [1, 2, 3, 4, 5],
          available_time_slots: [
            { start_time: '10:00', end_time: '12:00' }
          ],
          slot_duration_minutes: 30
        });

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.doctor.specialization).toBe('Cardiologist');
      doctorId = profileRes.body.data.doctor._id;
    });

    it('should register a licensed retailer and populate pharmacy inventory', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'HealthPlus Pharmacy',
          email: 'healthplus@test.com',
          password: 'Password123!',
          role: 'retailer'
        });

      expect(regRes.status).toBe(201);
      retailerToken = regRes.body.data.accessToken;

      const profileRes = await request(app)
        .post('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          shop_name: 'HealthPlus Pharmacy Malleshwaram',
          licence_number: 'KA-BLR-2024-5544',
          phone: '+918023344556',
          address: {
            street: 'Sampige Road, Malleshwaram',
            city: 'Bengaluru',
            state: 'Karnataka',
            zipCode: '560003'
          },
          latitude: 13.0031,
          longitude: 77.5713
        });

      expect(profileRes.status).toBe(200);
      retailerId = profileRes.body.data.profile._id;

      // Add Branded item to inventory
      const brandRes = await request(app)
        .post('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          medicine_name: 'Telmisartan 40mg',
          generic_name: 'Telmisartan',
          salt_composition: 'Telmisartan 40mg',
          dosage_form: 'tablet',
          strength: '40mg',
          price: 90,
          mrp: 110,
          quantity: 100,
          requires_prescription: true
        });

      expect(brandRes.status).toBe(201);
      brandInventoryId = brandRes.body.data.item._id;

      // Add Generic item to inventory
      const genRes = await request(app)
        .post('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          medicine_name: 'Telma 40 Generic',
          generic_name: 'Telmisartan',
          salt_composition: 'Telmisartan 40mg',
          dosage_form: 'tablet',
          strength: '40mg',
          price: 45,
          mrp: 110,
          quantity: 250,
          requires_prescription: true
        });

      expect(genRes.status).toBe(201);
      genericInventoryId = genRes.body.data.item._id;
    });
  });

  // 2. Doctor Discovery & Appointment Booking
  describe('Step 2: Doctor Discovery & Appointment Booking', () => {
    it('should search doctors by specialization and city', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?specialization=Cardiologist&city=Bengaluru')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.doctors.length).toBeGreaterThanOrEqual(1);
    });

    it('should fetch available slots and book an appointment with anti-double-booking protection', async () => {
      const nextMon = getNextMonday();
      const dateStr = nextMon.toISOString().split('T')[0];

      const slotsRes = await request(app)
        .get(`/api/v1/doctors/${doctorId}/slots?date=${dateStr}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(slotsRes.status).toBe(200);
      expect(slotsRes.body.data.isAvailableDay).toBe(true);
      expect(slotsRes.body.data.totalSlots).toBeGreaterThanOrEqual(1);

      // Book slot
      const bookRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorId,
          slot_start: nextMon.toISOString(),
          reason: 'Routine BP evaluation',
          consultation_type: 'in_person'
        });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.data.appointment.status).toBe('booked');

      // Attempt double-booking same slot
      const conflictRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_id: doctorId,
          slot_start: nextMon.toISOString(),
          reason: 'Duplicate attempt'
        });

      expect(conflictRes.status).toBe(409);
    });
  });

  // 3. Prescription Upload & Medicine Cabinet
  describe('Step 3: Prescription Upload & Cabinet Stock Setup', () => {
    it('should upload a prescription and catalogue prescribed medicine', async () => {
      const rxRes = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor_name: 'Dr. Sunita Rao',
          diagnosis: 'Cardiology prescription for blood pressure management.',
          medicines: [
            {
              name: 'Telmisartan 40mg',
              dosage: '40mg',
              frequency: 'Once daily',
              duration: '30 days',
              instructions: 'Take 1 tablet every morning after food'
            }
          ]
        });

      expect(rxRes.status).toBe(201);
      prescriptionId = rxRes.body.data.prescription._id;

      // Add to patient medicine cabinet
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      const medRes = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Telmisartan 40mg',
          dosage_form: 'tablet',
          strength: '40mg',
          quantity: 10,
          expiry_date: expiry.toISOString().split('T')[0],
          prescription_id: prescriptionId
        });

      expect(medRes.status).toBe(201);
      expect(medRes.body.data.medicine.quantity).toBe(10);
      medicineId = medRes.body.data.medicine._id;
    });
  });

  // 4. Dose Scheduling & Automated Stock Deduction
  describe('Step 4: Dose Scheduling & Automatic Stock Deduction upon Dose Taken', () => {
    it('should create schedule, generate today dose log, and auto-deduct stock when marked taken', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      const schedRes = await request(app)
        .post(`/api/v1/medicines/${medicineId}/schedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          dose_amount: '1 tablet',
          times_per_day: 1,
          specific_times: ['09:00'],
          food_instruction: 'after_food',
          start_date: todayStr,
          days_of_week: [0, 1, 2, 3, 4, 5, 6]
        });

      expect(schedRes.status).toBe(201);

      // Check today's dose schedule
      const todayRes = await request(app)
        .get('/api/v1/schedule/today')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(todayRes.status).toBe(200);
      const dose = todayRes.body.data.doses.find(d => d.medicine_id?._id?.toString() === medicineId.toString());
      expect(dose).toBeDefined();
      doseId = dose._id;

      // Mark dose as taken
      const takeRes = await request(app)
        .post(`/api/v1/doses/${doseId}/take`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(takeRes.status).toBe(200);
      expect(takeRes.body.data.dose.status).toBe('taken');

      // Verify that medicine cabinet stock automatically decreased from 10 to 9
      const updatedMed = await Medicine.findById(medicineId);
      expect(updatedMed.quantity).toBe(9);
    });
  });

  // 5. Stock Analytics, Finish Date Forecast & Expiry Tracker
  describe('Step 5: Stock Analytics & Low Stock Forecasting', () => {
    it('should compute predicted finish date and consumption rate based on active schedules', async () => {
      const stockRes = await request(app)
        .get('/api/v1/stock')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(stockRes.status).toBe(200);
      expect(stockRes.body.data.stockItems.length).toBeGreaterThanOrEqual(1);
      const item = stockRes.body.data.stockItems.find(m => m.name === 'Telmisartan 40mg');
      expect(item).toBeDefined();
      expect(item.quantity).toBe(9);
      expect(item.dailyConsumption).toBe(1);
      expect(item.daysRemaining).toBe(9);
      expect(item).toHaveProperty('predictedFinishDate');
    });
  });

  // 6. Chemist Discovery & Generic Alternatives
  describe('Step 6: Chemist Discovery & Generic Alternatives Comparison', () => {
    it('should locate nearby partner chemists using 2dsphere index', async () => {
      const chemRes = await request(app)
        .get('/api/v1/chemists/nearby?latitude=13.0031&longitude=77.5713&radius=10')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(chemRes.status).toBe(200);
      expect(chemRes.body.data.chemists.length).toBeGreaterThanOrEqual(1);
    });

    it('should search medicine catalogue and suggest generic alternative with cost savings', async () => {
      const searchRes = await request(app)
        .get('/api/v1/shop/search?query=Telmisartan')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.results.length).toBeGreaterThanOrEqual(1);

      // Compare Generics
      const genRes = await request(app)
        .get(`/api/v1/shop/alternatives/${brandInventoryId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(genRes.status).toBe(200);
      expect(genRes.body.data.alternatives.length).toBeGreaterThanOrEqual(1);
      const genericAlternative = genRes.body.data.alternatives[0];
      expect(genericAlternative.savings_percentage).toBe(50); // ₹45 vs ₹90 (50% savings)
    });
  });

  // 7. Order Placement, Payment Session & Webhook Confirmation
  describe('Step 7: Shopping Cart, Order Placement & Payment Confirmation', () => {
    it('should place order for medicine and confirm test payment via webhook', async () => {
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          retailer_id: retailerId,
          items: [
            {
              inventory_id: brandInventoryId,
              quantity: 20
            }
          ],
          prescription_id: prescriptionId,
          delivery_address: {
            street: '12th Main Road, Malleshwaram',
            city: 'Bengaluru',
            phone: '9988776655'
          }
        });

      expect(orderRes.status).toBe(201);
      orderId = orderRes.body.data.order._id;

      // Initialize Payment Session
      const sessionRes = await request(app)
        .post('/api/v1/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          order_id: orderId,
          method: 'upi'
        });

      expect(sessionRes.status).toBe(200);
      expect(sessionRes.body.data.gateway_order_id).toBeDefined();

      // Simulate Gateway Webhook Confirmation
      const webhookRes = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: orderId,
          gateway_payment_id: `pay_${Date.now()}`,
          status: 'captured'
        });

      expect(webhookRes.status).toBe(200);

      // Verify order payment status is paid
      const confirmedOrder = await Order.findById(orderId);
      expect(confirmedOrder.payment_status).toBe('paid');
    });
  });

  // 8. Order Delivery & Automatic Cabinet Stock Increment
  describe('Step 8: Delivery Progression & Automatic Patient Cabinet Stock Restock', () => {
    it('should update order to delivered and automatically add 20 units to patient medicine cabinet', async () => {
      // Prior stock was 9
      const priorMed = await Medicine.findById(medicineId);
      expect(priorMed.quantity).toBe(9);

      // Retailer updates order status to delivered
      const updateRes = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ status: 'delivered', note: 'Package delivered at door' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.order.order_status).toBe('delivered');

      // Verify automatic stock addition: 9 + 20 = 29 units!
      const restockedMed = await Medicine.findById(medicineId);
      expect(restockedMed.quantity).toBe(29);
    });
  });

  // 9. OCR Scan & Auto-Fill Handoff
  describe('Step 9: OCR Strip Scanner & Barcode Lookup', () => {
    it('should scan raw text from medicine strip and auto-fill into cabinet', async () => {
      const scanRes = await request(app)
        .post('/api/v1/scan/image')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          raw_text: 'PARACETAMOL 500mg TABLETS IP\nBatch No: B240918\nMFG: 01/2024\nEXPIRY DATE: 12/2027\nMFD BY: SUN PHARMACEUTICAL'
        });

      expect(scanRes.status).toBe(200);
      expect(scanRes.body.data.scan.extracted_name).toContain('PARACETAMOL 500mg');
      expect(scanRes.body.data.scan.extracted_batch).toBe('B240918');
      expect(scanRes.body.data.scan.confidence).toBeGreaterThanOrEqual(80);

      // Confirm autofill into cabinet
      const addRes = await request(app)
        .post('/api/v1/medicines')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(scanRes.body.data.autofill);

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.medicine.name).toBe('PARACETAMOL 500mg');
    });
  });
});
