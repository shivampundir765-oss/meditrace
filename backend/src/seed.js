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
const { Cabinet } = require('./models/cabinet.model');
const { CabinetMedicine } = require('./models/cabinetMedicine.model');
const { Profile } = require('./models/profile.model');
const { MedicineRevision } = require('./models/medicineRevision.model');
const { ChatMessage } = require('./models/chatMessage.model');
const { Facility } = require('./models/facility.model');
const { HEALTHCARE_FACILITIES } = require('./data/facilityData');
const { createAuditStamp } = require('./utils/auditStamp');

async function runSeed(mongoUri) {
  const uri = mongoUri || env.MONGODB_URI || 'mongodb://localhost:27017/meditrace';
  console.log(`Connecting to MongoDB for v3 seed at: ${uri}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  console.log('--- Cleaning Existing Meditrace Demo Data ---');
  await Promise.all([
    User.deleteMany({ email: { $in: [
      'admin@meditrace.com',
      'patient@meditrace.com',
      'sarah.patient@meditrace.com',
      'pharmacist.sharma@meditrace.com',
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
    CatalogMedicine.deleteMany({}),
    Cabinet.deleteMany({}),
    CabinetMedicine.deleteMany({}),
    Profile.deleteMany({}),
    MedicineRevision.deleteMany({}),
    ChatMessage.deleteMany({})
  ]);

  console.log('--- Seeding Platform Users (Roles: Admin, Doctor, Pharmacist, Patient) ---');
  const defaultPassword = 'Password123!';

  // 1. Admin User
  await User.create({
    name: 'Meditrace Administrator',
    email: 'admin@meditrace.com',
    password: defaultPassword,
    role: 'admin',
    phone: '+91 80 1234 5678',
    preferred_language: 'en'
  });

  // 2. Pharmacist User
  const pharmacist = await User.create({
    name: 'Vikram Sharma (R.Ph.)',
    email: 'pharmacist.sharma@meditrace.com',
    password: defaultPassword,
    role: 'pharmacist',
    phone: '+91 98450 11223',
    pharmacy_name: 'Apollo Pharmacy Indiranagar',
    license_number: 'KA-DRG-2024-88912',
    preferred_language: 'en'
  });

  // 3. Doctor User
  const doctorUser = await User.create({
    name: 'Dr. Ramesh Sharma, MD',
    email: 'dr.sharma@meditrace.com',
    password: defaultPassword,
    role: 'doctor',
    phone: '+91 98450 99887',
    preferred_language: 'en'
  });

  await Doctor.create({
    user_id: doctorUser._id,
    name: 'Dr. Ramesh Sharma, MD',
    specialization: 'Cardiologist',
    experience_years: 15,
    qualification: 'MBBS, MD (Cardiology), FACC',
    registration_number: 'KMC-54321',
    clinic_address: {
      clinic_name: 'Apollo Clinic & Heart Center',
      street: '100ft Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560038'
    },
    fee: 800,
    available_days: [1, 3, 5],
    available_time_slots: [
      { start_time: '09:00', end_time: '13:00' },
      { start_time: '14:00', end_time: '18:00' }
    ]
  });

  // 4. Primary Patient User
  const patient1 = await User.create({
    name: 'Arjun Rao',
    email: 'patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 43210',
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    preferred_language: 'en',
    notificationSettings: {
      pushNotifications: true,
      doseAlerts: true,
      lowStockAlerts: true,
      expiryAlerts: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00'
    },
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

  // 5. Secondary Patient User (Caregiver)
  const patient2 = await User.create({
    name: 'Sarah Khan',
    email: 'sarah.patient@meditrace.com',
    password: defaultPassword,
    role: 'patient',
    phone: '+91 98765 88990',
    gender: 'female',
    dateOfBirth: new Date('1992-08-20'),
    preferred_language: 'hi'
  });

  console.log('--- Seeding Multi-Profile & Family Mode ---');
  // Patient 1 Profiles
  const profileSelf = await Profile.create({
    user_id: patient1._id,
    name: 'Arjun Rao (Self)',
    relationship: 'self',
    is_default: true,
    gender: 'male',
    date_of_birth: new Date('1990-05-15'),
    blood_group: 'O+',
    allergies: ['Penicillin'],
    chronic_conditions: ['Hypertension']
  });

  const profileFather = await Profile.create({
    user_id: patient1._id,
    name: 'Ramesh Rao (Father)',
    relationship: 'father',
    is_default: false,
    gender: 'male',
    date_of_birth: new Date('1956-02-10'),
    blood_group: 'O+',
    allergies: [],
    chronic_conditions: ['Type 2 Diabetes', 'Hypertension'],
    authorized_caregivers: [
      { user_id: patient2._id, access_level: 'caregiver_edit' }
    ]
  });

  const profileMother = await Profile.create({
    user_id: patient1._id,
    name: 'Sunita Rao (Mother)',
    relationship: 'mother',
    is_default: false,
    gender: 'female',
    date_of_birth: new Date('1960-07-22'),
    blood_group: 'A+',
    allergies: ['Sulfa drugs'],
    chronic_conditions: ['Hypothyroidism']
  });

  const profileChild = await Profile.create({
    user_id: patient1._id,
    name: 'Aarav Rao (Son)',
    relationship: 'child',
    is_default: false,
    gender: 'male',
    date_of_birth: new Date('2018-11-12'),
    blood_group: 'O+',
    allergies: [],
    chronic_conditions: []
  });

  console.log('--- Seeding Cabinets & Catalogs ---');
  const demoLocation = {
    latitude: 12.9716,
    longitude: 77.5946,
    place_name: 'Bangalore Central, Karnataka, India'
  };
  const auditStamp = createAuditStamp(demoLocation);

  const cabCold = await Cabinet.create({
    user_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Cold & Cough',
    condition: 'Cold',
    time_slot: 'Morning',
    reminder_time: '08:00',
    color: '#0d9488',
    icon: 'snowflake',
    is_default: true,
    audit_stamp: auditStamp
  });

  const cabFever = await Cabinet.create({
    user_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Fever & Pain Relief',
    condition: 'Fever',
    time_slot: 'Afternoon',
    reminder_time: '13:00',
    color: '#0284c7',
    icon: 'thermometer',
    is_default: true,
    audit_stamp: auditStamp
  });

  const cabDiabetes = await Cabinet.create({
    user_id: patient1._id,
    profile_id: profileFather._id,
    name: 'Diabetes & BP Care',
    condition: 'Diabetes',
    time_slot: 'Morning',
    reminder_time: '08:30',
    color: '#e11d48',
    icon: 'heart-pulse',
    is_default: true,
    audit_stamp: auditStamp
  });

  const cabVitamins = await Cabinet.create({
    user_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Daily Vitamins & Health',
    condition: 'General Health',
    time_slot: 'Morning',
    reminder_time: '08:30',
    color: '#10b981',
    icon: 'pill',
    is_default: true,
    audit_stamp: auditStamp
  });

  const cabNight = await Cabinet.create({
    user_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Night Care',
    condition: 'Night',
    time_slot: 'Night',
    reminder_time: '22:00',
    color: '#6366f1',
    icon: 'moon',
    is_default: true,
    audit_stamp: auditStamp
  });

  // Backward compatible catalog entries
  await Catalog.create([
    { _id: cabCold._id, user_id: patient1._id, name: 'Cold & Cough', time_slot: 'Morning', reminder_time: '08:00', color: '#0d9488' },
    { _id: cabFever._id, user_id: patient1._id, name: 'Fever & Pain Relief', time_slot: 'Afternoon', reminder_time: '13:00', color: '#0284c7' },
    { _id: cabNight._id, user_id: patient1._id, name: 'Night Care', time_slot: 'Night', reminder_time: '22:00', color: '#6366f1' }
  ]);

  console.log('--- Seeding Medicines with v3 Fields & Revisions ---');
  // 1. Dolo 650 (In stock) - Added by Pharmacist
  const med1 = await Medicine.create({
    patient_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Dolo 650mg Tablet',
    nickname: 'Fever',
    generic_name: 'Paracetamol',
    salt_composition: 'Paracetamol (650mg)',
    dosage_form: 'tablet',
    strength: '650mg',
    description: 'Fast-acting antipyretic and analgesic for prompt reduction of fever and body ache.',
    usedFor: 'Fever, headache, and acute pain',
    category: 'Common',
    cautions: 'Do not exceed 4 tablets in 24 hours. Take after food with water.',
    source: 'scan',
    entered_by_role: 'pharmacist',
    entered_by_label: 'Entered by Pharmacist',
    field_sources: {
      name: 'scanned',
      dosage_form: 'scanned',
      strength: 'scanned',
      salt_composition: 'database',
      expiry_date: 'scanned',
      batch_number: 'scanned',
      manufacturer: 'scanned'
    },
    manufacturer: 'Micro Labs Ltd',
    batch_number: 'ML-9921',
    barcode: '8901086001234',
    expiry_date: new Date('2027-08-15'),
    quantity: 15,
    original_quantity: 20,
    low_stock_threshold: 5,
    stock_threshold: 4,
    status: 'active',
    current_revision: 1,
    initial_audit_stamp: auditStamp,
    last_audit_stamp: auditStamp,
    original_entry: {
      by_user_id: pharmacist._id,
      by_role: 'pharmacist',
      label: 'Added by Pharmacist',
      created_at: new Date()
    }
  });

  await MedicineRevision.create({
    medicine_id: med1._id,
    revision_number: 1,
    editor_user_id: pharmacist._id,
    editor_role: 'pharmacist',
    editor_name: 'Vikram Sharma (R.Ph.)',
    entry_label: 'Added by Pharmacist',
    change_summary: 'Initial medicine verification and packaging scan',
    changed_fields: [],
    previous_values: {},
    new_values: {
      name: med1.name,
      salt_composition: med1.salt_composition,
      dosage_form: med1.dosage_form,
      strength: med1.strength,
      quantity: 20,
      expiry_date: med1.expiry_date,
      batch_number: med1.batch_number,
      manufacturer: med1.manufacturer
    },
    audit_stamp: auditStamp
  });

  // 2. Glycomet-GP 1 (Few left warning!)
  const med2 = await Medicine.create({
    patient_id: patient1._id,
    profile_id: profileFather._id,
    name: 'Glycomet 500 Tablet',
    nickname: 'Sugar / Diabetes',
    generic_name: 'Metformin Hydrochloride',
    salt_composition: 'Metformin Hydrochloride (500mg)',
    dosage_form: 'tablet',
    strength: '500mg',
    description: 'First-line biguanide oral antihyperglycemic agent for managing blood glucose in type 2 diabetes.',
    usedFor: 'Type 2 Diabetes Mellitus glycemic control',
    category: 'Chronic',
    cautions: 'Always take with or after meals to avoid gastrointestinal discomfort.',
    source: 'database',
    entered_by_role: 'doctor',
    entered_by_label: 'Entered by Doctor',
    field_sources: {
      name: 'database',
      salt_composition: 'database',
      dosage_form: 'database',
      strength: 'database',
      expiry_date: 'manual',
      batch_number: 'manual'
    },
    manufacturer: 'USV Ltd',
    batch_number: 'USV-109',
    barcode: '8904000000033',
    expiry_date: new Date('2026-10-30'),
    quantity: 3, // Few Left!
    original_quantity: 30,
    low_stock_threshold: 6,
    stock_threshold: 6,
    status: 'active',
    current_revision: 2,
    initial_audit_stamp: auditStamp,
    last_audit_stamp: auditStamp,
    original_entry: {
      by_user_id: doctorUser._id,
      by_role: 'doctor',
      label: 'Added by Doctor',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000)
    }
  });

  await MedicineRevision.create([
    {
      medicine_id: med2._id,
      revision_number: 1,
      editor_user_id: doctorUser._id,
      editor_role: 'doctor',
      editor_name: 'Dr. Ramesh Sharma, MD',
      entry_label: 'Added by Doctor',
      change_summary: 'Initial clinical prescription entry',
      changed_fields: [],
      previous_values: {},
      new_values: { name: med2.name, quantity: 30 },
      audit_stamp: auditStamp
    },
    {
      medicine_id: med2._id,
      revision_number: 2,
      editor_user_id: patient1._id,
      editor_role: 'patient',
      editor_name: 'Arjun Rao',
      entry_label: 'Edited by Patient',
      change_summary: 'Updated cautions and added nickname "Sugar / Diabetes"',
      changed_fields: ['nickname', 'cautions'],
      previous_values: { nickname: '', cautions: 'Take after meal' },
      new_values: { nickname: 'Sugar / Diabetes', cautions: 'Always take with or after meals to avoid gastrointestinal discomfort.' },
      audit_stamp: auditStamp
    }
  ]);

  // 3. Combiflam (Out of stock warning!)
  const med3 = await Medicine.create({
    patient_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Combiflam Tablet',
    nickname: 'Body pain',
    generic_name: 'Ibuprofen and Paracetamol',
    salt_composition: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    dosage_form: 'tablet',
    strength: '725mg',
    description: 'Synergistic NSAID and analgesic combination for moderate to severe muscular pain and inflammation.',
    usedFor: 'Joint pain, dental pain, and inflammation',
    category: 'Common',
    cautions: 'Avoid on empty stomach. Not recommended if history of gastric ulcer.',
    source: 'manual',
    entered_by_role: 'patient',
    entered_by_label: 'Added by Patient',
    field_sources: {
      name: 'manual',
      salt_composition: 'manual',
      quantity: 'manual'
    },
    manufacturer: 'Sanofi India Ltd',
    batch_number: 'SNF-8820',
    expiry_date: new Date('2027-04-10'),
    quantity: 0, // Out of Stock!
    original_quantity: 10,
    low_stock_threshold: 4,
    status: 'active',
    current_revision: 1,
    initial_audit_stamp: auditStamp,
    last_audit_stamp: auditStamp,
    original_entry: {
      by_user_id: patient1._id,
      by_role: 'patient',
      label: 'Added by Patient',
      created_at: new Date()
    }
  });

  await MedicineRevision.create({
    medicine_id: med3._id,
    revision_number: 1,
    editor_user_id: patient1._id,
    editor_role: 'patient',
    editor_name: 'Arjun Rao',
    entry_label: 'Added by Patient',
    change_summary: 'Initial medicine entry',
    changed_fields: [],
    previous_values: {},
    new_values: { name: med3.name, quantity: 10 },
    audit_stamp: auditStamp
  });

  // 4. Augmentin 625 (Serious / Prescription)
  const med4 = await Medicine.create({
    patient_id: patient1._id,
    profile_id: profileSelf._id,
    name: 'Augmentin 625 Duo Tablet',
    nickname: 'Antibiotic',
    generic_name: 'Amoxicillin and Clavulanic Acid',
    salt_composition: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    dosage_form: 'tablet',
    strength: '625mg',
    description: 'Broad-spectrum beta-lactamase inhibitor penicillin antibiotic targeting respiratory and soft tissue bacterial infections.',
    usedFor: 'Bacterial chest, ear, sinus and skin infections',
    category: 'Serious',
    cautions: 'Complete full prescribed course even if symptoms resolve. Take at start of a meal.',
    source: 'scan',
    entered_by_role: 'pharmacist',
    entered_by_label: 'Entered by Pharmacist',
    field_sources: {
      name: 'scanned',
      dosage_form: 'scanned',
      strength: 'scanned',
      batch_number: 'scanned',
      expiry_date: 'scanned'
    },
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    batch_number: 'GSK-4011',
    barcode: '8901234567890',
    expiry_date: new Date('2026-12-15'),
    quantity: 12,
    original_quantity: 14,
    low_stock_threshold: 4,
    status: 'active',
    requires_prescription: true,
    current_revision: 1,
    initial_audit_stamp: auditStamp,
    last_audit_stamp: auditStamp,
    original_entry: {
      by_user_id: pharmacist._id,
      by_role: 'pharmacist',
      label: 'Added by Pharmacist',
      created_at: new Date()
    }
  });

  await MedicineRevision.create({
    medicine_id: med4._id,
    revision_number: 1,
    editor_user_id: pharmacist._id,
    editor_role: 'pharmacist',
    editor_name: 'Vikram Sharma (R.Ph.)',
    entry_label: 'Added by Pharmacist',
    change_summary: 'Scanned blister pack front and back',
    changed_fields: [],
    previous_values: {},
    new_values: { name: med4.name, quantity: 14 },
    audit_stamp: auditStamp
  });

  // 5. Telma 40 (In stock) - Father's BP medicine
  const med5 = await Medicine.create({
    patient_id: patient1._id,
    profile_id: profileFather._id,
    name: 'Telma 40mg Tablet',
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
    entered_by_role: 'doctor',
    entered_by_label: 'Entered by Doctor',
    field_sources: {
      name: 'database',
      salt_composition: 'database',
      category: 'database'
    },
    manufacturer: 'Glenmark Pharmaceuticals',
    batch_number: 'TLM-40-19',
    expiry_date: new Date('2027-11-20'),
    quantity: 28,
    original_quantity: 30,
    low_stock_threshold: 6,
    status: 'active',
    current_revision: 1,
    initial_audit_stamp: auditStamp,
    last_audit_stamp: auditStamp,
    original_entry: {
      by_user_id: doctorUser._id,
      by_role: 'doctor',
      label: 'Added by Doctor',
      created_at: new Date()
    }
  });

  await MedicineRevision.create({
    medicine_id: med5._id,
    revision_number: 1,
    editor_user_id: doctorUser._id,
    editor_role: 'doctor',
    editor_name: 'Dr. Ramesh Sharma, MD',
    entry_label: 'Added by Doctor',
    change_summary: 'Prescribed for chronic hypertension',
    changed_fields: [],
    previous_values: {},
    new_values: { name: med5.name, quantity: 30 },
    audit_stamp: auditStamp
  });

  console.log('--- Linking Medicines to Cabinets & Catalogs ---');
  await CabinetMedicine.create([
    { cabinet_id: cabCold._id, medicine_id: med1._id, user_id: patient1._id, profile_id: profileSelf._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'When experiencing cough or body ache' },
    { cabinet_id: cabFever._id, medicine_id: med1._id, user_id: patient1._id, profile_id: profileSelf._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'Take with warm water' },
    { cabinet_id: cabFever._id, medicine_id: med3._id, user_id: patient1._id, profile_id: profileSelf._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'Severe body pain only' },
    { cabinet_id: cabCold._id, medicine_id: med4._id, user_id: patient1._id, profile_id: profileSelf._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'Antibiotic course' },
    { cabinet_id: cabDiabetes._id, medicine_id: med2._id, user_id: patient1._id, profile_id: profileFather._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'Post-breakfast dose' },
    { cabinet_id: cabDiabetes._id, medicine_id: med5._id, user_id: patient1._id, profile_id: profileFather._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'Morning blood pressure' }
  ]);

  // Backward-compatible catalog medicines
  await CatalogMedicine.create([
    { catalog_id: cabCold._id, medicine_id: med1._id, user_id: patient1._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'When having cold' },
    { catalog_id: cabFever._id, medicine_id: med3._id, user_id: patient1._id, dose_amount: '1 tablet', timing: 'after_food', notes: 'For fever' }
  ]);

  console.log('--- Creating Dose Schedules ---');
  const schedTelma = await DoseSchedule.create({
    patient_id: patient1._id,
    profile_id: profileFather._id,
    medicine_id: med5._id,
    dose_amount: '1 tablet',
    times_per_day: 1,
    specific_times: ['08:00'],
    mealSlots: [{ meal: 'breakfast', timing: 'after_food', dose_amount: '1 tablet' }],
    food_instruction: 'after_food',
    start_date: new Date('2026-01-01'),
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    audit_stamp: auditStamp
  });

  const schedGlycomet = await DoseSchedule.create({
    patient_id: patient1._id,
    profile_id: profileFather._id,
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
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    audit_stamp: auditStamp
  });

  const schedDolo = await DoseSchedule.create({
    patient_id: patient1._id,
    profile_id: profileSelf._id,
    medicine_id: med1._id,
    dose_amount: '1 tablet',
    times_per_day: 2,
    specific_times: ['08:00', '20:00'],
    mealSlots: [
      { meal: 'breakfast', timing: 'after_food', dose_amount: '1 tablet' },
      { meal: 'dinner', timing: 'after_food', dose_amount: '1 tablet' }
    ],
    food_instruction: 'after_food',
    start_date: new Date('2026-11-01'),
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    audit_stamp: auditStamp
  });

  console.log('--- Seeding 30 Days of Monthly Adherence History ---');
  const historyLogs = [];
  const today = new Date();

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - dayOffset);
    const isToday = dayOffset === 0;

    // 1. Telma 08:00
    const timeTelma = new Date(logDate);
    timeTelma.setHours(8, 0, 0, 0);
    const telmaMissed = dayOffset === 5 || dayOffset === 18;
    const telmaStatus = telmaMissed ? 'missed' : (isToday ? 'scheduled' : 'taken');
    historyLogs.push({
      patient_id: patient1._id,
      profile_id: profileFather._id,
      schedule_id: schedTelma._id,
      medicine_id: med5._id,
      scheduled_time: timeTelma,
      taken_time: telmaStatus === 'taken' ? new Date(timeTelma.getTime() + 15 * 60000) : null,
      status: telmaStatus,
      audit_stamp: auditStamp
    });

    // 2. Glycomet 08:30 & 20:30
    const timeGlyco1 = new Date(logDate);
    timeGlyco1.setHours(8, 30, 0, 0);
    const timeGlyco2 = new Date(logDate);
    timeGlyco2.setHours(20, 30, 0, 0);

    const glyco1Status = (dayOffset === 3 || dayOffset === 12) ? 'missed' : (isToday ? 'taken' : 'taken');
    const glyco2Status = isToday ? 'scheduled' : ((dayOffset === 3 || dayOffset === 22) ? 'missed' : 'taken');

    historyLogs.push(
      {
        patient_id: patient1._id,
        profile_id: profileFather._id,
        schedule_id: schedGlycomet._id,
        medicine_id: med2._id,
        scheduled_time: timeGlyco1,
        taken_time: glyco1Status === 'taken' ? new Date(timeGlyco1.getTime() + 10 * 60000) : null,
        status: glyco1Status,
        audit_stamp: auditStamp
      },
      {
        patient_id: patient1._id,
        profile_id: profileFather._id,
        schedule_id: schedGlycomet._id,
        medicine_id: med2._id,
        scheduled_time: timeGlyco2,
        taken_time: glyco2Status === 'taken' ? new Date(timeGlyco2.getTime() + 20 * 60000) : null,
        status: glyco2Status,
        audit_stamp: auditStamp
      }
    );

    // 3. Dolo 650 (self profile)
    if (dayOffset <= 14) {
      const timeDolo = new Date(logDate);
      timeDolo.setHours(8, 0, 0, 0);
      const doloStatus = isToday ? 'scheduled' : (dayOffset === 7 ? 'missed' : 'taken');
      historyLogs.push({
        patient_id: patient1._id,
        profile_id: profileSelf._id,
        schedule_id: schedDolo._id,
        medicine_id: med1._id,
        scheduled_time: timeDolo,
        taken_time: doloStatus === 'taken' ? new Date(timeDolo.getTime() + 5 * 60000) : null,
        status: doloStatus,
        audit_stamp: auditStamp
      });
    }
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
      title: 'Few Left Alert: Glycomet 500',
      message: 'Glycomet 500 (Sugar / Diabetes) has only 3 tablets remaining. Tap Refill or Buy.',
      type: 'low_stock',
      channel: 'in_app',
      is_read: false
    },
    {
      user_id: patient1._id,
      title: 'Out of Stock Alert: Combiflam',
      message: 'Combiflam (Body pain) is completely out of stock. Tap Refill to order.',
      type: 'low_stock',
      channel: 'in_app',
      is_read: false
    }
  ]);

  console.log('======================================================');
  console.log('✅ Meditrace v3 Seed Complete:');
  console.log('  👑 Admin:       admin@meditrace.com');
  console.log('  👨‍⚕️ Doctor:      dr.sharma@meditrace.com');
  console.log('  💊 Pharmacist:  pharmacist.sharma@meditrace.com');
  console.log('  👤 Patient:     patient@meditrace.com (Arjun Rao)');
  console.log('  👥 Profiles:    Self (Arjun), Father (Ramesh), Mother (Sunita), Son (Aarav)');
  console.log('  🗄️ Cabinets:    Cold & Cough, Fever & Pain, Diabetes & BP, Daily Vitamins, Night Care');
  console.log('  📜 Revisions:   Append-only revisions initialized for all medicines');
  console.log(`  📅 History:     ${historyLogs.length} dose logs across 30 days`);
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
