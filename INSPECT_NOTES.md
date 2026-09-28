# Inspect Location Backend Notes

Every statement below was verified by reading the source in this repository. No live HTTP calls were made
and `git status` / `git diff` could not be run from the session that wrote this file (file access only).

## Ocean Field
- route: `GET /map/ocean-field` (`backend/src/routes/map.routes.js` -> `map.controller.js#getOceanField`), mounted behind `authMiddleware`. Frontend wrapper: `mapService.getOceanField(params)`.
- method: GET
- parameters: `lat`, `lon` (defaults 18.922 / 72.8347; 400 if not finite or out of range), `span` (degrees, default 5, clamped to 1-8).
- what it is: a **regional grid**, not a point lookup. It samples a 3x3 grid at `lat/lon +/- span/2` and, for each sample, calls `oceanService.getOceanConditions` and `weatherService.getWeather` (up to 18 upstream calls per request). Samples where both fail are dropped; 503 if all fail.
- response: `{ success, data: { type: "FeatureCollection", features: [Point...], metadata: { center:{lat,lon}, span, generatedAt } }, message }`
- actual feature properties: `currentSpeedMps`, `currentDirectionDegrees`, `swellHeightM`, `swellDirectionDegrees`, `swellPeriodSec`, `significantWaveHeightM`, `seaSurfaceTemperatureC`, `windSpeedKmh`, `windFromDirectionDegrees`, `windFlowDirectionDegrees`, `observationTime` (all `null` when missing). Geometry `[lon, lat]`.
- fallback behavior: it copies whatever the ocean provider returned, including the provider's default/derived values (see below) and, when the Mock provider was used, mock values. The `isFallback` flag is NOT carried into the feature properties.
- used by: MapPage overlays only (wind / currents / swell / MHW). The Selected Area panel does NOT use it (it is a 9-cell regional grid).

### Point endpoints the Selected Area panel really uses
- `GET /ocean?lat&lon[&date]` -> `oceanService` -> `FallbackOceanProvider` (Real Open-Meteo Marine, then Mock on failure). Envelope: `{ success, provider{name,type,version,isMock,status}, source{dataset,origin,accuracyEstimate,updateFrequency,isDemoData,disclaimer,isFallback?,fallbackReason?}, timestamp, data }`.
- `GET /weather?lat&lon&sector[&date]` -> `FallbackWeatherProvider` (Real Open-Meteo forecast, then Mock). Same envelope.
- `GET /marine/context?lat&lon&sector` -> `{ data:{eez,sectors,landingCentres,bathymetry}, location:{isLand,label,matchDistanceKm,source}, source }`. `isLand` is a Nominatim nearest-feature heuristic (can be `null` if the lookup fails).
- `POST /risk/evaluate` body `{ weather, ocean, advisory, geospatial, vesselProfile }` -> `{ success, data:{ riskScore, riskLevel (LOW|MODERATE|HIGH|CRITICAL), primaryFactors, triggeredRules, safetyDirectives, evaluatedAt, vesselProfile, ... } }`. Risk classification is produced by the backend deterministic engine, not the frontend.
- Error format: `{ success:false, message }` (errorHandler). `api.js` rejects with `{ message, status, data, offline }`. Land points make the real ocean provider throw (`code: LAND_LOCATION`, message ends "Select a point over the sea.", HTTP 500).

### Ocean `data` fields (RealOpenMeteoOceanProvider)
Model values from Open-Meteo Marine `current`: `significantWaveHeightM`, `wavePeriodSec`, `waveDirectionDegrees`, `swellHeightM`/`swellPeriodSec`/`swellDirectionDegrees` (also under `swell{heightM,periodSec,directionDegrees}`), `seaSurfaceTemperatureC`, `current{speedMps (converted from km/h), speedKnots, directionDegrees, directionCardinal}`, `observationTime`.
Units: m, s, degrees (wave/swell = direction they come FROM; current = direction it flows TOWARD), m/s, degC.
**Not measurements** (constants/defaults/derived): `chlorophyllMgM3` (constant 0.95), `salinityPsu` (35.6), `tide{...}` (fixed text + times relative to now), `maxWaveHeightM` (1.5 x wave height); when the model field is missing: swell height = 0.7 x wave height, swell period = wave period + 2, swell direction = wave direction, current = 0.42 m/s at 180 deg, SST = 27.8, wave period = 7.2, wave direction = 245.
Why: the provider fills gaps with defaults so that the risk engine, agents and the Mock schema always get complete numbers. These values were never labelled as estimates. The backend now lists them in `data.estimatedFields` (additive; values unchanged) and the panel hides listed fields.
Mock provider (`isFallback: true` in `source`): fixed values (e.g. swell 1.2 m, current 0.42 m/s at 175 deg); the panel keeps the existing "backup estimates" banner for this case.

