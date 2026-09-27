const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

router.get('/layers', mapController.getMapLayers);
router.get('/ocean-field', mapController.getOceanField);
router.get('/mhw', mapController.getMhwLayer);
router.get('/svas', mapController.getSvasLayer);

module.exports = router;
