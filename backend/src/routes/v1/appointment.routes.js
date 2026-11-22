const express = require('express');
const appointmentController = require('../../controllers/appointment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  bookAppointmentSchema,
  rescheduleAppointmentSchema
} = require('../../validators/appointment.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Book an appointment with no double booking
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctor_id, slot_start]
 *             properties:
 *               doctor_id:
 *                 type: string
 *               slot_start:
 *                 type: string
 *               reason:
 *                 type: string
 *               consultation_type:
 *                 type: string
 *                 enum: [in_person, video]
 *     responses:
 *       201:
 *         description: Appointment booked
 *       409:
 *         description: Slot already booked (conflict)
 *   get:
 *     summary: List user appointments (filtered by patient or doctor view)
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 */
router.route('/')
  .post(validate(bookAppointmentSchema), appointmentController.bookAppointment)
  .get(appointmentController.listAppointments);

router.get('/my', appointmentController.listAppointments);

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     summary: Get single appointment details
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Reschedule appointment to a new available slot
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Cancel appointment and free up the slot
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 */
router.route('/:id')
  .get(appointmentController.getAppointmentById)
  .put(validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment)
  .delete(appointmentController.cancelAppointment);

module.exports = router;
