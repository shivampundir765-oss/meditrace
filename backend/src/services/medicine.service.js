const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { DoseLog } = require('../models/doseLog.model');
const { CatalogMedicine } = require('../models/catalogMedicine.model');
const { Catalog } = require('../models/catalog.model');
const medicineLookupService = require('./medicineLookup.service');
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
  const threshold = med.low_stock_threshold || 5;

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
  } else if (quantity <= threshold) {
    // Estimate daily doses
    const dailyDoses = scheduleInfo?.times_per_day || 1;
    const daysLeft = Math.max(1, Math.floor(quantity / dailyDoses));
    alerts.push({
      type: 'low_stock',
      level: 'amber',
      message: `Low stock (${quantity} doses left, ~${daysLeft} day${daysLeft === 1 ? '' : 's'})`
    });
    if (statusColor !== 'red') {
      statusLine = `Low stock (${quantity} left, ~${daysLeft}d)`;
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
    hasAlert: alerts.length > 0
  };
};

const createMedicine = async (patientId, data) => {
  // 1. Clinical metadata enrichment via lookup if empty
  let enriched = { ...data };
  if (!enriched.description || !enriched.usedFor || !enriched.category) {
    const lookupResult = await medicineLookupService.lookup(data.name, data.salt_composition);
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
  }

  const medicine = await Medicine.create({
    ...enriched,
    patient_id: patientId
  });

  // 2. Handle catalog assignment if provided
  if (data.catalog_id) {
    try {
      await CatalogMedicine.findOneAndUpdate(
        { catalog_id: data.catalog_id, medicine_id: medicine._id },
        {
          user_id: patientId,
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
    const times = data.mealSlots.map(s => mealTimesMap[s.meal] || '08:00');

    const schedule = await DoseSchedule.create({
      medicine_id: medicine._id,
      patient_id: patientId,
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

const getMedicines = async (patientId, { page = 1, limit = 20, status, filter, search, category }) => {
  const query = { patient_id: patientId };

  if (status) {
    query.status = status;
  }

  if (category && ['Common', 'Chronic', 'Serious'].includes(category)) {
    query.category = category;
  }

  const now = new Date();
  if (filter === 'expired') {
    query.expiry_date = { $lt: now, $ne: null };
  } else if (filter === 'active') {
    query.status = 'active';
    query.$or = [
      { expiry_date: { $gte: now } },
      { expiry_date: null }
    ];
  }

  if (search) {
    const cleanSearch = search.trim();
    query.$or = [
      { name: { $regex: cleanSearch, $options: 'i' } },
      { nickname: { $regex: cleanSearch, $options: 'i' } },
      { generic_name: { $regex: cleanSearch, $options: 'i' } },
      { salt_composition: { $regex: cleanSearch, $options: 'i' } },
      { usedFor: { $regex: cleanSearch, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [medicines, total] = await Promise.all([
    Medicine.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Medicine.countDocuments(query)
  ]);

  // Fetch catalogs and schedules to attach contextual status & alert information
  const medIds = medicines.map(m => m._id);
  const [schedules, catalogMedicines, catalogs] = await Promise.all([
    DoseSchedule.find({ medicine_id: { $in: medIds }, is_active: true }).lean(),
    CatalogMedicine.find({ medicine_id: { $in: medIds } }).lean(),
    Catalog.find({ user_id: patientId }).lean()
  ]);

  const scheduleMap = {};
  schedules.forEach(s => {
    scheduleMap[String(s.medicine_id)] = s;
  });

  const catMap = {};
  catalogMedicines.forEach(cm => {
    const cat = catalogs.find(c => String(c._id) === String(cm.catalog_id));
    if (cat) {
      catMap[String(cm.medicine_id)] = {
        catalog_id: cat._id,
        name: cat.name,
        time_slot: cat.time_slot,
        color: cat.color,
        timing: cm.timing,
        dose_amount: cm.dose_amount
      };
    }
  });

  const enrichedMedicines = medicines.map(med => {
    const sched = scheduleMap[String(med._id)] || null;
    const cat = catMap[String(med._id)] || null;
    const statusData = computeMedicineStatusAndAlerts(med, sched);

    return {
      ...med,
      catalog: cat,
      schedule: sched,
      ...statusData
    };
  });

  // Sort: medicines with active alerts first, then normal
  enrichedMedicines.sort((a, b) => {
    if (a.hasAlert && !b.hasAlert) return -1;
    if (!a.hasAlert && b.hasAlert) return 1;
    return 0;
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

const getMedicineById = async (patientId, medicineId) => {
  const medicine = await Medicine.findOne({
    _id: medicineId,
    patient_id: patientId
  }).lean();

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const [schedules, catalogMapping] = await Promise.all([
    DoseSchedule.find({ medicine_id: medicineId, patient_id: patientId }).lean(),
    CatalogMedicine.findOne({ medicine_id: medicineId, user_id: patientId }).populate('catalog_id').lean()
  ]);

  const activeSchedule = schedules.find(s => s.is_active) || schedules[0] || null;
  const statusData = computeMedicineStatusAndAlerts(medicine, activeSchedule);

  return {
    medicine: {
      ...medicine,
      catalog: catalogMapping ? {
        catalog_id: catalogMapping.catalog_id?._id,
        name: catalogMapping.catalog_id?.name,
        time_slot: catalogMapping.catalog_id?.time_slot,
        color: catalogMapping.catalog_id?.color,
        timing: catalogMapping.timing,
        dose_amount: catalogMapping.dose_amount
      } : null,
      ...statusData
    },
    schedules
  };
};

const updateMedicine = async (patientId, medicineId, data) => {
  const medicine = await Medicine.findOneAndUpdate(
    { _id: medicineId, patient_id: patientId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return medicine;
};

const deleteMedicine = async (patientId, medicineId) => {
  const medicine = await Medicine.findOneAndDelete({
    _id: medicineId,
    patient_id: patientId
  });

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Cascade delete schedules, logs, and catalog medicines
  const schedules = await DoseSchedule.find({ medicine_id: medicineId });
  const scheduleIds = schedules.map(s => s._id);

  await Promise.all([
    DoseSchedule.deleteMany({ medicine_id: medicineId }),
    CatalogMedicine.deleteMany({ medicine_id: medicineId }),
    DoseLog.deleteMany({
      $or: [
        { medicine_id: medicineId },
        { schedule_id: { $in: scheduleIds } }
      ]
    })
  ]);

  return { message: 'Medicine and associated schedules removed successfully' };
};

/**
 * Migration helper to enrich any legacy medicines in DB that lack clinical category / usedFor
 */
const enrichExistingMedicines = async () => {
  try {
    const legacyMeds = await Medicine.find({
      $or: [
        { category: { $exists: false } },
        { usedFor: { $exists: false } },
        { usedFor: '' },
        { description: '' }
      ]
    });

    for (const med of legacyMeds) {
      const lookup = await medicineLookupService.lookup(med.name, med.salt_composition);
      med.description = med.description || lookup.description;
      med.usedFor = med.usedFor || lookup.usedFor;
      med.category = med.category || lookup.category || 'Common';
      med.cautions = med.cautions || lookup.cautions;
      med.source = med.source || lookup.source;
      if (!med.nickname && lookup.nickname) med.nickname = lookup.nickname;
      await med.save();
    }
  } catch (_e) {}
};

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  computeMedicineStatusAndAlerts,
  enrichExistingMedicines
};
