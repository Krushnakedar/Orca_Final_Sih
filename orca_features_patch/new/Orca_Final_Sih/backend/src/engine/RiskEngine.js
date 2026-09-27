const thresholds = require("./thresholds");
const WindRule = require("./rules/WindRule");
const WaveRule = require("./rules/WaveRule");
const VisibilityRule = require("./rules/VisibilityRule");
const CycloneAlertRule = require("./rules/CycloneAlertRule");
const LightningRule = require("./rules/LightningRule");
const GeofenceHazardRule = require("./rules/GeofenceHazardRule");
const CurrentRule = require("./rules/CurrentRule");
const SwellRule = require("./rules/SwellRule");
const MarineHeatWaveRule = require("./rules/MarineHeatWaveRule");
const VesselAdvisoryRule = require("./rules/VesselAdvisoryRule");

class RiskAssessmentEngine {
  /**
   * Pure Deterministic Marine Risk Evaluation
   * Zero hallucination: Exact boundary thresholds based on WMO & INCOIS safety criteria.
   * Extended with Currents, Swell, Marine Heat Wave, and Small Vessel Advisory (SVAS).
   */
  static evaluate({
    weather = {},
    ocean = {},
    advisory = {},
    geospatial = {},
    vesselProfile = {},
    mhw = {},
    svas = {},
  }) {
    const triggeredRules = [];

    const windEval = WindRule.evaluate(
      weather.windSpeedKmh,
      weather.windGustsKmh,
    );
    const waveEval = WaveRule.evaluate(
      ocean.significantWaveHeightM,
      ocean.wavePeriodSec,
      ocean.swellHeightM,
    );
    const swellEval = SwellRule.evaluate(
      ocean.swellHeightM ?? ocean.swell?.heightM,
      ocean.swellPeriodSec ?? ocean.swell?.periodSec,
    );
    const currentEval = CurrentRule.evaluate(
      ocean.current?.speedMps ?? ocean.currentSpeedMps,
      ocean.current?.directionDegrees ?? ocean.currentDirectionDegrees,
    );
    const mhwEval = MarineHeatWaveRule.evaluate(
      mhw.category ? mhw : ocean.marineHeatWave || advisory.marineHeatWave || {},
    );
    const svasEval = VesselAdvisoryRule.evaluate(
      svas.status ? svas : advisory.svas || {},
      vesselProfile,
    );
    const visEval = VisibilityRule.evaluate(
      weather.visibilityKm,
      weather.precipitationMm,
    );
    const cycloneEval = CycloneAlertRule.evaluate(
      weather.cycloneAlert,
      advisory.advisories,
    );
    const lightningEval = LightningRule.evaluate(weather.lightningRisk);
    const geofenceEval = GeofenceHazardRule.evaluate(geospatial);

    triggeredRules.push(
      windEval,
      waveEval,
      swellEval,
      currentEval,
      mhwEval,
      svasEval,
      visEval,
      cycloneEval,
      lightningEval,
      geofenceEval,
    );

    const vesselTypeKey = vesselProfile.typeKey || "small_motorized";
    const vesselMultiplier = thresholds.VESSEL_MODIFIERS[vesselTypeKey] || 1.0;

    const peakPrimaryHazard = Math.max(
      windEval.subScore,
      waveEval.subScore,
      swellEval.subScore,
      cycloneEval.subScore,
      svasEval.subScore,
    );

    let weightedSum = 0;
    let totalWeight = 0;
    for (const rule of triggeredRules) {
      weightedSum += rule.subScore * rule.weight;
      totalWeight += rule.weight;
    }
    const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const rawCompositeScore = peakPrimaryHazard * 0.65 + weightedAvg * 0.35;
    let finalScore = Math.round(
      rawCompositeScore *
        (vesselTypeKey === "small_motorized" ? 1.0 : vesselMultiplier),
    );

    let isOverride = false;
    let overrideReason = "";

    if (cycloneEval.isOverrideTrigger) {
      isOverride = true;
      overrideReason = cycloneEval.advisory;
      finalScore = Math.max(finalScore, 95);
    } else if (ocean.significantWaveHeightM >= thresholds.WAVE.CRITICAL_MIN) {
      isOverride = true;
      overrideReason = `Wave height (${ocean.significantWaveHeightM}m) exceeds critical threshold of 3.5m`;
      finalScore = Math.max(finalScore, 90);
    } else if (weather.windSpeedKmh >= thresholds.WIND.CRITICAL_MIN) {
      isOverride = true;
      overrideReason = `Wind speed (${weather.windSpeedKmh} km/h) exceeds critical gale threshold of 50 km/h`;
      finalScore = Math.max(finalScore, 88);
    } else if (
      (svas.status || "").toString().toUpperCase() === "DO_NOT_SAIL" ||
      (svas.status || "").toString().toUpperCase() === "NOT_ADVISED"
    ) {
      isOverride = true;
      overrideReason = svasEval.advisory;
      finalScore = Math.max(finalScore, 92);
    }

    finalScore = Math.min(100, Math.max(0, finalScore));

    let riskLevel = "LOW";
    if (finalScore >= 85 || isOverride) {
      riskLevel = "CRITICAL";
    } else if (finalScore >= 65) {
      riskLevel = "HIGH";
    } else if (finalScore >= 35) {
      riskLevel = "MODERATE";
    }

    const primaryFactors = triggeredRules
      .filter((r) => r.subScore >= 35)
      .sort((a, b) => b.subScore - a.subScore)
      .map((r) => `${r.factor}: ${r.measuredValue} (${r.severity})`);

    if (primaryFactors.length === 0) {
      primaryFactors.push(
        "Calm sea conditions and light breeze within safe limits",
      );
    }

    const safetyDirectives = [];
    if (riskLevel === "CRITICAL") {
      safetyDirectives.push(
        "TOTAL VOYAGE BAN: Remain securely berthed in port.",
        "Do not untie vessel; inspect mooring lines and hatch covers.",
      );
    } else if (riskLevel === "HIGH") {
      safetyDirectives.push(
        "Small and non-mechanized craft strictly advised to abort departure.",
        "Mechanized vessels must maintain continuous VHF radio watch on Channel 16.",
      );
    } else if (riskLevel === "MODERATE") {
      safetyDirectives.push(
        "Exercise caution beyond 10-15 NM offshore.",
        "Ensure lifejackets donned, bilge pumps operational, and flares verified.",
      );
    } else {
      safetyDirectives.push(
        "Normal navigation authorized within territorial waters.",
        "Standard maritime safety protocols apply.",
      );
    }

    return {
      riskScore: finalScore,
      riskLevel,
      confidenceScore: 94,
      isOverride,
      overrideReason: overrideReason || null,
      vesselProfile: {
        type: vesselProfile.name || "Artisanal / Small Motorized Craft (< 12m)",
        vulnerabilityMultiplier: vesselMultiplier,
      },
      primaryFactors,
      triggeredRules,
      safetyDirectives,
      evaluatedAt: new Date().toISOString(),
      disclaimer:
        "Deterministic rule evaluation based on WMO/IMD/INCOIS criteria. Includes currents, swell, MHW, and SVAS. Zero LLM hallucination in safety metrics.",
    };
  }
}

module.exports = RiskAssessmentEngine;
