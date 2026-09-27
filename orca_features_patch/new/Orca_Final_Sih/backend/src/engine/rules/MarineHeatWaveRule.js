const thresholds = require('../thresholds');

/**
 * Marine Heat Wave (MHW) — INCOIS-style category scoring.
 * Impacts fish distribution, crew heat stress, and engine cooling margins.
 */
class MarineHeatWaveRule {
  static evaluate(mhw = {}) {
    const category = (mhw.category || mhw.severity || 'NONE').toString().toUpperCase();
    const anomaly = parseFloat(mhw.sstAnomalyC ?? mhw.anomalyC ?? 0) || 0;
    const areaPct = parseFloat(mhw.areaSpreadingPercent ?? 0) || 0;

    const rank = {
      NONE: 0,
      MODERATE: 1,
      STRONG: 2,
      SEVERE: 3,
      EXTREME: 4,
    };

    let level = rank[category] ?? 0;
    // Promote by anomaly if category missing
    if (!level && anomaly >= 4) level = 4;
    else if (!level && anomaly >= 3) level = 3;
    else if (!level && anomaly >= 2) level = 2;
    else if (!level && anomaly >= 1) level = 1;

    const T = thresholds.MHW;
    let subScore = 5;
    let severity = 'LOW';
    let advisory = 'No marine heat wave signal in area of interest.';

    if (level >= 4) {
      subScore = T.SCORE_EXTREME;
      severity = 'CRITICAL';
      advisory = `Extreme MHW (ΔSST ≈ ${anomaly.toFixed(1)}°C, area ${areaPct.toFixed(0)}%). Expect strong ecological stress and elevated surface temperatures.`;
    } else if (level === 3) {
      subScore = T.SCORE_SEVERE;
      severity = 'HIGH';
      advisory = `Severe MHW (ΔSST ≈ ${anomaly.toFixed(1)}°C). Monitor fish migration and engine cooling water intake temperatures.`;
    } else if (level === 2) {
      subScore = T.SCORE_STRONG;
      severity = 'MODERATE';
      advisory = `Strong MHW signal (ΔSST ≈ ${anomaly.toFixed(1)}°C). PFZ patterns may shift; plan accordingly.`;
    } else if (level === 1) {
      subScore = T.SCORE_MODERATE;
      severity = 'LOW';
      advisory = `Moderate MHW (ΔSST ≈ ${anomaly.toFixed(1)}°C). Informational for fishing strategy.`;
    }

    return {
      ruleId: 'RULE_MARINE_HEAT_WAVE',
      factor: 'Marine Heat Wave Category',
      measuredValue: `${category || 'NONE'} | ΔSST ${anomaly.toFixed(1)}°C | area ${areaPct.toFixed(0)}%`,
      subScore,
      weight: thresholds.WEIGHTS.MHW,
      severity,
      advisory,
    };
  }
}

module.exports = MarineHeatWaveRule;
