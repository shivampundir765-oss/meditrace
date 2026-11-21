const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');

/**
 * Calculate stock metrics including daily consumption and predicted finish date
 */
const calculateStockMetrics = (medicine, activeSchedules = []) => {
  const dailyConsumption = activeSchedules.reduce((sum, s) => sum + (s.times_per_day || 1), 0);
  const quantity = medicine.quantity || 0;
  const threshold = medicine.low_stock_threshold || 5;

  let daysRemaining = null;
  let predictedFinishDate = null;

  if (dailyConsumption > 0) {
    daysRemaining = Math.floor(quantity / dailyConsumption);
    const finish = new Date();
    finish.setDate(finish.getDate() + daysRemaining);
    predictedFinishDate = finish;
  }

  const isLowStock = quantity <= threshold || (daysRemaining !== null && daysRemaining <= 3);

  const now = new Date();
  const isExpired = medicine.expiry_date ? new Date(medicine.expiry_date) < now : false;
  let daysUntilExpiry = null;
  if (medicine.expiry_date) {
    const diffTime = new Date(medicine.expiry_date) - now;
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    ...medicine.toObject(),
    dailyConsumption,
    daysRemaining,
    predictedFinishDate,
    isLowStock,
    isExpired,
    daysUntilExpiry
  };
};

const getStockOverview = async (patientId) => {
  const [medicines, schedules] = await Promise.all([
    Medicine.find({ patient_id: patientId, status: 'active' }).sort({ name: 1 }),
    DoseSchedule.find({ patient_id: patientId, is_active: true })
  ]);

  const schedulesByMedId = {};
  for (const s of schedules) {
    const medId = s.medicine_id.toString();
    if (!schedulesByMedId[medId]) schedulesByMedId[medId] = [];
    schedulesByMedId[medId].push(s);
  }

  const items = medicines.map((med) => {
    const medSchedules = schedulesByMedId[med._id.toString()] || [];
    return calculateStockMetrics(med, medSchedules);
  });

  const lowStockItems = items.filter((i) => i.isLowStock);
  const expiringSoonItems = items.filter((i) => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 30 && i.daysUntilExpiry >= 0);
  const expiredItems = items.filter((i) => i.isExpired);

  return {
    totalMedicines: items.length,
    lowStockCount: lowStockItems.length,
    expiringSoonCount: expiringSoonItems.length,
    expiredCount: expiredItems.length,
    stockItems: items
  };
};

const updateStock = async (patientId, medicineId, { quantity, low_stock_threshold, action = 'set' }) => {
  const medicine = await Medicine.findOne({ _id: medicineId, patient_id: patientId });
  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  if (action === 'add') {
    medicine.quantity = (medicine.quantity || 0) + quantity;
  } else {
    medicine.quantity = quantity;
  }

  if (low_stock_threshold !== undefined) {
    medicine.low_stock_threshold = low_stock_threshold;
  }

  await medicine.save();

  const schedules = await DoseSchedule.find({ medicine_id: medicineId, is_active: true });
  return calculateStockMetrics(medicine, schedules);
};

const getLowStockMedicines = async (patientId) => {
  const overview = await getStockOverview(patientId);
  return {
    lowStockMedicines: overview.stockItems.filter((i) => i.isLowStock)
  };
};

const getExpiringMedicines = async (patientId, days = 30) => {
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + Number(days));

  const medicines = await Medicine.find({
    patient_id: patientId,
    expiry_date: { $ne: null, $lte: thresholdDate }
  }).sort({ expiry_date: 1 });

  const categorized = medicines.map((med) => {
    const isExpired = new Date(med.expiry_date) < now;
    const diffTime = new Date(med.expiry_date) - now;
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...med.toObject(),
      isExpired,
      daysUntilExpiry
    };
  });

  return {
    thresholdDays: Number(days),
    totalExpiring: categorized.length,
    medicines: categorized
  };
};

module.exports = {
  calculateStockMetrics,
  getStockOverview,
  updateStock,
  getLowStockMedicines,
  getExpiringMedicines
};
