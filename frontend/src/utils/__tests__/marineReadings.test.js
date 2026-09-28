import { describe, it, expect } from 'vitest';
import { extractReadings, formatAdvisoryDate, formatAge, isMock } from '../marineReadings';

// Live provider payload where the model returned no swell / current, so the backend substituted defaults
// and listed them in estimatedFields (see RealOpenMeteoOceanProvider / RealOpenMeteoWeatherProvider).
const ocean = {
  significantWaveHeightM: 1.8,
  wavePeriodSec: 7.2,
  waveDirectionDegrees: 245,
  seaSurfaceTemperatureC: 28.5,
  swellHeightM: 1.26,
  swellPeriodSec: 9.2,
  swellDirectionDegrees: 245,
  current: { speedMps: 0.42, directionDegrees: 180 },
  estimatedFields: [
    'chlorophyllMgM3', 'salinityPsu', 'tide', 'maxWaveHeightM',
    'swellHeightM', 'swell.heightM', 'swellPeriodSec', 'swell.periodSec', 'swellDirectionDegrees', 'swell.directionDegrees',
    'current.speedMps', 'current.speedKnots', 'current.directionDegrees', 'current.directionCardinal'
  ]
};
const weather = {
  windSpeedKmh: 18.2,
  windDirectionDegrees: 245,
  temperatureC: 29.1,
  windGustsKmh: 23.7,
  visibilityKm: 10,
  estimatedFields: ['visibilityKm', 'uvIndex', 'precipitationProbabilityPct', 'lightningRisk', 'cycloneAlert', 'conditionsSummary']
};

describe('extractReadings', () => {
  it('keeps measured values', () => {
    const r = extractReadings(weather, ocean);
    expect(r.waveHeight).toBe(1.8);
    expect(r.wavePeriod).toBe(7.2);
    expect(r.sst).toBe(28.5);
    expect(r.airTemp).toBe(29.1);
    expect(r.wind).toBe(18.2);
    expect(r.gust).toBe(23.7);
  });

  it('drops values the backend flagged as estimates', () => {
    const r = extractReadings(weather, ocean);
    expect(r.swellHeight).toBeNull();
    expect(r.swellPeriod).toBeNull();
    expect(r.swellDirection).toBeNull();
    expect(r.currentSpeed).toBeNull();
    expect(r.currentDirection).toBeNull();
    expect(r.visibility).toBeNull();
  });

  it('keeps swell and current when they are not flagged', () => {
    const r = extractReadings(
      { ...weather, estimatedFields: [] },
      { ...ocean, swellHeightM: 1.1, swellPeriodSec: 10, swellDirectionDegrees: 200, current: { speedMps: 0.3, directionDegrees: 90 }, estimatedFields: [] }
    );
    expect(r.swellHeight).toBe(1.1);
    expect(r.currentSpeed).toBe(0.3);
    expect(r.currentDirection).toBe(90);
  });

  it('detects substituted swell and current in responses without estimatedFields (older backend / cache)', () => {
    const r = extractReadings({ windSpeedKmh: 10 }, {
      significantWaveHeightM: 2, wavePeriodSec: 7.2, waveDirectionDegrees: 245,
      swellHeightM: 1.4, swellPeriodSec: 9.2, swellDirectionDegrees: 245,
      current: { speedMps: 0.42, directionDegrees: 180 }
    });
    expect(r.swellHeight).toBeNull();
    expect(r.currentSpeed).toBeNull();
  });

  it('returns nulls, never throws, for missing blocks', () => {
    expect(Object.values(extractReadings(undefined, undefined)).every(value => value === null)).toBe(true);
  });
});

describe('helpers', () => {
  it('formats INCOIS advisory dates (year + Julian day)', () => {
    expect(formatAdvisoryDate('2026-271')).toMatch(/^28 Sep/);
    expect(formatAdvisoryDate('not-a-date')).toBeNull();
  });

  it('formats provider timestamp age and rejects invalid timestamps', () => {
    expect(formatAge(new Date(Date.now() - 5 * 60000).toISOString())).toBe('5 min ago');
    expect(formatAge('nope')).toBeNull();
  });

  it('detects backup / mock provider responses', () => {
    expect(isMock({ source: { isFallback: true } })).toBe(true);
    expect(isMock({ provider: { isMock: true } })).toBe(true);
    expect(isMock({ source: { isFallback: false } })).toBe(false);
    expect(isMock(null)).toBe(false);
  });
});
