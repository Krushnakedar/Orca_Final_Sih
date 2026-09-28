// Shared helpers for reading /weather and /ocean provider payloads.
//
// The weather and ocean providers substitute defaults / derived values when the model returns nothing
// (e.g. swell = 0.7 x wave height, current = 0.42 m/s at 180°, SST 27.8, humidity 75 ...) and also carry
// constants that are not measurements (visibility, chlorophyll, tide, cyclone status). Those are never
// shown as readings. The backend lists them in `data.estimatedFields`; for responses without that list
// (older backend / old cache entries) the heuristics below are used for swell and current.
//
// Used by the Dashboard (current conditions) and by the Marine Map "Selected area" panel (WeatherSafety).

export const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export const toCardinal = degrees => CARDINALS[((Math.round(degrees / 22.5) % 16) + 16) % 16];

export const finite = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export const formatDirection = (cardinal, degrees) => {
  const deg = finite(degrees);
  return [cardinal || (deg === null ? null : toCardinal(deg)), deg === null ? null : `${Math.round(deg)}°`].filter(Boolean).join(' · ');
};

export const formatStamp = iso => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// INCOIS advisory dates arrive as "YYYY-DDD" (year + Julian day); null when the value does not match.
export const formatAdvisoryDate = value => {
  const match = /^(\d{4})-(\d{3})$/.exec(value || '');
  if (!match) return null;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(match[1]), 0, Number(match[2]))));
};

// "5 min ago" style age for a provider timestamp; null when the timestamp is missing/invalid.
export const formatAge = (iso, now = Date.now()) => {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const minutes = Math.max(0, Math.round((now - time) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

// True when the response came from a backup / mock provider rather than the live model.
export const isMock = response => Boolean(
  response?.isFallback || response?.source?.isFallback || response?.source?.isDemoData || response?.provider?.isMock || response?.data?.isFallback
);

const hasFlags = data => Array.isArray(data?.estimatedFields);
export const isEstimated = (data, field) => hasFlags(data) && data.estimatedFields.includes(field);
export const measured = (data, field, value) => (isEstimated(data, field) ? null : finite(value));

const legacySwellIsSubstitute = ocean => {
  const [h, p, d, wh, wp, wd] = [ocean?.swellHeightM, ocean?.swellPeriodSec, ocean?.swellDirectionDegrees, ocean?.significantWaveHeightM, ocean?.wavePeriodSec, ocean?.waveDirectionDegrees].map(finite);
  if ([h, p, d, wh, wp, wd].some(value => value === null)) return false;
  return Math.abs(h - wh * 0.7) < 0.011 && Math.abs(p - (wp + 2)) < 0.11 && d === wd;
};
const legacyCurrentIsSubstitute = current => finite(current?.speedMps) === 0.42 && finite(current?.directionDegrees) === 180;
export const swellIsSubstitute = ocean => hasFlags(ocean) ? isEstimated(ocean, 'swellHeightM') : legacySwellIsSubstitute(ocean);
export const currentIsSubstitute = ocean => hasFlags(ocean) ? isEstimated(ocean, 'current.speedMps') : legacyCurrentIsSubstitute(ocean?.current);

/**
 * Normalise the `data` blocks of a /weather and /ocean response into display values.
 * Every value is either a real number or `null` (missing, or flagged as an estimate/default).
 * Pass the inner `data` objects (response.data), not the whole envelope.
 */
export function extractReadings(weather, ocean) {
  return {
    wind: finite(weather?.windSpeedKmh),
    gust: measured(weather, 'windGustsKmh', weather?.windGustsKmh),
    windFrom: finite(weather?.windDirectionDegrees),
    airTemp: measured(weather, 'temperatureC', weather?.temperatureC),
    feelsLike: measured(weather, 'apparentTemperatureC', weather?.apparentTemperatureC),
    humidity: measured(weather, 'relativeHumidityPct', weather?.relativeHumidityPct),
    pressure: measured(weather, 'surfacePressureHpa', weather?.surfacePressureHpa),
    rain: measured(weather, 'precipitationMm', weather?.precipitationMm),
    visibility: measured(weather, 'visibilityKm', weather?.visibilityKm),
    conditionsSummary: isEstimated(weather, 'conditionsSummary') ? null : (weather?.conditionsSummary || null),
    waveHeight: finite(ocean?.significantWaveHeightM),
    wavePeriod: measured(ocean, 'wavePeriodSec', ocean?.wavePeriodSec),
    waveDirection: measured(ocean, 'waveDirectionDegrees', ocean?.waveDirectionDegrees),
    swellHeight: swellIsSubstitute(ocean) ? null : finite(ocean?.swellHeightM),
    swellPeriod: measured(ocean, 'swellPeriodSec', ocean?.swellPeriodSec),
    swellDirection: measured(ocean, 'swellDirectionDegrees', ocean?.swellDirectionDegrees),
    currentSpeed: currentIsSubstitute(ocean) ? null : finite(ocean?.current?.speedMps),
    currentDirection: measured(ocean, 'current.directionDegrees', ocean?.current?.directionDegrees),
    sst: measured(ocean, 'seaSurfaceTemperatureC', ocean?.seaSurfaceTemperatureC),
  };
}
