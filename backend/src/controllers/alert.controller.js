const AlertService = require('../services/alert.service');

const getAlerts = async (req, res, next) => {
  try {
    const { sector, severity, status, feedType } = req.query;
    const alerts = await AlertService.getAlerts({ sector, severity, status, feedType });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

const createAlert = (req, res, next) => {
  try {
    const newAlert = AlertService.createAlert(req.body);
    return res.status(201).json({
      success: true,
      data: newAlert,
      message: 'Safety alert broadcast successfully'
    });
  } catch (error) {
    next(error);
  }
};

const acknowledgeAlert = (req, res, next) => {
  try {
    const { id } = req.body;
    const alert = AlertService.acknowledgeAlert(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert acknowledged'
    });
  } catch (error) {
    next(error);
  }
};

const simulateAlert = (req, res, next) => {
  try {
    const { scenario } = req.body;
    const simulated = AlertService.simulateScenario(scenario);
    return res.status(200).json({
      success: true,
      scenario,
      data: simulated,
      message: 'Alert simulation broadcast created'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  acknowledgeAlert,
  simulateAlert
};
