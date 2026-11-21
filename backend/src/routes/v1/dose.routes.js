const express = require('express');
const doseController = require('../../controllers/dose.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { logActionSchema } = require('../../validators/dose.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /doses/{id}/take:
 *   post:
 *     summary: Mark a scheduled dose as taken (decrements medicine quantity)
 *     tags: [Doses]
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
 *         description: Dose marked as taken
 */
router.post('/:id/take', validate(logActionSchema), doseController.markDoseTaken);

/**
 * @openapi
 * /doses/{id}/skip:
 *   post:
 *     summary: Mark a dose as skipped
 *     tags: [Doses]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/skip', validate(logActionSchema), doseController.markDoseSkipped);

/**
 * @openapi
 * /doses/{id}/miss:
 *   post:
 *     summary: Mark a dose as missed
 *     tags: [Doses]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/miss', validate(logActionSchema), doseController.markDoseMissed);

module.exports = router;
