const express = require('express');
const prescriptionController = require('../../controllers/prescription.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createPrescriptionSchema,
  updatePrescriptionSchema
} = require('../../validators/prescription.validator');

const router = express.Router();

// All prescription routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /prescriptions:
 *   post:
 *     summary: Upload/Create a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctor_name:
 *                 type: string
 *               hospital_name:
 *                 type: string
 *               prescription_date:
 *                 type: string
 *               notes:
 *                 type: string
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Prescription created
 *   get:
 *     summary: List patient prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, archived]
 *     responses:
 *       200:
 *         description: Prescriptions listed
 */
router.route('/')
  .post(validate(createPrescriptionSchema), prescriptionController.createPrescription)
  .get(prescriptionController.getPrescriptions);

/**
 * @openapi
 * /prescriptions/{id}:
 *   get:
 *     summary: Get prescription details with linked medicines
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription details
 *   put:
 *     summary: Update a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription updated
 *   delete:
 *     summary: Delete a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription deleted
 */
router.route('/:id')
  .get(prescriptionController.getPrescriptionById)
  .put(validate(updatePrescriptionSchema), prescriptionController.updatePrescription)
  .delete(prescriptionController.deletePrescription);

module.exports = router;
