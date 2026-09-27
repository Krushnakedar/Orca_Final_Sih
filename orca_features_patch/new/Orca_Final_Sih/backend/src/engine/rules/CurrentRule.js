const thresholds = require('../thresholds');

/**
 * Surface current risk for small craft.
 * High currents increase drift, berthing difficulty, and net fouling risk.
 */
class CurrentRule {
  static evaluate(currentSpeedMps = 0, currentDirectionDeg = null) {
    const speed = parseFloat(currentSpeedMps) || 0;
    const T = thresholds.CURRENT;

    let subScore = 8;
    let severity = 'LOW';
    let advisory = 'Weak surface currents. Minimal operational impact.';

    if (speed >= T.CRITICAL_MIN) {
      subScore = 92;
      severity = 'CRITICAL';
      advisory = `Strong current (${speed.toFixed(2)} m/s). High drift risk; small craft should avoid open-water transit.`;
    } else if (speed >= T.HIGH_MAX) {
      const ratio = (speed - T.HIGH_MAX) / (T.CRITICAL_MIN - T.HIGH_MAX || 0.5);
      subScore = Math.round(68 + Math.min(1, Math.max(0, ratio)) * 18);
      severity = 'HIGH';
      advisory = `Elevated current (${speed.toFixed(2)} m/s). Exercise caution near inlets and during peak tidal flow.`;
    } else if (speed >= T.MODERATE_MAX) {
      const ratio = (speed - T.MODERATE_MAX) / (T.HIGH_MAX - T.MODERATE_MAX || 0.3);
      subScore = Math.round(42 + Math.min(1, Math.max(0, ratio)) * 20);
      severity = 'MODERATE';
      advisory = `Moderate current (${speed.toFixed(2)} m/s). Factor into route timing and gear deployment.`;
    } else if (speed >= T.LOW_MAX) {
      const ratio = (speed - T.LOW_MAX) / (T.MODERATE_MAX - T.LOW_MAX || 0.25);
      subScore = Math.round(18 + Math.min(1, Math.max(0, ratio)) * 20);
      severity = 'LOW';
      advisory = `Light current (${speed.toFixed(2)} m/s). Normal operations.`;
    }

    const dirNote =
      currentDirectionDeg != null && Number.isFinite(Number(currentDirectionDeg))
        ? ` Dir ${Math.round(Number(currentDirectionDeg))}°`
        : '';

    return {
      ruleId: 'RULE_SURFACE_CURRENT',
      factor: 'Ocean Surface Current',
      measuredValue: `${speed.toFixed(2)} m/s${dirNote}`,
      subScore,
      weight: thresholds.WEIGHTS.CURRENT,
      severity,
      advisory,
    };
  }
}

module.exports = CurrentRule;
