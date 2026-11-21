const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Retailer } = require('../src/models/retailer.model');
const { RetailerInventory } = require('../src/models/retailerInventory.model');
const { Prescription } = require('../src/models/prescription.model');
const { Medicine } = require('../src/models/medicine.model');
const { Order } = require('../src/models/order.model');
const { Cart } = require('../src/models/cart.model');
const { Payment } = require('../src/models/payment.model');

const retailerUser = {
  name: 'MedPlus Store Owner',
  email: 'medplus@shop.com',
  password: 'SecurePass1',
  role: 'retailer'
};

const patientUser = {
  name: 'Cart Patient',
  email: 'cart_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let retailerToken;
let patientToken;
let patientId;
let retailerId;
let brandInventoryId;
let genericInventoryId;
let prescriptionId;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Retailer.deleteMany({}),
    RetailerInventory.deleteMany({}),
    Prescription.deleteMany({}),
    Medicine.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Payment.deleteMany({})
  ]);

  // Register Retailer
  const retRes = await request(app).post('/api/v1/auth/register').send(retailerUser);
  retailerToken = retRes.body.data.accessToken;

  // Set up Retailer profile
  const profRes = await request(app)
    .post('/api/v1/retailer/profile')
    .set('Authorization', `Bearer ${retailerToken}`)
    .send({
      shop_name: 'MedPlus Pharmacy',
      licence_number: 'DL-MEDPLUS-900',
      address: { city: 'Bengaluru' },
      latitude: 12.9716,
      longitude: 77.5946
    });
  retailerId = profRes.body.data.profile._id;

  // Add Brand Name Drug (Dolo 650mg, Price ₹35)
  const brandRes = await request(app)
    .post('/api/v1/retailer/inventory')
    .set('Authorization', `Bearer ${retailerToken}`)
    .send({
      medicine_name: 'Dolo 650mg',
      generic_name: 'Paracetamol',
      salt_composition: 'Paracetamol 650mg',
      dosage_form: 'tablet',
      price: 35,
      quantity: 50,
      requires_prescription: false
    });
  brandInventoryId = brandRes.body.data.item._id;

  // Add Cheaper Generic Alternative (Generic Paracetamol 650mg, Price ₹15)
  const genRes = await request(app)
    .post('/api/v1/retailer/inventory')
    .set('Authorization', `Bearer ${retailerToken}`)
    .send({
      medicine_name: 'Generic Paracetamol 650mg',
      generic_name: 'Paracetamol',
      salt_composition: 'Paracetamol 650mg',
      dosage_form: 'tablet',
      price: 15,
      quantity: 100,
      requires_prescription: false
    });
  genericInventoryId = genRes.body.data.item._id;

  // Register Patient
  const patRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  patientToken = patRes.body.data.accessToken;
  patientId = patRes.body.data.user._id;

  // Create an approved prescription for testing Rx validation
  const rxRes = await request(app)
    .post('/api/v1/prescriptions')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({
      doctor_name: 'Dr. Banner',
      notes: 'Take with water'
    });
  prescriptionId = rxRes.body.data.prescription._id;
});

