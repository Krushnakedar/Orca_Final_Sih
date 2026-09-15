const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { validateChatMessage } = require('../middleware/validation.middleware');

router.post('/message', validateChatMessage, chatController.handleChatMessage);
router.get('/history', chatController.getChatHistory);
router.post('/reset', chatController.resetChatSession);

module.exports = router;
