const express = require('express');
const scheduleController = require('../../controllers/schedule.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { updateScheduleSchema } = require('../../validators/schedule.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /schedule/today:
 *   get:
 *     summary: Get today's doses and schedule summary for the patient
 *     tags: [Schedules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's schedule
 */
router.get('/today', scheduleController.getScheduleToday);

/**
 * @openapi
 * /schedule/{id}:
 *   put:
 *     summary: Update a dose schedule
 *     tags: [Schedules]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete a dose schedule
 *     tags: [Schedules]
 *     security:
 *       - BearerAuth: []
 */
router.route('/:id')
  .put(validate(updateScheduleSchema), scheduleController.updateSchedule)
  .delete(scheduleController.deleteSchedule);

module.exports = router;
