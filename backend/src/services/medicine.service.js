const { Medicine } = require('../models/medicine.model');
const { Profile } = require('../models/profile.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { DoseLog } = require('../models/doseLog.model');
const { CabinetMedicine } = require('../models/cabinetMedicine.model');
const { Cabinet } = require('../models/cabinet.model');
const { defaultDrugProvider } = require('./drugProvider');
const revisionService = require('./revision.service');
const { generateDoseLogsForDate } = require('./schedule.service');

/**
 * Compute real-time status and alerts for a medicine
 */
const computeMedicineStatusAndAlerts = (med, scheduleInfo = null) => {
  const alerts = [];
  let statusLine = 'In stock';
  let statusColor = 'green';

  const now = new Date();
  const quantity = typeof med.quantity === 'number' ? med.quantity : 0;
  const originalQuantity = typeof med.original_quantity === 'number' ? med.original_quantity : quantity;

  // Dynamic Few Left Threshold: max(3 days dosage, 20% of original quantity)
  const dailyDoses = scheduleInfo?.times_per_day || (scheduleInfo?.mealSlots?.length || 2);
  const calculatedThreshold = Math.max(dailyDoses * 3, Math.max(1, Math.round(originalQuantity * 0.2)));
  const effectiveThreshold =
    med.stock_threshold !== null && med.stock_threshold !== undefined
      ? Number(med.stock_threshold)
      : (med.low_stock_threshold || calculatedThreshold);

  // 1. Expiry alerts
  if (med.expiry_date) {
    const expDate = new Date(med.expiry_date);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      alerts.push({
        type: 'expired',
        level: 'red',
        message: 'Medicine has expired'
      });
      statusLine = 'Expired';
      statusColor = 'red';
    } else if (diffDays <= 30) {
      alerts.push({
        type: 'expiring_soon',
        level: 'amber',
        message: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`
      });
      if (statusColor !== 'red') {
        statusLine = `Expires in ${diffDays} days`;
        statusColor = 'amber';
      }
    }
  }

  // 2. Stock alerts
  if (quantity <= 0) {
    alerts.push({
      type: 'out_of_stock',
      level: 'red',
      message: 'Out of stock'
    });
    statusLine = 'Out of stock';
    statusColor = 'red';
  } else if (quantity <= effectiveThreshold) {
    const daysLeft = Math.max(1, Math.floor(quantity / Math.max(1, dailyDoses)));
    alerts.push({
      type: 'low_stock',
      level: 'amber',
      message: `Few left (${quantity} doses left, ~${daysLeft} day${daysLeft === 1 ? '' : 's'})`
    });
    if (statusColor !== 'red') {
      statusLine = `Few left (${quantity} left, ~${daysLeft}d)`;
      statusColor = 'amber';
    }
  }

  // 3. Course finished check
  if (scheduleInfo && scheduleInfo.end_date) {
    const endDate = new Date(scheduleInfo.end_date);
    if (endDate < now) {
      alerts.push({
        type: 'course_finished',
        level: 'red',
        message: 'Prescribed course finished'
      });
      statusLine = 'Course finished';
      statusColor = 'red';
    }
  }

  return {
    statusLine,
    statusColor,
    alerts,
    hasAlert: alerts.length > 0,
    effectiveThreshold
  };
};

const createMedicine = async (patientId, profileId, data, editorUser = null, locationPayload = null) => {
  // 1. Clinical metadata enrichment via DrugInfoProvider if empty
  let enriched = { ...data };
  if (!enriched.description || !enriched.usedFor || !enriched.category) {
    let lookupResult = null;
    if (data.barcode) {
      lookupResult = await defaultDrugProvider.lookupByBarcode(data.barcode);
    }
    if (!lookupResult) {
      lookupResult = await defaultDrugProvider.lookupByName(data.name, data.salt_composition);
    }

    if (lookupResult) {
      enriched.description = enriched.description || lookupResult.description;
      enriched.usedFor = enriched.usedFor || lookupResult.usedFor;
      enriched.category = enriched.category || lookupResult.category || 'Common';
      enriched.cautions = enriched.cautions || lookupResult.cautions;
      enriched.source = enriched.source || lookupResult.source;
      if (!enriched.nickname && lookupResult.nickname) {
        enriched.nickname = lookupResult.nickname;
      }
      if (!enriched.strength && lookupResult.strength) {
        enriched.strength = lookupResult.strength;
      }
      if (!enriched.dosage_form && lookupResult.dosage_form) {
        enriched.dosage_form = lookupResult.dosage_form;
      }
      if (!enriched.abdm_drug_code && lookupResult.abdm_drug_code) {
        enriched.abdm_drug_code = lookupResult.abdm_drug_code;
      }
      if (!enriched.cdsco_approval_status && lookupResult.cdsco_approval_status) {
        enriched.cdsco_approval_status = lookupResult.cdsco_approval_status;
      }
    }
  }

  let effectivePatientId = patientId;
  if (data.patient_id) {
    effectivePatientId = data.patient_id;
  } else if (profileId) {
    const prof = await Profile.findById(profileId);
    if (prof && prof.user_id) effectivePatientId = prof.user_id;
  }

  const role = (editorUser && editorUser.role) || 'patient';
  let enteredByLabel = 'Added by Patient';
  if (role === 'pharmacist') {
    enteredByLabel = 'Entered by Pharmacist';
  } else if (role === 'doctor') {
    enteredByLabel = 'Entered by Doctor';
  }

  const quantity = Number(enriched.quantity) || 0;
  const originalQuantity = Number(enriched.original_quantity) || quantity;
  const initialStatus = enriched.status || (enriched.expiry_date && new Date(enriched.expiry_date) < new Date() ? 'expired' : 'active');

  const medicine = new Medicine({
    ...enriched,
    status: initialStatus,
    patient_id: effectivePatientId,
    profile_id: profileId || enriched.profile_id || null,
    quantity,
    original_quantity: originalQuantity,
    entered_by_role: role,
    entered_by_label: enteredByLabel,
    field_sources: enriched.field_sources || {},
    is_deleted: false,
    current_revision: 1
  });

  await medicine.save();

  // Create immutable Revision 1
  const actor = editorUser || { _id: patientId, role: 'patient', name: 'Patient' };
  await revisionService.createInitialRevision(medicine, actor, locationPayload);
  await medicine.save();

  // 2. Handle cabinet assignment if provided (supports cabinet_id or legacy catalog_id)
  const targetCabinetId = data.cabinet_id || data.catalog_id;
  if (targetCabinetId) {
    try {
      await CabinetMedicine.findOneAndUpdate(
        { cabinet_id: targetCabinetId, medicine_id: medicine._id },
        {
          user_id: patientId,
          profile_id: profileId || medicine.profile_id,
          dose_amount: data.dose_amount || '1 tablet',
          timing: data.timing || 'after_food',
          notes: data.notes || ''
        },
        { upsert: true, new: true }
      );
    } catch (_e) {}
  }

  // 3. Handle mealSlots / schedule creation if provided
  if (data.mealSlots && Array.isArray(data.mealSlots) && data.mealSlots.length > 0) {
    const mealTimesMap = {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '20:00',
      bedtime: '22:00'
    };
    const times = data.mealSlots.map((s) => mealTimesMap[s.meal] || '08:00');

    const schedule = await DoseSchedule.create({
      medicine_id: medicine._id,
      patient_id: patientId,
      profile_id: profileId || medicine.profile_id,
      dose_amount: data.dose_amount || '1 tablet',
      times_per_day: data.mealSlots.length,
      specific_times: [...new Set(times)],
      start_date: new Date(),
      mealSlots: data.mealSlots,
      instructions: data.do_not_take_note || data.notes || ''
    });

    await generateDoseLogsForDate(schedule, new Date());
  }

  const statusData = computeMedicineStatusAndAlerts(medicine);
  return {
    ...medicine.toObject(),
    ...statusData
  };
};

const getMedicines = async (patientId, profileId, { page = 1, limit = 50, status, filter, search, category, cabinet_id, catalog_id }) => {
  const query = {
    patient_id: patientId,
    is_deleted: { $ne: true }
  };

  if (profileId) {
    query.$or = [{ profile_id: profileId }, { profile_id: null }];
  }

  const now = new Date();
  if (status === 'expired' || filter === 'expired') {
    query.$or = [{ status: 'expired' }, { expiry_date: { $lt: now, $ne: null } }];
  } else if (status === 'active' || filter === 'active') {
    query.status = 'active';
    query.expiry_date = { $not: { $lt: now } };
  } else if (status) {
    query.status = status;
  }

  if (category && ['Common', 'Chronic', 'Serious'].includes(category)) {
    query.category = category;
  }

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { generic_name: { $regex: term, $options: 'i' } },
      { salt_composition: { $regex: term, $options: 'i' } },
      { nickname: { $regex: term, $options: 'i' } },
      { usedFor: { $regex: term, $options: 'i' } }
    ];
  }

  // Handle cabinet filter if passed
  const cabFilterId = cabinet_id || catalog_id;
  if (cabFilterId) {
    const cabMeds = await CabinetMedicine.find({ cabinet_id: cabFilterId }).lean();
    const allowedIds = cabMeds.map((cm) => cm.medicine_id);
    query._id = { $in: allowedIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [medicines, total] = await Promise.all([
    Medicine.find(query).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
    Medicine.countDocuments(query)
  ]);

  const medicineIds = medicines.map((m) => m._id);

  const [schedules, cabinetMappings] = await Promise.all([
    DoseSchedule.find({ medicine_id: { $in: medicineIds }, is_active: true }).lean(),
    CabinetMedicine.find({ medicine_id: { $in: medicineIds } }).populate('cabinet_id').lean()
  ]);

  const scheduleMap = {};
  schedules.forEach((s) => {
    scheduleMap[String(s.medicine_id)] = s;
  });

  const cabMap = {};
  cabinetMappings.forEach((cm) => {
    if (cm.cabinet_id) {
      cabMap[String(cm.medicine_id)] = {
        cabinet_id: cm.cabinet_id._id,
        name: cm.cabinet_id.name,
        time_slot: cm.cabinet_id.time_slot,
        color: cm.cabinet_id.color,
        timing: cm.timing,
        dose_amount: cm.dose_amount
      };
    }
  });

  const enrichedMedicines = medicines.map((med) => {
    const sched = scheduleMap[String(med._id)] || null;
    const cab = cabMap[String(med._id)] || null;
    const statusData = computeMedicineStatusAndAlerts(med, sched);

    return {
      ...med,
      cabinet: cab,
      catalog: cab, // backward compatible alias
      schedule: sched,
      ...statusData
    };
  });

  return {
    medicines: enrichedMedicines,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getMedicineById = async (patientId, profileId, medicineId) => {
  const query = {
    _id: medicineId,
    patient_id: patientId,
    is_deleted: { $ne: true }
  };

  const medicine = await Medicine.findOne(query).lean();
  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const [schedules, cabinetMapping, revisions] = await Promise.all([
    DoseSchedule.find({ medicine_id: medicineId, patient_id: patientId }).lean(),
    CabinetMedicine.findOne({ medicine_id: medicineId, user_id: patientId }).populate('cabinet_id').lean(),
    revisionService.getRevisions(medicineId)
  ]);

  const activeSchedule = schedules.find((s) => s.is_active) || schedules[0] || null;
  const statusData = computeMedicineStatusAndAlerts(medicine, activeSchedule);

  return {
    medicine: {
      ...medicine,
      cabinet: cabinetMapping
        ? {
            cabinet_id: cabinetMapping.cabinet_id?._id,
            name: cabinetMapping.cabinet_id?.name,
            time_slot: cabinetMapping.cabinet_id?.time_slot,
            color: cabinetMapping.cabinet_id?.color,
            timing: cabinetMapping.timing,
            dose_amount: cabinetMapping.dose_amount
          }
        : null,
      catalog: cabinetMapping
        ? {
            catalog_id: cabinetMapping.cabinet_id?._id,
            name: cabinetMapping.cabinet_id?.name,
            time_slot: cabinetMapping.cabinet_id?.time_slot,
            color: cabinetMapping.cabinet_id?.color,
            timing: cabinetMapping.timing,
            dose_amount: cabinetMapping.dose_amount
          }
        : null,
      ...statusData
    },
    schedules,
    revisions
  };
};

const updateMedicine = async (patientId, medicineId, data, editorUser = null, locationPayload = null) => {
  const medicine = await Medicine.findOne({
    _id: medicineId,
    patient_id: patientId,
    is_deleted: { $ne: true }
  });

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Create append-only revision on modification
  const actor = editorUser || { _id: patientId, role: 'patient', name: 'Patient' };
  await revisionService.createEditRevision(medicine, actor, data, locationPayload);

  // Apply updates to medicine document
  Object.keys(data).forEach((key) => {
    if (!['_id', 'patient_id', 'is_deleted', 'deleted_at', 'deleted_by', 'current_revision'].includes(key)) {
      medicine[key] = data[key];
    }
  });

  await medicine.save();
  return medicine;
};

const deleteMedicine = async (patientId, medicineId, editorUser = null) => {
  const medicine = await Medicine.findOne({
    _id: medicineId,
    patient_id: patientId,
    is_deleted: { $ne: true }
  });

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Soft delete medicine (never delete revision history)
  medicine.is_deleted = true;
  medicine.deleted_at = new Date();
  medicine.deleted_by = editorUser?._id || patientId;
  await medicine.save();

  // Deactivate schedules and cabinet linkages
  await Promise.all([
    DoseSchedule.updateMany({ medicine_id: medicineId }, { $set: { is_active: false } }),
    CabinetMedicine.deleteMany({ medicine_id: medicineId })
  ]);

  return { success: true, message: 'Medicine moved to archived/deleted successfully' };
};

const getMedicineRevisions = async (medicineId) => {
  return await revisionService.getRevisions(medicineId);
};

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicineRevisions,
  computeMedicineStatusAndAlerts
};
