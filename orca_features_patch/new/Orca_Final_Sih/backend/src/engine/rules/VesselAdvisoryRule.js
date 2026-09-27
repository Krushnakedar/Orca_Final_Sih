const thresholds = require('../thresholds');

/**
 * Small Vessel Advisory Service (SVAS) style rule.
 * If local coastal zone advises against the vessel's LOA class, raise risk.
 */
class VesselAdvisoryRule {
  static evaluate(svas = {}, vesselProfile = {}) {
    const lengthM =
      parseFloat(vesselProfile.lengthM ?? vesselProfile.loaM ?? 12) || 12;
    const status = (svas.status || svas.advice || 'CLEAR').toString().toUpperCase();
    const zoneName = svas.zoneName || svas.region || 'Local coastal sector';
    const day = svas.day || 1;

    // Map boat size classes like SAMUDRA: <4m, <6m, <7m
    let sizeClass = 'large';
    if (lengthM < 4) sizeClass = 'lt4';
    else if (lengthM < 6) sizeClass = 'lt6';
    else if (lengthM < 7) sizeClass = 'lt7';
    else if (lengthM < 10) sizeClass = 'lt10';

    const restrictedFor = Array.isArray(svas.restrictedBoatClasses)
      ? svas.restrictedBoatClasses.map((c) => String(c).toLowerCase())
      : [];

    const isRestricted =
      status === 'DO_NOT_SAIL' ||
      status === 'NOT_ADVISED' ||
      status === 'WARNING' ||
      restrictedFor.includes(sizeClass) ||
      restrictedFor.includes(`boats_<_${Math.ceil(lengthM)}m`) ||
      (status === 'CAUTION' && lengthM < 7);

    let subScore = 5;
    let severity = 'LOW';
    let advisory = `SVAS Day ${day}: no restriction for ~${lengthM} m craft in ${zoneName}.`;

    if (status === 'DO_NOT_SAIL' || status === 'NOT_ADVISED') {
      subScore = 96;
      severity = 'CRITICAL';
      advisory = `SVAS Day ${day} — ${zoneName}: sailing not advised for this vessel class (${lengthM} m).`;
    } else if (isRestricted) {
      subScore = 78;
      severity = 'HIGH';
      advisory = `SVAS Day ${day} — ${zoneName}: caution / restricted for small craft (${lengthM} m).`;
    } else if (status === 'CAUTION') {
      subScore = 48;
      severity = 'MODERATE';
      advisory = `SVAS Day ${day} — ${zoneName}: general caution. Review wind/wave before departure.`;
    }

    return {
      ruleId: 'RULE_SVAS_VESSEL_ADVISORY',
      factor: 'Small Vessel Advisory Service',
      measuredValue: `${status} | LOA ${lengthM} m | Day ${day}`,
      subScore,
      weight: thresholds.WEIGHTS.SVAS,
      severity,
      advisory,
    };
  }
}

module.exports = VesselAdvisoryRule;
