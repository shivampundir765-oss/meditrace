const chatbotService = require('../services/chatbot.service');
const { ChatMessage } = require('../models/chatMessage.model');
const ApiResponse = require('../utils/apiResponse');

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, language } = req.body;
    const userId = req.user._id;
    const profileId = req.profile_id;

    if (!message || !message.trim()) {
      return ApiResponse.error(res, 'Message text is required', 400);
    }

    const preferredLanguage = language || req.user.preferred_language || 'en';

    // Store user message
    const userMsg = await ChatMessage.create({
      user_id: userId,
      profile_id: profileId,
      sender: 'user',
      text: message.trim(),
      language: preferredLanguage
    });

    // Process and generate assistant message
    const assistantMsg = await chatbotService.processMessage(
      userId,
      profileId,
      message.trim(),
      preferredLanguage
    );

    return ApiResponse.success(
      res,
      {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        reply: assistantMsg.text,
        disclaimer: assistantMsg.disclaimer,
        cards: assistantMsg.cards,
        tool_cards: assistantMsg.cards
      },
      'Message processed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profileId = req.profile_id;
    const { limit } = req.query;

    const history = await chatbotService.getChatHistory(
      userId,
      profileId,
      parseInt(limit, 10) || 50
    );
    return ApiResponse.success(res, { history }, 'Chat history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profileId = req.profile_id;

    const result = await chatbotService.clearChatHistory(userId, profileId);
    return ApiResponse.success(res, result, 'Chat history cleared successfully');
  } catch (error) {
    next(error);
  }
};
