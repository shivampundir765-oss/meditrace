const express = require('express');
const chatbotController = require('../../controllers/chatbot.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { resolveProfile } = require('../../middleware/profile.middleware');

const router = express.Router();

router.use(authenticate);
router.use(resolveProfile);

router.post('/message', chatbotController.sendMessage);
router.get('/history', chatbotController.getHistory);
router.delete('/history', chatbotController.clearHistory);

module.exports = router;
