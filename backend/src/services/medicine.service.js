const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { DoseLog } = require('../models/doseLog.model');

const createMedicine = async (patientId, data) => {
  const medicine = await Medicine.create({
    ...data,
    patient_id: patientId
  });
  return medicine;
};

const getMedicines = async (patientId, { page = 1, limit = 20, status, filter, search }) => {
  const query = { patient_id: patientId };

  if (status) {
    query.status = status;
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
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { generic_name: { $regex: search, $options: 'i' } },
      { salt_composition: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [medicines, total] = await Promise.all([
    Medicine.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
    Medicine.countDocuments(query)
  ]);

  return {
    medicines,
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
  });

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const schedules = await DoseSchedule.find({
    medicine_id: medicineId,
    patient_id: patientId
  });

  return {
    medicine,
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

  // Cascade delete schedules and logs
  const schedules = await DoseSchedule.find({ medicine_id: medicineId });
  const scheduleIds = schedules.map(s => s._id);

  await Promise.all([
    DoseSchedule.deleteMany({ medicine_id: medicineId }),
    DoseLog.deleteMany({
      $or: [
        { medicine_id: medicineId },
        { schedule_id: { $in: scheduleIds } }
      ]
    })
  ]);

  return { message: 'Medicine and associated schedules removed successfully' };
};

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
};
