const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Retailer } = require('../src/models/retailer.model');
const { RetailerInventory } = require('../src/models/retailerInventory.model');

const retailerUser = {
  name: 'Apollo Chemist Owner',
  email: 'apollo@chemist.com',
  password: 'SecurePass1',
  role: 'retailer'
};

const patientUser = {
  name: 'General Patient',
  email: 'gen_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let retailerToken;
let patientToken;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Retailer.deleteMany({}),
    RetailerInventory.deleteMany({})
  ]);

  // Register retailer
  const retRes = await request(app).post('/api/v1/auth/register').send(retailerUser);
  retailerToken = retRes.body.data.accessToken;

  // Register patient
  const patRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  patientToken = patRes.body.data.accessToken;
});

describe('Retailer Portal & Chemist Finder Routes', () => {
  describe('Retailer Profile Management', () => {
    it('should create and retrieve retailer store profile with geospatial coordinates', async () => {
      const res = await request(app)
        .post('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          shop_name: 'Apollo Pharmacy Connaught Place',
          licence_number: 'DL-ND-2024-88991',
          phone: '+911123456789',
          address: {
            street: '12 Regal Building, CP',
            city: 'New Delhi',
            state: 'Delhi',
            zipCode: '110001'
          },
          latitude: 28.6315,
          longitude: 77.2167,
          opening_hours: '08:00 - 23:00'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.shop_name).toBe('Apollo Pharmacy Connaught Place');
      expect(res.body.data.profile.location.coordinates).toEqual([77.2167, 28.6315]);

      // Retrieve profile
      const getRes = await request(app)
        .get('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${retailerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.profile.licence_number).toBe('DL-ND-2024-88991');
    });

    it('should deny non-retailer access to retailer profile', async () => {
      const res = await request(app)
        .get('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('INSUFFICIENT_ROLE');
    });
  });

  describe('Retailer Inventory Management', () => {
    beforeEach(async () => {
      // Set up retailer profile first
      await request(app)
        .post('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          shop_name: 'City Meds',
          licence_number: 'DL-CITY-1122',
          address: { city: 'New Delhi' },
          latitude: 28.6139,
          longitude: 77.2090
        });
    });

    it('should add, list, update and delete inventory items', async () => {
      // 1. Add item
      const addRes = await request(app)
        .post('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          medicine_name: 'Metformin 500mg',
          generic_name: 'Metformin Hydrochloride',
          salt_composition: 'Metformin (500mg)',
          dosage_form: 'tablet',
          strength: '500mg',
          price: 45,
          quantity: 150,
          discount_percentage: 10
        });

      expect(addRes.status).toBe(201);
      const itemId = addRes.body.data.item._id;
      expect(addRes.body.data.item.medicine_name).toBe('Metformin 500mg');

      // 2. List items
      const listRes = await request(app)
        .get('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBe(1);

      // 3. Update item
      const updateRes = await request(app)
        .put(`/api/v1/retailer/inventory/${itemId}`)
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ price: 40, quantity: 200 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.item.price).toBe(40);
      expect(updateRes.body.data.item.quantity).toBe(200);

      // 4. Delete item
      const delRes = await request(app)
        .delete(`/api/v1/retailer/inventory/${itemId}`)
        .set('Authorization', `Bearer ${retailerToken}`);

      expect(delRes.status).toBe(200);
    });
  });

  describe('Chemist Finder & Map Discovery', () => {
    let chemistAId;

    beforeEach(async () => {
      // Chemist A in Central Delhi (28.6315, 77.2167)
      const resA = await request(app)
        .post('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          shop_name: 'Delhi Central Pharmacy',
          licence_number: 'LIC-DELHI-001',
          address: { city: 'New Delhi' },
          latitude: 28.6315,
          longitude: 77.2167
        });
      chemistAId = resA.body.data.profile._id;

      // Add Dolo 650 to Chemist A
      await request(app)
        .post('/api/v1/retailer/inventory')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          medicine_name: 'Dolo 650mg',
          price: 32,
          quantity: 50
        });

      // Register Retailer 2 in Noida (~22 km away: 28.5355, 77.3910)
      const ret2Res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Noida Chemist',
          email: 'noida@chemist.com',
          password: 'SecurePass1',
          role: 'retailer'
        });
      const ret2Token = ret2Res.body.data.accessToken;

      await request(app)
        .post('/api/v1/retailer/profile')
        .set('Authorization', `Bearer ${ret2Token}`)
        .send({
          shop_name: 'Noida Sector 18 Meds',
          licence_number: 'LIC-NOIDA-002',
          address: { city: 'Noida' },
          latitude: 28.5355,
          longitude: 77.3910
        });
    });

    it('should find nearby chemists within specified radius using 2dsphere index', async () => {
      // Query from Delhi center (28.6300, 77.2150) with radius 5km -> only Delhi Central Chemist
      const res = await request(app)
        .get('/api/v1/chemists/nearby?latitude=28.6300&longitude=77.2150&radius=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalFound).toBe(1);
      expect(res.body.data.chemists[0].shop_name).toBe('Delhi Central Pharmacy');
      expect(res.body.data.chemists[0].distance_km).toBeLessThan(1);
    });

    it('should find both chemists when radius is enlarged to 30km', async () => {
      const res = await request(app)
        .get('/api/v1/chemists/nearby?latitude=28.6300&longitude=77.2150&radius=30');

      expect(res.status).toBe(200);
      expect(res.body.data.totalFound).toBe(2);
    });

    it('should search which chemists stock a medicine and sort by distance', async () => {
      const res = await request(app)
        .get('/api/v1/chemists/search?name=Dolo&latitude=28.6300&longitude=77.2150');

      expect(res.status).toBe(200);
      expect(res.body.data.totalStockists).toBe(1);
      expect(res.body.data.results[0].medicine_name).toBe('Dolo 650mg');
      expect(res.body.data.results[0].in_stock_quantity).toBe(50);
      expect(res.body.data.results[0].chemist.shop_name).toBe('Delhi Central Pharmacy');
    });

    it('should retrieve chemist details and complete catalog by ID', async () => {
      const res = await request(app).get(`/api/v1/chemists/${chemistAId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.chemist.shop_name).toBe('Delhi Central Pharmacy');
      expect(res.body.data.inventoryCount).toBe(1);
      expect(res.body.data.inventory[0].medicine_name).toBe('Dolo 650mg');
    });
  });
});
