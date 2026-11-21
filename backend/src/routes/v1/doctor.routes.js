const express = require('express');
const doctorController = require('../../controllers/doctor.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  doctorProfileSchema,
  doctorSearchSchema
} = require('../../validators/doctor.validator');

const router = express.Router();

/**
 * @openapi
 * /doctors:
 *   get:
 *     summary: Search doctors by name, specialization, city
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor search results
 */
router.get('/', validate(doctorSearchSchema), doctorController.searchDoctors);

/**
 * @openapi
 * /doctors/profile/me:
 *   get:
 *     summary: Get logged-in doctor profile
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create or update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 */
router.route('/profile/me')
  .get(authenticate, authorize('doctor', 'admin'), doctorController.getProfile)
  .post(authenticate, authorize('doctor', 'admin'), validate(doctorProfileSchema), doctorController.upsertProfile);

/**
 * @openapi
 * /doctors/{id}/slots:
 *   get:
 *     summary: Get free and booked consultation time slots for a specific date
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily consultation slots with availability flags
 */
router.get('/:id/slots', doctorController.getFreeSlots);

/**
 * @openapi
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor profile by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor profile
 */
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
