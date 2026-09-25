const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

router.get('/', alertController.getAlerts);
router.post('/broadcast', alertController.createAlert);
router.post('/acknowledge', alertController.acknowledgeAlert);
router.post('/unacknowledge', alertController.unacknowledgeAlert);
router.post('/simulate', alertController.simulateAlert);

module.exports = router;
