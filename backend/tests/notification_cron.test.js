const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Medicine } = require('../src/models/medicine.model');
const { DoseSchedule } = require('../src/models/doseSchedule.model');
const { DoseLog } = require('../src/models/doseLog.model');
const { Notification } = require('../src/models/notification.model');
const { runHourlyDoseJob, runDailyStockExpiryJob } = require('../src/services/cron.service');
const { createNotification } = require('../src/services/notification.service');

const patientUser = {
  name: 'Alert Patient',
  email: 'alert_patient@test.com',
  password: 'SecurePass1',
  role: 'patient'
};

let accessToken;
let userId;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Medicine.deleteMany({}),
    DoseSchedule.deleteMany({}),
    DoseLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const regRes = await request(app).post('/api/v1/auth/register').send(patientUser);
  accessToken = regRes.body.data.accessToken;
  userId = regRes.body.data.user._id;
});

describe('Notification and Cron Job System', () => {
  describe('Notification Endpoints', () => {
    it('should create and retrieve notifications with unread count', async () => {
      // Create manual notification
      await createNotification(userId, {
        type: 'dose',
        title: 'Take your Aspirin',
        message: 'Scheduled dose at 10:00 AM',
        action_type: 'mark_taken'
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.notifications.length).toBe(1);
      expect(res.body.data.notifications[0].title).toBe('Take your Aspirin');
      expect(res.body.data.notifications[0].action_type).toBe('mark_taken');
    });

    it('should mark a single notification as read', async () => {
      const notif = await createNotification(userId, {
        type: 'low_stock',
        title: 'Low stock',
        message: 'Order soon',
        action_type: 'buy_now'
      });

      const res = await request(app)
        .put(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.is_read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      await createNotification(userId, { type: 'dose', title: 'Dose 1', message: 'M1' });
      await createNotification(userId, { type: 'dose', title: 'Dose 2', message: 'M2' });

      const res = await request(app)
        .put('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listRes.body.data.unreadCount).toBe(0);
    });

    it('should register mobile device push token', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/device-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          deviceToken: 'ExponentPushToken[dummy-token-xyz-123]',
          platform: 'android'
        });

      expect(res.status).toBe(200);
      const user = await User.findById(userId);
      expect(user.deviceTokens).toContain('ExponentPushToken[dummy-token-xyz-123]');
    });

    it('should get and update notification settings & quiet hours', async () => {
      const updateRes = await request(app)
        .put('/api/v1/notifications/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          doseAlerts: true,
          lowStockAlerts: false,
          quietHoursStart: '23:00',
          quietHoursEnd: '06:00'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.settings.lowStockAlerts).toBe(false);
      expect(updateRes.body.data.settings.quietHoursStart).toBe('23:00');

      const getRes = await request(app)
        .get('/api/v1/notifications/settings')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.settings.lowStockAlerts).toBe(false);
    });
  });

  describe('Hourly Dose Cron Job (runHourlyDoseJob)', () => {
    it('should create reminders for upcoming doses and mark overdue doses as missed', async () => {
      const med = await Medicine.create({
        name: 'Metformin',
        patient_id: userId,
        quantity: 10
      });

      const sched = await DoseSchedule.create({
        medicine_id: med._id,
        patient_id: userId,
        dose_amount: '1 tablet',
        times_per_day: 1,
        specific_times: ['10:00'],
        start_date: new Date()
      });

      // 1. Upcoming dose within next 30 minutes
      const now = new Date();
      const upcomingTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins in future
      await DoseLog.create({
        schedule_id: sched._id,
        medicine_id: med._id,
        patient_id: userId,
        scheduled_time: upcomingTime,
        status: 'scheduled'
      });

      // 2. Overdue dose from 45 minutes ago
      const pastTime = new Date(now.getTime() - 45 * 60 * 1000); // 45 mins in past
      const pastDose = await DoseLog.create({
        schedule_id: sched._id,
        medicine_id: med._id,
        patient_id: userId,
        scheduled_time: pastTime,
        status: 'scheduled'
      });

      // Execute hourly cron job
      const result = await runHourlyDoseJob();

      expect(result.remindersSent).toBe(1);
      expect(result.missedMarked).toBe(1);

      // Verify past dose status updated to 'missed'
      const updatedPastDose = await DoseLog.findById(pastDose._id);
      expect(updatedPastDose.status).toBe('missed');

      // Verify notifications generated
      const notifications = await Notification.find({ user_id: userId });
      expect(notifications.length).toBe(2);
      expect(notifications.some(n => n.title.includes('Dose Reminder'))).toBe(true);
      expect(notifications.some(n => n.title.includes('Missed Dose'))).toBe(true);
    });
  });

  describe('Daily Stock and Expiry Cron Job (runDailyStockExpiryJob)', () => {
    it('should generate low stock and expired alerts with appropriate action links', async () => {
      // Medicine 1: Low stock (2 tablets, threshold 5)
      await Medicine.create({
        name: 'Cetirizine 10mg',
        patient_id: userId,
        quantity: 2,
        low_stock_threshold: 5,
        status: 'active'
      });

      // Medicine 2: Expired yesterday, ample stock
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Medicine.create({
        name: 'Eye Drops',
        patient_id: userId,
        quantity: 50,
        low_stock_threshold: 5,
        expiry_date: yesterday,
        status: 'active'
      });

      // Execute daily cron job
      const result = await runDailyStockExpiryJob();

      expect(result.lowStockAlerts).toBe(1);
      expect(result.expiryAlerts).toBe(1);

      const notifs = await Notification.find({ user_id: userId });
      const lowStockNotif = notifs.find(n => n.type === 'low_stock');
      const expiryNotif = notifs.find(n => n.type === 'expiry');

      expect(lowStockNotif).toBeDefined();
      expect(lowStockNotif.action_type).toBe('buy_now');

      expect(expiryNotif).toBeDefined();
      expect(expiryNotif.action_type).toBe('find_chemist');
      expect(expiryNotif.message).toContain('Please dispose of safely');
    });
  });
});
