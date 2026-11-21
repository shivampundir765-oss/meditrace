const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const prescriptionRoutes = require('./prescription.routes');
const medicineRoutes = require('./medicine.routes');
const scheduleRoutes = require('./schedule.routes');
const doseRoutes = require('./dose.routes');
const stockRoutes = require('./stock.routes');
const notificationRoutes = require('./notification.routes');
const scanRoutes = require('./scan.routes');
const chemistRoutes = require('./chemist.routes');
const retailerRoutes = require('./retailer.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medicines', medicineRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/doses', doseRoutes);
router.use('/stock', stockRoutes);
router.use('/notifications', notificationRoutes);
router.use('/scan', scanRoutes);
router.use('/chemists', chemistRoutes);
router.use('/retailer', retailerRoutes);

module.exports = router;