describe('Shop, Cart, Orders & Payments Flow', () => {
  describe('Shop Search & Generic Alternatives', () => {
    it('should search medicines across partner retailers', async () => {
      const res = await request(app).get('/api/v1/shop/search?query=Paracetamol');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBe(2);
    });

    it('should suggest cheaper generic alternatives with the same salt composition', async () => {
      const res = await request(app).get(`/api/v1/shop/alternatives/${brandInventoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cheaperAlternativesCount).toBe(1);
      const alt = res.body.data.alternatives[0];
      expect(alt.medicine_name).toBe('Generic Paracetamol 650mg');
      expect(alt.final_price).toBe(15);
      expect(alt.savings_percentage).toBeGreaterThan(50); // ₹35 down to ₹15
    });
  });

  describe('Shopping Cart Flow', () => {
    it('should add items, view cart, update quantity and compute totals', async () => {
      // 1. Add to cart
      const addRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          inventory_id: genericInventoryId,
          quantity: 2
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.itemCount).toBe(1);
      expect(addRes.body.data.subtotal).toBe(30); // 2 * 15

      const cartItemId = addRes.body.data.items[0]._id;

      // 2. Update quantity
      const updateRes = await request(app)
        .put(`/api/v1/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ quantity: 4 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.subtotal).toBe(60); // 4 * 15
    });
  });

  describe('Order Placement & Prescription Check', () => {
    it('should require a valid prescription for prescription-only medicines', async () => {
      // Add prescription-only medicine to inventory
      const rxDrugRes = await request(app)
        .post('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          medicine_name: 'Amoxicillin 500mg',
          price: 120,
          quantity: 20,
          requires_prescription: true
        });
      const rxDrugId = rxDrugRes.body.data.item._id;

      // Try placing order without prescription_id -> MUST FAIL
      const failRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          retailer_id: retailerId,
          items: [{ inventory_id: rxDrugId, quantity: 1 }],
          delivery_address: {
            street: 'MG Road',
            city: 'Bengaluru',
            phone: '9876543210'
          }
        });

      expect(failRes.status).toBe(400);
      expect(failRes.body.errorCode).toBe('PRESCRIPTION_REQUIRED');

      // Now place order with valid prescription_id -> SUCCEEDS
      const passRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          retailer_id: retailerId,
          items: [{ inventory_id: rxDrugId, quantity: 1 }],
          prescription_id: prescriptionId,
          delivery_address: {
            street: 'MG Road',
            city: 'Bengaluru',
            phone: '9876543210'
          }
        });

      expect(passRes.status).toBe(201);
      expect(passRes.body.data.order.order_status).toBe('placed');
    });
  });

  describe('Order Lifecycle, Payment & Automatic Stock Update upon Delivery', () => {
    let orderId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          retailer_id: retailerId,
          items: [{ inventory_id: brandInventoryId, quantity: 5 }],
          delivery_address: {
            street: 'Brigade Road',
            city: 'Bengaluru',
            phone: '9876543210'
          }
        });
      orderId = orderRes.body.data.order._id;
    });

    it('should initialize payment session and confirm via webhook', async () => {
      // 1. Create payment session
      const payRes = await request(app)
        .post('/api/v1/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          order_id: orderId,
          method: 'upi'
        });

      expect(payRes.status).toBe(200);
      expect(payRes.body.data).toHaveProperty('gateway_order_id');

      // 2. Simulate payment confirmation webhook
      const webhookRes = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          order_id: orderId,
          gateway_payment_id: 'pay_test_capture_991',
          status: 'captured'
        });

      expect(webhookRes.status).toBe(200);

      // Verify order payment status is paid
      const checkOrder = await Order.findById(orderId);
      expect(checkOrder.payment_status).toBe('paid');
    });

    it('should track delivery status progression and auto-update patient stock when delivered', async () => {
      // 1. Retailer confirms order
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ status: 'confirmed', note: 'Order accepted by chemist' });

      // 2. Retailer packs order
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ status: 'packed', note: 'Medicines packed securely' });

      // 3. Retailer marks out for delivery
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ status: 'out_for_delivery', note: 'Courier on the way' });

      // Verify tracking array has entries
      const trackRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(trackRes.body.data.order.delivery_tracking.length).toBe(4);

      // 4. Retailer marks delivered -> MUST AUTOMATICALLY UPDATE PATIENT MEDICINE STOCK!
      const deliverRes = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ status: 'delivered', note: 'Handed over to patient' });

      expect(deliverRes.status).toBe(200);
      expect(deliverRes.body.data.order.order_status).toBe('delivered');

      // VERIFY PATIENT STOCK IN MEDITRACE
      const patientMed = await Medicine.findOne({
        patient_id: patientId,
        name: 'Dolo 650mg'
      });

      expect(patientMed).toBeDefined();
      expect(patientMed.quantity).toBe(5); // Ordered quantity automatically added to stock!
    });
  });
});
