const thresholds = require('../thresholds');

/**
 * Long-period swell can induce heavy rolling even when wind-sea is moderate.
 */
class SwellRule {
  static evaluate(swellHeightM = 0, swellPeriodSec = 10) {
    const height = parseFloat(swellHeightM) || 0;
    const period = parseFloat(swellPeriodSec) || 10;
    const T = thresholds.SWELL;

    // Longer period increases roll risk for small craft
    const periodFactor = period >= 12 ? 1.12 : period >= 10 ? 1.05 : 1.0;
    const effective = height * periodFactor;

    let subScore = 10;
    let severity = 'LOW';
    let advisory = 'Low swell. Comfortable sea for most craft.';

    if (effective >= T.CRITICAL_MIN) {
      subScore = 95;
      severity = 'CRITICAL';
      advisory = `Heavy swell (${height.toFixed(1)} m / ${period.toFixed(0)} s). High roll and shipping-sea risk; avoid small-boat operations.`;
    } else if (effective >= T.HIGH_MAX) {
      const ratio = (effective - T.HIGH_MAX) / (T.CRITICAL_MIN - T.HIGH_MAX || 0.8);
      subScore = Math.round(70 + Math.min(1, Math.max(0, ratio)) * 18);
      severity = 'HIGH';
      advisory = `Significant swell (${height.toFixed(1)} m). Caution for vessels under 10 m LOA.`;
    } else if (effective >= T.MODERATE_MAX) {
      const ratio = (effective - T.MODERATE_MAX) / (T.HIGH_MAX - T.MODERATE_MAX || 0.7);
      subScore = Math.round(45 + Math.min(1, Math.max(0, ratio)) * 20);
      severity = 'MODERATE';
      advisory = `Moderate swell (${height.toFixed(1)} m). Monitor vessel motion and load security.`;
    } else if (effective >= T.LOW_MAX) {
      const ratio = effective / T.MODERATE_MAX;
      subScore = Math.round(15 + Math.min(1, Math.max(0, ratio)) * 25);
      severity = 'LOW';
    }

    return {
      ruleId: 'RULE_SWELL_SEA',
      factor: 'Primary Swell Height & Period',
      measuredValue: `${height.toFixed(2)} m @ ${period.toFixed(1)} s`,
      subScore,
      weight: thresholds.WEIGHTS.SWELL,
      severity,
      advisory,
    };
  }
}

module.exports = SwellRule;
