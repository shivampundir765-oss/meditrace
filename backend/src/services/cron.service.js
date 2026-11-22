const cron = require('node-cron');
const { DoseLog } = require('../models/doseLog.model');
const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { calculateStockMetrics } = require('./stock.service');
const { createNotification } = require('./notification.service');
const logger = require('../utils/logger');

/**
 * 15-Minute Cron Job: Check unconfirmed doses past 2-hour grace period
 * Marks unconfirmed doses as 'missed' if > 2 hours past scheduled time and still 'scheduled'.
 */
const runFifteenMinuteMissedDoseJob = async (gracePeriodHours = 2) => {
  logger.info(`[CRON] Running 15-minute missed dose check (grace period: ${gracePeriodHours}h)...`);
  const now = new Date();
  const graceThreshold = new Date(now.getTime() - gracePeriodHours * 60 * 60 * 1000);

  let missedMarked = 0;
  try {
    const overdueDoses = await DoseLog.find({
      scheduled_time: { $lt: graceThreshold },
      status: 'scheduled'
    }).populate('medicine_id', 'name strength');

    for (const dose of overdueDoses) {
      dose.status = 'missed';
      await dose.save();

      if (dose.medicine_id) {
        await createNotification(dose.patient_id, {
          type: 'dose',
          title: `Missed Dose: ${dose.medicine_id.name}`,
          message: `Your scheduled dose of ${dose.medicine_id.name} at ${new Date(dose.scheduled_time).toLocaleTimeString()} was not marked taken within the ${gracePeriodHours}-hour window and is marked missed.`,
          channel: 'in_app',
          action_type: 'mark_taken',
          action_url: `/doses/${dose._id}/take`,
          reference_id: dose._id
        });
        missedMarked++;
      }
    }

    if (missedMarked > 0) {
      logger.info(`[CRON] 15-minute check marked ${missedMarked} doses as missed.`);
    }
    return { missedMarked };
  } catch (err) {
    logger.error(`[CRON] Error in 15-minute missed dose job: ${err.message}`);
    throw err;
  }
};

/**
 * Hourly Cron Job: Check doses
 * 1. Send reminders for upcoming doses in the next hour
 */
const runHourlyDoseJob = async () => {
  logger.info('[CRON] Running hourly dose check job...');
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  let remindersSent = 0;
  let missedMarked = 0;

  try {
    // 1. Upcoming doses (within next hour) that haven't been taken
    const upcomingDoses = await DoseLog.find({
      scheduled_time: { $gte: now, $lte: oneHourFromNow },
      status: 'scheduled'
    }).populate('medicine_id', 'name strength');

    for (const dose of upcomingDoses) {
      if (dose.medicine_id) {
        await createNotification(dose.patient_id, {
          type: 'dose',
          title: `Dose Reminder: ${dose.medicine_id.name}`,
          message: `It is almost time to take your dose of ${dose.medicine_id.name} (${dose.medicine_id.strength || ''}).`,
          channel: 'push',
          action_type: 'mark_taken',
          action_url: `/doses/${dose._id}/take`,
          reference_id: dose._id
        });
        remindersSent++;
      }
    }

    // 2. Doses overdue by > 30 mins that are still 'scheduled' -> mark as 'missed'
    const overdueDoses = await DoseLog.find({
      scheduled_time: { $lt: thirtyMinutesAgo },
      status: 'scheduled'
    }).populate('medicine_id', 'name strength');

    for (const dose of overdueDoses) {
      dose.status = 'missed';
      await dose.save();

      if (dose.medicine_id) {
        await createNotification(dose.patient_id, {
          type: 'dose',
          title: `Missed Dose: ${dose.medicine_id.name}`,
          message: `You missed your scheduled dose of ${dose.medicine_id.name} at ${dose.scheduled_time.toLocaleTimeString()}. Please take it if safe or consult your schedule.`,
          channel: 'push',
          action_type: 'mark_taken',
          action_url: `/doses/${dose._id}/take`,
          reference_id: dose._id
        });
        missedMarked++;
      }
    }

    logger.info(`[CRON] Hourly dose job complete: ${remindersSent} reminders, ${missedMarked} missed alerts.`);
    return { remindersSent, missedMarked };
  } catch (error) {
    logger.error(`[CRON] Hourly dose job error: ${error.message}`);
    throw error;
  }
};

/**
 * Daily Cron Job: Check stock and expiry
 * 1. Low stock alerts (3 days or fewer remaining or <= threshold)
 * 2. Course finished alerts (0 quantity remaining)
 * 3. Expiry alerts (30 days, 7 days, today, and expired)
 */
