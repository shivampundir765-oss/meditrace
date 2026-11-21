const appointmentService = require('../services/appointment.service');
const ApiResponse = require('../utils/apiResponse');

const bookAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.bookAppointment(req.user._id, req.body);
    return ApiResponse.success(res, { appointment }, 'Appointment booked successfully', 201);
  } catch (error) {
    next(error);
  }
};

const listAppointments = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await appointmentService.listAppointments(req.user, {
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });
    return ApiResponse.success(res, result, 'Appointments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.user, req.params.id);
    return ApiResponse.success(res, { appointment }, 'Appointment details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.rescheduleAppointment(
      req.user._id,
      req.params.id,
      req.body
    );
    return ApiResponse.success(res, { appointment }, 'Appointment rescheduled successfully');
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.cancelAppointment(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  listAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment
};
