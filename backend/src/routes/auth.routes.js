const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateAuthRegistration, validateAuthLogin } = require('../middleware/validation.middleware');

router.post('/register', authLimiter, validateAuthRegistration, authController.register);
router.post('/login', authLimiter, validateAuthLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getProfile);

module.exports = router;
