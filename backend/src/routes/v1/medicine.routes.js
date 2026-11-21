const express = require('express');
const medicineController = require('../../controllers/medicine.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createMedicineSchema,
  updateMedicineSchema
} = require('../../validators/medicine.validator');
const { createScheduleSchema } = require('../../validators/schedule.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /medicines:
 *   post:
 *     summary: Add medicine manually or from scan
 *     tags: [Medicines]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               generic_name:
 *                 type: string
 *               salt_composition:
 *                 type: string
 *               dosage_form:
 *                 type: string
 *               strength:
 *                 type: string
 *               quantity:
 *                 type: number
 *               expiry_date:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medicine created
 *   get:
 *     summary: List medicines with filters (active, expired, search)
 *     tags: [Medicines]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [active, expired]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medicine list
 */
router.route('/')
  .post(validate(createMedicineSchema), medicineController.createMedicine)
  .get(medicineController.getMedicines);

/**
 * @openapi
 * /medicines/{id}:
 *   get:
 *     summary: Get medicine details and associated schedules
 *     tags: [Medicines]
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Update medicine
 *     tags: [Medicines]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Remove medicine and associated schedules
 *     tags: [Medicines]
 *     security:
 *       - BearerAuth: []
 */
router.route('/:id')
  .get(medicineController.getMedicineById)
  .put(validate(updateMedicineSchema), medicineController.updateMedicine)
  .delete(medicineController.deleteMedicine);

/**
 * @openapi
 * /medicines/{id}/schedule:
 *   post:
 *     summary: Create dose schedule for a medicine
 *     tags: [Medicines, Schedules]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/schedule', validate(createScheduleSchema), medicineController.createMedicineSchedule);

module.exports = router;
