const { Prescription } = require('../models/prescription.model');
const { Medicine } = require('../models/medicine.model');

const createPrescription = async (patientId, data) => {
  const prescription = await Prescription.create({
    ...data,
    patient_id: patientId
  });
  return prescription;
};

const getPrescriptions = async (patientId, { page = 1, limit = 20, status }) => {
  const query = { patient_id: patientId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [prescriptions, total] = await Promise.all([
    Prescription.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
    Prescription.countDocuments(query)
  ]);

  return {
    prescriptions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getPrescriptionById = async (patientId, prescriptionId) => {
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patient_id: patientId
  });

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Also fetch associated medicines
  const medicines = await Medicine.find({
    prescription_id: prescriptionId,
    patient_id: patientId
  });

  return {
    prescription,
    medicines
  };
};

const updatePrescription = async (patientId, prescriptionId, data) => {
  const prescription = await Prescription.findOneAndUpdate(
    { _id: prescriptionId, patient_id: patientId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return prescription;
};

const deletePrescription = async (patientId, prescriptionId) => {
  const prescription = await Prescription.findOneAndDelete({
    _id: prescriptionId,
    patient_id: patientId
  });

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Unlink medicines associated with this prescription
  await Medicine.updateMany(
    { prescription_id: prescriptionId, patient_id: patientId },
    { $set: { prescription_id: null } }
  );

  return { message: 'Prescription deleted successfully' };
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
