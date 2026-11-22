const express = require('express');
const router = express.Router();
const historyController = require('../../controllers/history.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', historyController.getHistory);
router.post('/mark-late/:id', historyController.markLateDose);

module.exports = router;