const runDailyStockExpiryJob = async () => {
  logger.info('[CRON] Running daily stock and expiry check job...');
  const now = new Date();
  let lowStockAlerts = 0;
  let expiryAlerts = 0;

  try {
    const medicines = await Medicine.find({ status: 'active' });

    for (const med of medicines) {
      const schedules = await DoseSchedule.find({ medicine_id: med._id, is_active: true });
      const metrics = calculateStockMetrics(med, schedules);

      // Check Course Finished / Out of Stock
      if (metrics.quantity === 0) {
        await createNotification(med.patient_id, {
          type: 'low_stock',
          title: `Course Finished / Out of Stock: ${med.name}`,
          message: `You have 0 doses of ${med.name} remaining. Please refill your prescription if required.`,
          channel: 'push',
          action_type: 'buy_now',
          action_url: `/shop?search=${encodeURIComponent(med.name)}`,
          reference_id: med._id
        });
        lowStockAlerts++;
      } else if (metrics.isLowStock) {
        // Low stock: 3 days or fewer or below threshold
        const daysMsg = metrics.daysRemaining !== null
          ? `covers approximately ${metrics.daysRemaining} day(s)`
          : `only ${metrics.quantity} remaining`;

        await createNotification(med.patient_id, {
          type: 'low_stock',
          title: `Low Stock Alert: ${med.name}`,
          message: `Your stock of ${med.name} ${daysMsg}. Reorder now to avoid missing doses.`,
          channel: 'push',
          action_type: 'buy_now',
          action_url: `/shop?search=${encodeURIComponent(med.name)}`,
          reference_id: med._id
        });
        lowStockAlerts++;
      }

      // Check Expiry Tracking
      if (med.expiry_date) {
        const expDate = new Date(med.expiry_date);
        const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Expired
          await createNotification(med.patient_id, {
            type: 'expiry',
            title: `Expired Medicine: ${med.name}`,
            message: `${med.name} expired on ${expDate.toDateString()}. Do not consume. Please dispose of safely.`,
            channel: 'push',
            action_type: 'find_chemist',
            action_url: `/chemists?search=${encodeURIComponent(med.name)}`,
            reference_id: med._id
          });
          expiryAlerts++;
        } else if (diffDays === 0) {
          // Expiring today
          await createNotification(med.patient_id, {
            type: 'expiry',
            title: `Medicine Expires Today: ${med.name}`,
            message: `${med.name} expires today (${expDate.toDateString()}). Please check and replace.`,
            channel: 'push',
            action_type: 'buy_now',
            action_url: `/shop?search=${encodeURIComponent(med.name)}`,
            reference_id: med._id
          });
          expiryAlerts++;
        } else if (diffDays <= 7 && diffDays > 6) {
          // Expiring in 7 days
          await createNotification(med.patient_id, {
            type: 'expiry',
            title: `Expiring Soon (7 Days): ${med.name}`,
            message: `${med.name} will expire in 7 days on ${expDate.toDateString()}.`,
            channel: 'push',
            action_type: 'buy_now',
            action_url: `/shop?search=${encodeURIComponent(med.name)}`,
            reference_id: med._id
          });
          expiryAlerts++;
        } else if (diffDays <= 30 && diffDays > 29) {
          // Expiring in 30 days
          await createNotification(med.patient_id, {
            type: 'expiry',
            title: `Expiring in 30 Days: ${med.name}`,
            message: `${med.name} will expire in 30 days on ${expDate.toDateString()}.`,
            channel: 'in_app',
            action_type: 'buy_now',
            action_url: `/shop?search=${encodeURIComponent(med.name)}`,
            reference_id: med._id
          });
          expiryAlerts++;
        }
      }
    }

    logger.info(`[CRON] Daily stock and expiry job complete: ${lowStockAlerts} low stock, ${expiryAlerts} expiry alerts.`);
    return { lowStockAlerts, expiryAlerts };
  } catch (error) {
    logger.error(`[CRON] Daily stock job error: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize background cron schedules (hourly: 0 * * * *, daily: 0 8 * * *)
 */
const initCronJobs = () => {
  // Run 15-minute grace period missed check
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runFifteenMinuteMissedDoseJob();
    } catch (e) {
      logger.error('[CRON] Failed 15-minute missed dose job:', e);
    }
  });

  // Run hourly job at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      await runHourlyDoseJob();
    } catch (e) {
      logger.error('[CRON] Failed hourly dose job:', e);
    }
  });

  // Run daily stock & expiry job every morning at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      await runDailyStockExpiryJob();
    } catch (e) {
      logger.error('[CRON] Failed daily stock job:', e);
    }
  });

  logger.info('Scheduled cron jobs initialized (15-min Missed Grace, Hourly Doses, Daily Stock/Expiry).');
};

module.exports = {
  runFifteenMinuteMissedDoseJob,
  runHourlyDoseJob,
  runDailyStockExpiryJob,
  initCronJobs
};
