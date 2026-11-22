const mongoose = require('mongoose');
const env = require('./config/env');
const { User } = require('./models/user.model');
const { Doctor } = require('./models/doctor.model');
const { Retailer } = require('./models/retailer.model');
const { RetailerInventory } = require('./models/retailerInventory.model');
const { Medicine } = require('./models/medicine.model');
const { Prescription } = require('./models/prescription.model');
const { DoseSchedule } = require('./models/doseSchedule.model');
const { DoseLog } = require('./models/doseLog.model');
const { Order } = require('./models/order.model');
const { Notification } = require('./models/notification.model');
const { Catalog } = require('./models/catalog.model');
const { CatalogMedicine } = require('./models/catalogMedicine.model');
const { Facility } = require('./models/facility.model');
const { HEALTHCARE_FACILITIES } = require('./data/facilityData');

async function runSeed(mongoUri) {
  const uri = mongoUri || env.MONGODB_URI || 'mongodb://localhost:27017/meditrace';
  console.log(`Connecting to MongoDB for seed at: ${uri}`);

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
    Notification.deleteMany({}),
    Catalog.deleteMany({}),
    CatalogMedicine.deleteMany({})
  ]);

  console.log('--- Seeding Platform Users ---');
  const defaultPassword = 'Password123!';

  // 1. Admin User
  await User.create({
    name: 'Meditrace Administrator',
    email: 'admin@meditrace.com',
    password: defaultPassword,
    role: 'admin',
    phone: '+91 80 1234 5678'
  });

  // 2. Patient Users
  const patient1 = await User.create({
    name: 'Arjun Rao',
    email: 'patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 43210',
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    address: {
      street: '42 MG Road, Ashok Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    meal_times: {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '20:00',
      bedtime: '22:00'
    }
  });

  await User.create({
    name: 'Sarah Khan',
    email: 'sarah.patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 43211',
    gender: 'female',
    address: {
      street: '12 Indiranagar 100ft Rd',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'India'
    }
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

  await Doctor.create([
    {
      user_id: doctorUser1._id,
      name: doctorUser1.name,
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experience_years: 15,
      clinic_address: {
        clinic_name: 'Apex Heart & Vascular Clinic',
        street: '100ft Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560038'
      },
      fee: 700,
      available_days: [1, 2, 3, 4, 5],
      available_time_slots: [
        { start_time: '09:00', end_time: '13:00' },
        { start_time: '14:00', end_time: '17:00' }
      ],
      slot_duration_minutes: 30
    },
    {
      user_id: doctorUser2._id,
      name: doctorUser2.name,
      specialization: 'Dermatologist',
      qualification: 'MBBS, DVD, MD (Dermatology)',
      experience_years: 10,
      clinic_address: {
        clinic_name: 'Skin & Aesthetics Care',
        street: '80ft Road, 4th Block, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560034'
      },
      fee: 500,
      available_days: [2, 3, 4, 5, 6],
      available_time_slots: [
        { start_time: '10:00', end_time: '14:00' },
        { start_time: '15:00', end_time: '18:00' }
      ],
      slot_duration_minutes: 30
    }
  ]);

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

  const retailer1 = await Retailer.create({
    user_id: retailerUser1._id,
    store_name: 'Apollo Pharmacy Indiranagar',
    shop_name: 'Apollo Pharmacy Indiranagar',
    licence_number: 'KA-BLR-2024-9988',
    phone: '+91 80 2525 1122',
    email: 'apollo.indiranagar@meditrace.com',
    opening_hours: '24 Hours Open',
    is_verified: true,
    is_active: true,
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
    user_id: retailerUser2._id,
    store_name: 'MedPlus Pharmacy Koramangala',
    shop_name: 'MedPlus Pharmacy Koramangala',
    licence_number: 'KA-BLR-2024-1122',
    phone: '+91 80 4141 3344',
    email: 'medplus.koramangala@meditrace.com',
    opening_hours: '08:00 AM - 11:00 PM',
    is_verified: true,
    is_active: true,
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

  console.log('--- Seeding Retailer Inventories ---');
  await RetailerInventory.create([
    {
      retailer_id: retailer1._id,
      medicine_name: 'Dolo 650',
      generic_name: 'Paracetamol',
      salt_composition: 'Paracetamol 650mg',
      dosage_form: 'tablet',
      strength: '650mg',
      manufacturer: 'Micro Labs Ltd.',
      batch_number: 'B240918',
      expiry_date: new Date('2027-04-30'),
      price: 32.50,
      mrp: 35.00,
      quantity_in_stock: 250,
      requires_prescription: false
    },
    {
      retailer_id: retailer1._id,
      medicine_name: 'Augmentin 625 Duo',
      generic_name: 'Amoxicillin with Clavulanic Acid',
      salt_composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
      dosage_form: 'tablet',
      strength: '625mg',
      manufacturer: 'GlaxoSmithKline',
      batch_number: 'AUG-8812',
      expiry_date: new Date('2026-11-30'),
      price: 185.00,
      mrp: 205.00,
      quantity_in_stock: 80,
      requires_prescription: true
    },
    {
      retailer_id: retailer2._id,
      medicine_name: 'Azithral 500',
      generic_name: 'Azithromycin',
      salt_composition: 'Azithromycin 500mg',
      dosage_form: 'tablet',
      strength: '500mg',
      manufacturer: 'Alembic Pharmaceuticals',
      batch_number: 'AZT-402',
      expiry_date: new Date('2027-02-28'),
      price: 119.00,
      mrp: 135.00,
      quantity_in_stock: 120,
      requires_prescription: true
    }
  ]);

  console.log('--- Seeding Patient Catalogs ---');
  const catMorning = await Catalog.create({
    user_id: patient1._id,
    name: 'Morning Routine',
    time_slot: 'Morning',
    reminder_time: '08:00',
    color: '#0d9488',
    is_default: true
  });

  const catAfternoon = await Catalog.create({
    user_id: patient1._id,
    name: 'Afternoon Dose',
    time_slot: 'Afternoon',
    reminder_time: '13:00',
    color: '#0284c7',
    is_default: true
  });

  const catEvening = await Catalog.create({
    user_id: patient1._id,
    name: 'Evening Care',
    time_slot: 'Evening',
    reminder_time: '20:00',
    color: '#f59e0b',
    is_default: true
  });

  const catNight = await Catalog.create({
    user_id: patient1._id,
    name: 'Night Rest',
    time_slot: 'Night',
    reminder_time: '22:00',
    color: '#6366f1',
    is_default: true
  });

  console.log('--- Seeding Patient Medicines with Clinical Metadata ---');
  // 1. Common: Dolo 650 (In stock)
  const med1 = await Medicine.create({
    patient_id: patient1._id,
    name: 'Dolo 650',
    nickname: 'Fever / Headache',
    generic_name: 'Paracetamol',
    salt_composition: 'Paracetamol IP 650mg',
    dosage_form: 'tablet',
    strength: '650mg',
    description: 'Fast acting antipyretic and analgesic tablet formulated for fever and headache relief.',
    usedFor: 'Fever, headache, body pain',
    category: 'Common',
    cautions: 'Do not exceed 4 tablets in 24 hours. Take after food.',
    source: 'database',
    manufacturer: 'Micro Labs Ltd.',
    batch_number: 'ML-9921',
    expiry_date: new Date('2027-06-15'),
    quantity: 18,
    low_stock_threshold: 5,
    status: 'active'
  });

  // 2. Chronic: Glycomet 500 (Low stock alert)
  const med2 = await Medicine.create({
    patient_id: patient1._id,
    name: 'Glycomet 500',
    nickname: 'Sugar / Diabetes',
    generic_name: 'Metformin Hydrochloride',
    salt_composition: 'Metformin 500mg',
    dosage_form: 'tablet',
    strength: '500mg',
    description: 'Oral antidiabetic biguanide lowering glucose production in liver and improving peripheral uptake.',
    usedFor: 'Type 2 Diabetes glycemic control',
    category: 'Chronic',
    cautions: 'Take with or immediately after meals to minimize stomach upset.',
    source: 'database',
    manufacturer: 'USV Ltd.',
    batch_number: 'USV-109',
    expiry_date: new Date('2027-12-01'),
    quantity: 3, // Low stock!
    low_stock_threshold: 5,
    status: 'active'
  });

  // 3. Serious: Augmentin 625 Duo (In stock, antibiotic course)
  const med3 = await Medicine.create({
    patient_id: patient1._id,
    name: 'Augmentin 625 Duo',
    nickname: 'Infection / Antibiotic',
    generic_name: 'Amoxicillin + Clavulanate Potassium',
    salt_composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    dosage_form: 'tablet',
    strength: '625mg',
    description: 'Broad-spectrum antibiotic combining amoxicillin and clavulanate potassium.',
    usedFor: 'Bacterial infections of chest, throat, dental and urinary tract',
    category: 'Serious',
    cautions: 'Complete the full prescribed 5 to 7 day course. Take at start of meal.',
    source: 'database',
    manufacturer: 'GlaxoSmithKline',
    batch_number: 'AUG-8812',
    expiry_date: new Date('2026-12-31'),
    quantity: 10,
    low_stock_threshold: 4,
    status: 'active'
  });

  // 4. Common: Combiflam (Out of stock alert)
  const med4 = await Medicine.create({
    patient_id: patient1._id,
    name: 'Combiflam',
    nickname: 'Body pain',
    generic_name: 'Ibuprofen + Paracetamol',
    salt_composition: 'Ibuprofen 400mg + Paracetamol 325mg',
    dosage_form: 'tablet',
    strength: '400mg + 325mg',
    description: 'NSAID combination providing anti-inflammatory relief from muscle pain and joint stiffness.',
    usedFor: 'Muscular aches, joint pain, toothache',
    category: 'Common',
    cautions: 'Always take after food. Do not take on empty stomach.',
    source: 'database',
    manufacturer: 'Sanofi India',
    batch_number: 'CBF-301',
    expiry_date: new Date('2027-08-15'),
    quantity: 0, // Out of stock!
    low_stock_threshold: 5,
    status: 'active'
  });

  // 5. Chronic: Telma 40 (In stock)
  const med5 = await Medicine.create({
    patient_id: patient1._id,
    name: 'Telma 40',
    nickname: 'Blood Pressure',
    generic_name: 'Telmisartan',
    salt_composition: 'Telmisartan 40mg',
    dosage_form: 'tablet',
    strength: '40mg',
    description: 'Angiotensin II receptor blocker maintaining smooth 24-hour arterial blood pressure.',
    usedFor: 'Hypertension (high blood pressure)',
    category: 'Chronic',
    cautions: 'Take consistently at same time each morning. Do not stop abruptly.',
    source: 'database',
    manufacturer: 'Glenmark Pharmaceuticals',
    batch_number: 'TLM-40-19',
    expiry_date: new Date('2027-11-20'),
    quantity: 25,
    low_stock_threshold: 5,
    status: 'active'
  });

  console.log('--- Linking Medicines to Catalogs ---');
  await CatalogMedicine.create([
    {
      catalog_id: catMorning._id,
      medicine_id: med5._id,
      user_id: patient1._id,
      dose_amount: '1 tablet',
      timing: 'after_food',
      notes: 'Take with morning glass of water'
    },
    {
      catalog_id: catMorning._id,
      medicine_id: med2._id,
      user_id: patient1._id,
      dose_amount: '1 tablet',
      timing: 'after_food',
      notes: 'Take right after breakfast'
    },
    {
      catalog_id: catAfternoon._id,
      medicine_id: med3._id,
      user_id: patient1._id,
      dose_amount: '1 tablet',
      timing: 'after_food',
      notes: 'After lunch antibiotic dose'
    },
    {
      catalog_id: catEvening._id,
      medicine_id: med1._id,
      user_id: patient1._id,
      dose_amount: '1 tablet',
      timing: 'after_food',
      notes: 'Only if having headache or fever'
    },
    {
      catalog_id: catNight._id,
      medicine_id: med2._id,
      user_id: patient1._id,
      dose_amount: '1 tablet',
      timing: 'after_food',
      notes: 'Dinner time sugar maintenance'
    }
  ]);

  console.log('--- Creating Dose Schedules ---');
  const schedTelma = await DoseSchedule.create({
    patient_id: patient1._id,
    medicine_id: med5._id,
    dose_amount: '1 tablet',
    times_per_day: 1,
    specific_times: ['08:00'],
    mealSlots: [{ meal: 'breakfast', timing: 'after_food', dose_amount: '1 tablet' }],
    food_instruction: 'after_food',
    start_date: new Date('2026-01-01'),
    days_of_week: [0, 1, 2, 3, 4, 5, 6]
  });

  const schedGlycomet = await DoseSchedule.create({
    patient_id: patient1._id,
    medicine_id: med2._id,
    dose_amount: '1 tablet',
    times_per_day: 2,
    specific_times: ['08:30', '20:30'],
    mealSlots: [
      { meal: 'breakfast', timing: 'after_food', dose_amount: '1 tablet' },
      { meal: 'dinner', timing: 'after_food', dose_amount: '1 tablet' }
    ],
    food_instruction: 'after_food',
    start_date: new Date('2026-01-01'),
    days_of_week: [0, 1, 2, 3, 4, 5, 6]
  });

  const schedAugmentin = await DoseSchedule.create({
    patient_id: patient1._id,
    medicine_id: med3._id,
    dose_amount: '1 tablet',
    times_per_day: 2,
    specific_times: ['13:00', '21:00'],
    mealSlots: [
      { meal: 'lunch', timing: 'after_food', dose_amount: '1 tablet' },
      { meal: 'dinner', timing: 'after_food', dose_amount: '1 tablet' }
    ],
    food_instruction: 'after_food',
    start_date: new Date('2026-01-01'),
    days_of_week: [0, 1, 2, 3, 4, 5, 6]
  });

  console.log('--- Seeding 10 Days of Adherence Dose History ---');
  const historyLogs = [];
  const today = new Date();

  for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - dayOffset);
    const dateStr = logDate.toISOString().split('T')[0];
    const isToday = dayOffset === 0;

    // Telma 08:00
    const timeTelma = new Date(logDate);
    timeTelma.setHours(8, 0, 0, 0);
    const telmaStatus = dayOffset === 4 ? 'missed' : (isToday ? 'scheduled' : 'taken');
    historyLogs.push({
      patient_id: patient1._id,
      schedule_id: schedTelma._id,
      medicine_id: med5._id,
      scheduled_time: timeTelma,
      taken_time: telmaStatus === 'taken' ? new Date(timeTelma.getTime() + 15 * 60000) : null,
      status: telmaStatus
    });

    // Glycomet 08:30 & 20:30
    const timeGlyco1 = new Date(logDate);
    timeGlyco1.setHours(8, 30, 0, 0);
    const timeGlyco2 = new Date(logDate);
    timeGlyco2.setHours(20, 30, 0, 0);

    const glyco1Status = dayOffset === 2 ? 'missed' : (isToday ? 'taken' : 'taken');
    const glyco2Status = isToday ? 'scheduled' : (dayOffset === 2 ? 'missed' : 'taken');

    historyLogs.push(
      {
        patient_id: patient1._id,
        schedule_id: schedGlycomet._id,
        medicine_id: med2._id,
        scheduled_time: timeGlyco1,
        taken_time: glyco1Status === 'taken' ? new Date(timeGlyco1.getTime() + 10 * 60000) : null,
        status: glyco1Status
      },
      {
        patient_id: patient1._id,
        schedule_id: schedGlycomet._id,
        medicine_id: med2._id,
        scheduled_time: timeGlyco2,
        taken_time: glyco2Status === 'taken' ? new Date(timeGlyco2.getTime() + 20 * 60000) : null,
        status: glyco2Status
      }
    );

    // Augmentin 13:00 & 21:00
    const timeAug1 = new Date(logDate);
    timeAug1.setHours(13, 0, 0, 0);
    const timeAug2 = new Date(logDate);
    timeAug2.setHours(21, 0, 0, 0);

    const aug1Status = isToday ? 'scheduled' : 'taken';
    const aug2Status = isToday ? 'scheduled' : (dayOffset === 6 ? 'missed' : 'taken');

    historyLogs.push(
      {
        patient_id: patient1._id,
        schedule_id: schedAugmentin._id,
        medicine_id: med3._id,
        scheduled_time: timeAug1,
        taken_time: aug1Status === 'taken' ? new Date(timeAug1.getTime() + 5 * 60000) : null,
        status: aug1Status
      },
      {
        patient_id: patient1._id,
        schedule_id: schedAugmentin._id,
        medicine_id: med3._id,
        scheduled_time: timeAug2,
        taken_time: aug2Status === 'taken' ? new Date(timeAug2.getTime() + 25 * 60000) : null,
        status: aug2Status
      }
    );
  }

  await DoseLog.insertMany(historyLogs);

  console.log('--- Ensuring Healthcare Facilities Seeded ---');
  const facCount = await Facility.countDocuments();
  if (facCount === 0) {
    await Facility.insertMany(HEALTHCARE_FACILITIES);
  }

  console.log('--- Seeding Notifications ---');
  await Notification.create([
    {
      user_id: patient1._id,
      title: 'Low Stock Alert',
      message: 'Glycomet 500 (Sugar / Diabetes) has only 3 tablets left.',
      type: 'low_stock',
      is_read: false
    },
    {
      user_id: patient1._id,
      title: 'Out of Stock Alert',
      message: 'Combiflam (Body pain) is out of stock. Tap Refill or Buy to reorder.',
      type: 'low_stock',
      is_read: false
    }
  ]);

  console.log('======================================================');
  console.log('Meditrace v2 Seed Complete:');
  console.log('  👑 Admin:     admin@meditrace.com');
  console.log('  👤 Patient 1: patient@meditrace.com (Arjun Rao)');
  console.log('  👤 Patient 2: sarah.patient@meditrace.com (Sarah Khan)');
  console.log('  🩺 Doctor 1:  dr.sharma@meditrace.com (Cardiologist)');
  console.log('  🏪 Retailer 1: apollo.indiranagar@meditrace.com (Apollo Pharmacy)');
  console.log('  📁 Catalogs:  Morning Routine, Afternoon Dose, Evening Care, Night Rest');
  console.log(`  📅 History:   ${historyLogs.length} dose logs across 10 days`);
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