### Weather `data` fields (RealOpenMeteoWeatherProvider)
Model values: `windSpeedKmh`, `windDirectionDegrees` (from), `windDirectionCardinal`, `windGustsKmh`, `temperatureC`, `apparentTemperatureC`, `relativeHumidityPct`, `surfacePressureHpa`, `precipitationMm`, `cloudCoverPct`, `forecastTime`.
**Not measurements**: `visibilityKm` (10), `uvIndex` (6), `precipitationProbabilityPct` (derived from precipitation), `lightningRisk` (derived from precipitation), `cycloneAlert` (constant "no cyclone"), `conditionsSummary` (sentence chosen from cloud cover); plus defaults when the model value is missing (gusts = 1.3 x wind, humidity 75, pressure 1012, temperature 28, ...). Also listed in `data.estimatedFields`.
Caveat for risk: the deterministic risk engine receives these constants (visibility 10 km, no cyclone), so a LOW/MODERATE result does not reflect real visibility or cyclone data.

### Timestamp bug (fixed)
Open-Meteo `current.time` has no timezone suffix (GMT when no `timezone` param is sent). Both providers did `new Date(cur.time).toISOString()`, which parses it in the server's local timezone (wrong by the UTC offset on a non-UTC server). Both now parse it as UTC.

## Alerts
- route: `GET /alerts` (`alert.routes.js` -> `alert.controller.js#getAlerts` -> `AlertService.getAlerts`)
- method: GET
- parameters: `sector`, `severity`, `status`, `feedType` (`live` | `simulated` | default both).
- response: `{ success, count, data: [alert...] }`
- alert fields: `id, title, type, severity, sector, agency, issuedAt, expiresAt, summary, recommendedActions[], isBroadcast, isSimulation, isLive, status, telemetry?`
- severity values: `EMERGENCY | WARNING | WATCH | ADVISORY | INFORMATIONAL` (INFORMATIONAL = "no severe alert" bulletin).
- sources: three hard-coded in-memory drill alerts (`isSimulation: true`), NDMA Sachet CAP alerts matched to a sector by keyword, or an Open-Meteo-derived squall notice / INFORMATIONAL bulletin per sector (from the sector's fixed reference coordinates).
- geographic relationship: **sector-level only** (one of 5 sector names). No coordinates, polygon or affected-area geometry exists in the alert data, so an alert cannot be tied to a clicked point. The panel labels them "Sector-level alerts ... not specific to the exact point", and marks drills as "Drill / simulation".

## PFZ
- route: `GET /pfz?lat&lon&sector[&date]` (`provider.controller.js#getPFZs` -> `pfz.service.js` -> `RealINCOISPFZProvider`)
- method: GET
- parameters: `lat`, `lon`, `sector`, optional `date`.
- response: envelope as above; `data: { queryLocation, sector, zoneCount, nearestZone, zones[], geojson }`; `source.advisoryDate` = `"YYYY-DDD"` (year + Julian day) from the INCOIS features; `source.isLive: true`, `isDemoData: false`.
- zone fields that are real INCOIS data: `id, name, state, category, year, julianDay, advisoryId, lengthKm, geometry`. Computed from the query point: `centerLat, centerLon, distanceKm, bearingDegrees, bearingCardinal`. **Synthesized (not INCOIS data), do not display**: `seaSurfaceTempC, chlorophyllConcentrationMgM3, thermalGradientCPerKm, confidenceRatingPct, depthRangeMeters, targetSpecies, validityWindow`.
- geometry: INCOIS `pfzlines` = LineString / MultiLineString (lines, not polygons).
- point lookup support: **none for "inside a PFZ"**. Lines have no area, so point-in-polygon is not meaningful.
- nearest-zone support: yes. `nearestZone` = zone with the smallest distance from the query point to the **centroid (mean of vertices)** of the line, not to the line itself. Zones are first filtered to the states of the passed `sector`, so a point in another sector is compared only against the selected sector's lines.
- fallback: if the live INCOIS request fails, `pfz.service` returns `MockPFZProvider` data with `source.isFallback: true` and a notice. The panel ignores fallback/demo PFZ data.

## Existing Frontend
- inspect hook: `frontend/src/features/map/useLocationInspect.js` (state: `active`, `point`, `reading`; stable `toggle/exit/select/clear/setReading`)
- inspect control: `InspectControl` in `frontend/src/features/map/MapInspect.jsx` (Leaflet `topleft` control under the zoom buttons, lucide `Info` icon, `aria-label="Inspect map location"`, `title="Inspect location"`, `aria-pressed`)
- marker: `SelectedLocationMarker` in `MapInspect.jsx` (one `CircleMarker` driven by `point`); the coloured ring is the pre-existing `safety` marker in `MarineMap.jsx`
- selected-area panel: `frontend/src/features/map/WeatherSafety.jsx` ("Selected area summary")
- map: `frontend/src/features/map/MarineMap.jsx` (`inspect` prop; click selects only while inspect mode is active; Esc exits; crosshair cursor; instruction banner)
- pages using it: `MapPage.jsx` and `DashboardPage.jsx`
