const { DoseLog } = require('../models/doseLog.model');
const { Medicine } = require('../models/medicine.model');

const markDoseTaken = async (patientId, doseId, { notes, taken_time } = {}) => {
  const log = await DoseLog.findOne({
    _id: doseId,
    patient_id: patientId
  });

  if (!log) {
    const error = new Error('Dose record not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const wasAlreadyTaken = log.status === 'taken';

  log.status = 'taken';
  log.taken_time = taken_time ? new Date(taken_time) : new Date();
  if (notes) log.notes = notes;
  await log.save();

  // Deduct 1 unit from medicine quantity if not already taken
  let remainingQuantity = null;
  if (!wasAlreadyTaken && log.medicine_id) {
    const updatedMed = await Medicine.findByIdAndUpdate(
      log.medicine_id,
      { $inc: { quantity: -1 } },
      { new: true }
    );
    if (updatedMed) {
      if (updatedMed.quantity < 0) {
        updatedMed.quantity = 0;
        await updatedMed.save();
      }
      remainingQuantity = updatedMed.quantity;
    }
  }

  return {
    dose: log,
    remainingQuantity
  };
};

const markDoseSkipped = async (patientId, doseId, { notes } = {}) => {
  const log = await DoseLog.findOne({
    _id: doseId,
    patient_id: patientId
  });

  if (!log) {
    const error = new Error('Dose record not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  log.status = 'skipped';
  if (notes) log.notes = notes;
  await log.save();

  return { dose: log };
};

const markDoseMissed = async (patientId, doseId, { notes } = {}) => {
  const log = await DoseLog.findOne({
    _id: doseId,
    patient_id: patientId
  });

  if (!log) {
    const error = new Error('Dose record not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  log.status = 'missed';
  if (notes) log.notes = notes;
  await log.save();

  return { dose: log };
};

module.exports = {
  markDoseTaken,
  markDoseSkipped,
  markDoseMissed
};
