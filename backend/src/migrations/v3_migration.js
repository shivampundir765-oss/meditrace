const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const { Profile } = require('../models/profile.model');
const { Cabinet } = require('../models/cabinet.model');
const { CabinetMedicine } = require('../models/cabinetMedicine.model');
const { Medicine } = require('../models/medicine.model');
const { MedicineRevision } = require('../models/medicineRevision.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { DoseLog } = require('../models/doseLog.model');
const { Prescription } = require('../models/prescription.model');

async function runV3Migration() {
  console.log('[v3_migration] Starting MediTrace v3 database migration...');

  // 1. Ensure all users have a default self profile
  const users = await User.find({});
  console.log(`[v3_migration] Found ${users.length} users. Checking profiles...`);

  const userProfileMap = new Map();

  for (const user of users) {
    let profile = await Profile.findOne({ user_id: user._id, relationship: 'self' });
    if (!profile) {
      profile = await Profile.create({
        user_id: user._id,
        name: user.name || 'My Profile',
        relationship: 'self',
        is_default: true,
        date_of_birth: user.date_of_birth || null,
        gender: user.gender || 'other',
        blood_group: user.blood_group || '',
        allergies: user.allergies || [],
        chronic_conditions: user.chronic_conditions || []
      });
      console.log(`[v3_migration] Created default profile for user: ${user.email} (${user._id})`);
    }
    userProfileMap.set(user._id.toString(), profile._id);
  }

  // 2. Migrate legacy Catalogs to Cabinets
  const catalogCollection = mongoose.connection.collection('catalogs');
  const catalogMedicineCollection = mongoose.connection.collection('catalogmedicines');

  const legacyCatalogs = await catalogCollection.find({}).toArray();
  console.log(`[v3_migration] Found ${legacyCatalogs.length} legacy catalogs.`);

  const catalogToCabinetMap = new Map();

  for (const cat of legacyCatalogs) {
    const existingCabinet = await Cabinet.findOne({ _id: cat._id });
    if (!existingCabinet) {
      const profileId = userProfileMap.get(cat.user_id.toString()) || null;
      const newCab = await Cabinet.create({
        _id: cat._id, // Preserve ID for reference integrity
        user_id: cat.user_id,
        profile_id: profileId,
        name: cat.name,
        condition: cat.name,
        time_slot: cat.time_slot || 'Morning',
        reminder_time: cat.reminder_time || '08:00',
        days: cat.days || [0, 1, 2, 3, 4, 5, 6],
        color: cat.color || '#0d9488',
        icon: 'medical-bag',
        is_default: !!cat.is_default,
        created_at: cat.created_at || new Date(),
        updated_at: cat.updated_at || new Date()
      });
      catalogToCabinetMap.set(cat._id.toString(), newCab._id);
      console.log(`[v3_migration] Migrated catalog "${cat.name}" -> Cabinet (${newCab._id})`);
    } else {
      catalogToCabinetMap.set(cat._id.toString(), existingCabinet._id);
    }
  }

  // Migrate legacy CatalogMedicines to CabinetMedicines
  const legacyCatalogMedicines = await catalogMedicineCollection.find({}).toArray();
  console.log(`[v3_migration] Found ${legacyCatalogMedicines.length} legacy catalog medicines.`);

  for (const cm of legacyCatalogMedicines) {
    const cabinetId = catalogToCabinetMap.get(cm.catalog_id.toString()) || cm.catalog_id;
    const existingCM = await CabinetMedicine.findOne({
      cabinet_id: cabinetId,
      medicine_id: cm.medicine_id
    });
    if (!existingCM) {
      const profileId = userProfileMap.get(cm.user_id.toString()) || null;
      await CabinetMedicine.create({
        cabinet_id: cabinetId,
        medicine_id: cm.medicine_id,
        user_id: cm.user_id,
        profile_id: profileId,
        dose_amount: cm.dose_amount || '1 tablet',
        timing: cm.timing || 'after_food',
        notes: cm.notes || ''
      });
    }
  }

  // 3. Migrate Medicines: profile_id, original_quantity, original_entry, revision 1
  const medicines = await Medicine.find({});
  console.log(`[v3_migration] Checking ${medicines.length} medicines for v3 fields and revisions...`);

  for (const med of medicines) {
    let modified = false;
    const profileId = userProfileMap.get(med.patient_id.toString());

    if (!med.profile_id && profileId) {
      med.profile_id = profileId;
      modified = true;
    }
    if (!med.original_quantity && med.quantity > 0) {
      med.original_quantity = med.quantity;
      modified = true;
    }
    if (!med.current_revision) {
      med.current_revision = 1;
      modified = true;
    }
    if (!med.original_entry || !med.original_entry.by_user_id) {
      med.original_entry = {
        by_user_id: med.patient_id,
        by_role: 'patient',
        label: 'Added by Patient',
        created_at: med.created_at || new Date()
      };
      med.entered_by_role = 'patient';
      med.entered_by_label = 'Added by Patient';
      modified = true;
    }

    if (modified) {
      await med.save();
    }

    // Ensure Revision 1 exists in MedicineRevision
    const rev1 = await MedicineRevision.findOne({
      medicine_id: med._id,
      revision_number: 1
    });

    if (!rev1) {
      await MedicineRevision.create({
        medicine_id: med._id,
        revision_number: 1,
        editor_user_id: med.patient_id,
        editor_role: med.entered_by_role || 'patient',
        editor_name: 'Original Entry',
        entry_label: med.entered_by_label || 'Added by Patient',
        change_summary: 'Initial medicine creation',
        changed_fields: [],
        previous_values: {},
        new_values: {
          name: med.name,
          salt_composition: med.salt_composition,
          dosage_form: med.dosage_form,
          quantity: med.quantity,
          expiry_date: med.expiry_date,
          batch_number: med.batch_number,
          manufacturer: med.manufacturer
        },
        audit_stamp: med.initial_audit_stamp || {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toISOString().split('T')[1].substring(0, 8),
          iso: new Date().toISOString(),
          timezone: 'Asia/Kolkata',
          location: 'Location not shared'
        }
      });
      console.log(`[v3_migration] Seeded initial revision 1 for medicine "${med.name}" (${med._id})`);
    }
  }

  // 4. Update DoseSchedules, DoseLogs, and Prescriptions with profile_id
  for (const [userIdStr, profileId] of userProfileMap.entries()) {
    const userObjId = new mongoose.Types.ObjectId(userIdStr);
    await DoseSchedule.updateMany(
      { patient_id: userObjId, profile_id: null },
      { $set: { profile_id: profileId } }
    );
    await DoseLog.updateMany(
      { patient_id: userObjId, profile_id: null },
      { $set: { profile_id: profileId } }
    );
    await Prescription.updateMany(
      { patient_id: userObjId, profile_id: null },
      { $set: { profile_id: profileId } }
    );
  }

  console.log('[v3_migration] MediTrace v3 database migration finished successfully.');
}

module.exports = { runV3Migration };

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  const { connectDB } = require('../config/db');
  connectDB().then(async () => {
    await runV3Migration();
    process.exit(0);
  }).catch((err) => {
    console.error('[v3_migration] Migration failed:', err);
    process.exit(1);
  });
}
