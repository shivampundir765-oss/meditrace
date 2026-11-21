const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/user.model');
const Doctor = require('./models/doctor.model');
const Retailer = require('./models/retailer.model');
const RetailerInventory = require('./models/retailerInventory.model');
const Medicine = require('./models/medicine.model');
const Prescription = require('./models/prescription.model');
const DoseSchedule = require('./models/doseSchedule.model');
const DoseLog = require('./models/doseLog.model');
const Order = require('./models/order.model');
const Notification = require('./models/notification.model');

async function runSeed(mongoUri) {
  const uri = mongoUri || env.MONGODB_URI || 'mongodb://localhost:27017/meditrace';
  console.log(`Connecting to MongoDB at: ${uri}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  console.log('--- Cleaning Existing Meditrace Demo Data ---');
  await Promise.all([
    User.deleteMany({ email: { $in: [
      'admin@meditrace.com',
      'patient@meditrace.com',
      'sarah.patient@meditrace.com',
      'dr.sharma@meditrace.com',
      'dr.priya@meditrace.com',
      'apollo.indiranagar@meditrace.com',
      'medplus.koramangala@meditrace.com'
    ] } }),
    Doctor.deleteMany({}),
    Retailer.deleteMany({}),
    RetailerInventory.deleteMany({}),
    Medicine.deleteMany({}),
    Prescription.deleteMany({}),
    DoseSchedule.deleteMany({}),
    DoseLog.deleteMany({}),
    Order.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('--- Seeding Platform Users ---');
  const defaultPassword = 'Password123!';

  // 1. Admin
  await User.create({
    name: 'Meditrace Administrator',
    email: 'admin@meditrace.com',
    password: defaultPassword,
    role: 'admin',
    phone: '+91 80 1234 5678'
  });

  // 2. Patients
  const patient1 = await User.create({
    name: 'Arjun Rao',
    email: 'patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 43210',
    emergencyContact: '+91 98765 00000',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });

  await User.create({
    name: 'Sarah Khan',
    email: 'sarah.patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 43211',
    emergencyContact: '+91 98765 11111'
  });

  // 3. Doctors
  const doctorUser1 = await User.create({
    name: 'Dr. Ramesh Sharma',
    email: 'dr.sharma@meditrace.com',
    password: defaultPassword,
    role: 'doctor',
    phone: '+91 80 4455 6677'
  });

  const doctorUser2 = await User.create({
    name: 'Dr. Priya Patel',
    email: 'dr.priya@meditrace.com',
    password: defaultPassword,
    role: 'doctor',
    phone: '+91 80 5566 7788'
  });

  // Doctor Profiles
  await Doctor.create({
    user: doctorUser1._id,
    name: doctorUser1.name,
    specialization: 'Cardiologist',
    consultationFee: 700,
    experienceYears: 15,
    clinicAddress: {
      street: '100ft Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038'
    },
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    availableTimeSlots: [
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '17:00' }
    ],
    slotDurationMinutes: 30
  });

  await Doctor.create({
    user: doctorUser2._id,
    name: doctorUser2.name,
    specialization: 'Dermatologist',
    consultationFee: 500,
    experienceYears: 10,
    clinicAddress: {
      street: '80ft Road, 4th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034'
    },
    availableDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    availableTimeSlots: [
      { start: '10:00', end: '14:00' },
      { start: '15:00', end: '18:00' }
    ],
    slotDurationMinutes: 30
  });

  // 4. Retailers
  const retailerUser1 = await User.create({
    name: 'Apollo Pharmacy Indiranagar',
    email: 'apollo.indiranagar@meditrace.com',
    password: defaultPassword,
    role: 'retailer',
    phone: '+91 80 2525 1122'
  });

  const retailerUser2 = await User.create({
    name: 'MedPlus Pharmacy Koramangala',
    email: 'medplus.koramangala@meditrace.com',
    password: defaultPassword,
    role: 'retailer',
    phone: '+91 80 4141 3344'
  });

  // Retailer Profiles with GeoJSON [longitude, latitude]
  const retailer1 = await Retailer.create({
    user: retailerUser1._id,
    storeName: 'Apollo Pharmacy Indiranagar',
    drugLicenceNumber: 'KA-BLR-2024-9988',
    phone: '+91 80 2525 1122',
    is24x7: true,
    location: {
      type: 'Point',
      coordinates: [77.6408, 12.9784]
    },
    address: {
      street: '12th Main, HAL 2nd Stage, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038'
    }
  });

  const retailer2 = await Retailer.create({
    user: retailerUser2._id,
    storeName: 'MedPlus Pharmacy Koramangala',
    drugLicenceNumber: 'KA-BLR-2024-1122',
    phone: '+91 80 4141 3344',
    is24x7: false,
    openingHours: '08:00 AM - 11:00 PM',
    location: {
      type: 'Point',
      coordinates: [77.6271, 12.9352]
    },
    address: {
      street: '5th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034'
    }
  });

  console.log('--- Seeding Retailer Inventories (Branded & Generics) ---');
  await RetailerInventory.create([
    {
      retailer: retailer1._id,
      name: 'Dolo 650',
      saltFormula: 'Paracetamol',
      strength: '650mg',
      dosageForm: 'tablet',
      price: 32,
      mrp: 35,
      quantity: 250,
      prescriptionRequired: false
    },
    {
      retailer: retailer1._id,
      name: 'Paracip 650 (Generic)',
      saltFormula: 'Paracetamol',
      strength: '650mg',
      dosageForm: 'tablet',
      price: 18,
      mrp: 35,
      quantity: 500,
      prescriptionRequired: false
    },
    {
      retailer: retailer1._id,
      name: 'Glyciphage 500',
      saltFormula: 'Metformin Hydrochloride',
      strength: '500mg',
      dosageForm: 'tablet',
      price: 48,
      mrp: 52,
      quantity: 140,
      prescriptionRequired: true
    },
    {
      retailer: retailer1._id,
      name: 'Bigomet 500 (Generic)',
      saltFormula: 'Metformin Hydrochloride',
      strength: '500mg',
      dosageForm: 'tablet',
      price: 25,
      mrp: 52,
      quantity: 350,
      prescriptionRequired: true
    },
    {
      retailer: retailer1._id,
      name: 'Augmentin 625 Duo',
      saltFormula: 'Amoxicillin + Clavulanic Acid',
      strength: '625mg',
      dosageForm: 'tablet',
      price: 135,
      mrp: 155,
      quantity: 80,
      prescriptionRequired: true
    },
    {
      retailer: retailer2._id,
      name: 'Dolo 650',
      saltFormula: 'Paracetamol',
      strength: '650mg',
      dosageForm: 'tablet',
      price: 30,
      mrp: 35,
      quantity: 300,
      prescriptionRequired: false
    },
    {
      retailer: retailer2._id,
      name: 'Cetzine 10mg',
      saltFormula: 'Cetirizine Hydrochloride',
      strength: '10mg',
      dosageForm: 'tablet',
      price: 22,
      mrp: 28,
      quantity: 400,
      prescriptionRequired: false
    },
    {
      retailer: retailer2._id,
      name: 'D-Rise 60k',
      saltFormula: 'Cholecalciferol',
      strength: '60000 IU',
      dosageForm: 'capsule',
      price: 175,
      mrp: 200,
      quantity: 90,
      prescriptionRequired: false
    }
  ]);

  console.log('--- Seeding Patient Medicine Cabinet & Schedules ---');
  const futureExpiry = new Date();
  futureExpiry.setFullYear(futureExpiry.getFullYear() + 2);

  const expiringSoon = new Date();
  expiringSoon.setDate(expiringSoon.getDate() + 8);

  const medDolo = await Medicine.create({
    user: patient1._id,
    name: 'Dolo 650',
    dosageForm: 'tablet',
    strength: '650mg',
    quantity: 14,
    expiryDate: futureExpiry,
    batchNumber: 'B240918',
    manufacturer: 'Micro Labs Ltd.'
  });

  const medMetformin = await Medicine.create({
    user: patient1._id,
    name: 'Metformin 500mg',
    dosageForm: 'tablet',
    strength: '500mg',
    quantity: 3, // LOW STOCK TRIGGER (threshold = 5)
    expiryDate: futureExpiry,
    batchNumber: 'GLY-8871',
    manufacturer: 'Franco-Indian Pharma'
  });

  await Medicine.create({
    user: patient1._id,
    name: 'Vitamin D3 60k',
    dosageForm: 'capsule',
    strength: '60000 IU',
    quantity: 4,
    expiryDate: expiringSoon, // EXPIRING SOON TRIGGER (< 10 days)
    batchNumber: 'VITD-102',
    manufacturer: 'USV Private Limited'
  });

  // Dose Schedules
  const scheduleDolo = await DoseSchedule.create({
    user: patient1._id,
    medicine: medDolo._id,
    dailyFrequency: 2,
    timings: ['09:00', '21:00'],
    foodInstruction: 'after_food',
    startDate: new Date()
  });

  const scheduleMetformin = await DoseSchedule.create({
    user: patient1._id,
    medicine: medMetformin._id,
    dailyFrequency: 1,
    timings: ['08:30'],
    foodInstruction: 'before_food',
    startDate: new Date()
  });

  // Dose Logs for Today
  const todayStr = new Date().toISOString().split('T')[0];
  await DoseLog.create([
    {
      user: patient1._id,
      schedule: scheduleDolo._id,
      medicine: medDolo._id,
      scheduledDate: todayStr,
      scheduledTime: '09:00',
      status: 'taken',
      takenAt: new Date()
    },
    {
      user: patient1._id,
      schedule: scheduleDolo._id,
      medicine: medDolo._id,
      scheduledDate: todayStr,
      scheduledTime: '21:00',
      status: 'pending'
    },
    {
      user: patient1._id,
      schedule: scheduleMetformin._id,
      medicine: medMetformin._id,
      scheduledDate: todayStr,
      scheduledTime: '08:30',
      status: 'pending'
    }
  ]);

  console.log('--- Seeding Doctor Prescription & Orders ---');
  const prescription = await Prescription.create({
    user: patient1._id,
    doctorName: 'Dr. Ramesh Sharma',
    notes: 'Hypertension and routine blood sugar regulation.',
    issuedDate: new Date(),
    medicines: [
      {
        name: 'Metformin 500mg',
        strength: '500mg',
        dosageForm: 'tablet',
        durationDays: 30,
        instructions: 'Once daily before breakfast'
      },
      {
        name: 'Dolo 650',
        strength: '650mg',
        dosageForm: 'tablet',
        durationDays: 5,
        instructions: 'As needed for fever/headache'
      }
    ]
  });

  // Sample Order in Progress
  await Order.create({
    user: patient1._id,
    retailer: retailer1._id,
    items: [
      {
        medicine: medDolo._id,
        name: 'Dolo 650',
        quantity: 2,
        price: 32
      }
    ],
    totalAmount: 64,
    deliveryAddress: {
      street: '42 Orchid Residency, 6th Main',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038'
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'confirmed',
    prescription: prescription._id
  });

  // Initial Notifications
  await Notification.create([
    {
      user: patient1._id,
      title: 'Low Stock Alert',
      message: 'Your medicine "Metformin 500mg" is running low (3 units left). Please arrange a refill.',
      type: 'low_stock',
      priority: 'high'
    },
    {
      user: patient1._id,
      title: 'Medicine Expiring Soon',
      message: 'Your medicine "Vitamin D3 60k" expires in 8 days.',
      type: 'expiry_alert',
      priority: 'medium'
    }
  ]);

  console.log('\n======================================================');
  console.log('✅ Meditrace Database Seeding Completed Successfully!');
  console.log('======================================================');
  console.log('Demo Credentials (all passwords: "Password123!"):');
  console.log('  👑 Admin:     admin@meditrace.com');
  console.log('  👤 Patient 1: patient@meditrace.com (Arjun Rao)');
  console.log('  👤 Patient 2: sarah.patient@meditrace.com (Sarah Khan)');
  console.log('  🩺 Doctor 1:  dr.sharma@meditrace.com (Cardiologist, Bangalore)');
  console.log('  🩺 Doctor 2:  dr.priya@meditrace.com (Dermatologist, Bangalore)');
  console.log('  🏪 Retailer 1: apollo.indiranagar@meditrace.com (Apollo Pharmacy)');
  console.log('  🏪 Retailer 2: medplus.koramangala@meditrace.com (MedPlus Pharmacy)');
  console.log('======================================================\n');

  return { success: true };
}

module.exports = { runSeed };

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
