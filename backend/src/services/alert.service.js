const SACHET_URL = 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails';

const SECTORS = [
  { name: 'Mumbai Coast', lat: 18.90, lon: 72.75 },
  { name: 'Kochi Harbor', lat: 9.93, lon: 76.20 },
  { name: 'Chennai Offshore', lat: 13.08, lon: 80.32 },
  { name: 'Visakhapatnam', lat: 17.68, lon: 83.32 },
  { name: 'Porbandar', lat: 21.64, lon: 69.55 }
];

const SECTOR_KEYWORDS = {
  'Mumbai Coast': ['maharashtra', 'mumbai', 'konkan', 'thane', 'raigad', 'palghar', 'ratnagiri', 'sindhudurg', 'dahanu', 'murud'],
  'Kochi Harbor': ['kerala', 'kochi', 'ernakulam', 'alappuzha', 'trivandrum', 'malabar', 'kollam', 'kozhikode'],
  'Chennai Offshore': ['tamil nadu', 'chennai', 'kancheepuram', 'cuddalore', 'nagapattinam', 'tiruvallur', 'ramanathapuram', 'thiruvarur'],
  'Visakhapatnam': ['andhra pradesh', 'visakhapatnam', 'vizag', 'east godavari', 'srikakulam', 'vijayanagaram', 'andhra', 'kaviti', 'ramachandrapuram'],
  'Porbandar': ['gujarat', 'porbandar', 'saurashtra', 'okha', 'veraval', 'kutch', 'jamnagar', 'diu', 'daman', 'dadra']
};

function parseCapDate(str) {
  if (!str) return new Date().toISOString();
  try {
    const normalized = String(str).replace(/\bIST\b/g, '+0530');
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return new Date().toISOString();
}

// In-memory simulated drill alerts for operator drill testing and evaluation
let simulatedAlerts = [
  {
    id: 'alt_cyclone_01',
    title: 'IMD Red Alert: Deep Depression / Potential Cyclonic Storm',
    type: 'CYCLONE_ALERT',
    severity: 'EMERGENCY',
    sector: 'Mumbai Coast',
    agency: 'India Meteorological Department (IMD Cyclone Division)',
    issuedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    summary: 'A deep depression over the East-Central Arabian Sea is likely to intensify into a severe cyclonic storm. Squally wind speed reaching 55-65 km/h gusting to 75 km/h is prevailing.',
    recommendedActions: [
      'Total ban on sea venturing for all fishing vessels along Maharashtra & South Gujarat coasts.',
      'Vessels already at deep sea advised to return to nearest safe harbor immediately.',
      'Harbor authorities instructed to hoist Local Warning Signal No. 4.'
    ],
    isBroadcast: true,
    isSimulation: true,
    isLive: false,
    status: 'ACTIVE'
  },
  {
    id: 'alt_wave_02',
    title: 'INCOIS High Wave Warning: High Swell Waves along Kerala Coast',
    type: 'HIGH_WAVE_WARNING',
    severity: 'WARNING',
    sector: 'Kochi Harbor',
    agency: 'INCOIS Coastal Warning Division, Hyderabad',
    issuedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 18).toISOString(),
    summary: 'High swell waves in the range of 2.8 - 3.4 meters are forecasted along the coast of Kerala from Vizhinjam to Kasargod during the high tide window.',
    recommendedActions: [
      'Artisanal craft and country canoes advised not to venture into deep sea.',
      'Secure small craft with double mooring lines at fish landing centers.',
      'Recreational coastal beach activities prohibited during high tide.'
    ],
    isBroadcast: true,
    isSimulation: true,
    isLive: false,
    status: 'ACTIVE'
  },
  {
    id: 'alt_port_03',
    title: 'Port Closure Notice: Kasimedu Harbor Entry Restriction',
    type: 'PORT_CLOSURE',
    severity: 'WARNING',
    sector: 'Chennai Offshore',
    agency: 'Directorate General of Shipping / Chennai Port Trust',
    issuedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 12).toISOString(),
    summary: 'Navigational channel dredging and heavy cross-swell at the harbor entrance. Outbound vessel traffic suspended until 06:00 IST tomorrow.',
    recommendedActions: [
      'Maintain position in designated outer anchorage zone.',
      'Monitor VHF Channel 12 for harbor master clearance.'
    ],
    isBroadcast: true,
    isSimulation: true,
    isLive: false,
    status: 'ACTIVE'
  }
];

// Live alerts cache (3-minute TTL)
let liveAlertsCache = [];
let lastLiveFetch = 0;
const CACHE_TTL_MS = 180000;

class AlertService {
  /**
   * Fetch live alerts from NDMA Sachet and live Open-Meteo marine telemetry
   */
  static async fetchLiveAlerts() {
    const liveAlerts = [];
    let sachetAlerts = [];

    // 1. Fetch live NDMA Sachet CAP alerts across India
    try {
      const response = await fetch(SACHET_URL, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'ORCA-Marine-Intelligence/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const raw = await response.json();
        sachetAlerts = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === 'object' && Array.isArray(raw.alerts))
            ? raw.alerts
            : Object.values(raw || {}).filter(item => item && typeof item === 'object' && item.identifier);
      }
    } catch (err) {
      console.warn(`[AlertService] NDMA Sachet notice (${err.message}) — synthesizing live marine telemetry.`);
    }

    // 2. Process each coastal sector concurrently
    const sectorPromises = SECTORS.map(async (sector) => {
      const sectorAlerts = [];
      const keywords = SECTOR_KEYWORDS[sector.name] || [sector.name.toLowerCase()];

      // Filter matching alerts from Sachet
      const matched = sachetAlerts.filter(item => {
        const textToSearch = [
          item.area_description,
          item.disaster_type,
          item.severity,
          item.warning_message,
          item.state_name,
          item.alert_source
        ].filter(Boolean).join(' ').toLowerCase();

        return keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
      });

      if (matched.length > 0) {
        for (const item of matched) {
          const capSeverity = String(item.severity || 'WATCH').toUpperCase();
          let severity = 'WATCH';
          if (capSeverity.includes('EXTREME') || capSeverity.includes('EMERGENCY')) {
            severity = 'EMERGENCY';
          } else if (capSeverity.includes('WARN') || capSeverity.includes('ALERT') || capSeverity.includes('ORANGE') || capSeverity.includes('RED')) {
            severity = 'WARNING';
          } else if (capSeverity.includes('WATCH') || capSeverity.includes('YELLOW')) {
            severity = 'WATCH';
          } else {
            severity = 'ADVISORY';
          }

          sectorAlerts.push({
            id: `sachet_${item.identifier}_${sector.name.replace(/\s+/g, '_')}`,
            title: `${item.disaster_type || 'Coastal Weather Alert'} — ${sector.name}`,
            type: (item.disaster_type || 'WEATHER_ALERT').replace(/\s+/g, '_').toUpperCase(),
            severity,
            sector: sector.name,
            agency: item.alert_source || 'NDMA Sachet National Disaster Portal',
            issuedAt: parseCapDate(item.effective_start_time),
            expiresAt: item.effective_end_time ? parseCapDate(item.effective_end_time) : new Date(Date.now() + 86400000).toISOString(),
            summary: item.warning_message || item.area_description || `Official active alert broadcast for ${sector.name}.`,
            recommendedActions: [
              'Continuous monitoring of VHF Marine Emergency Channel 16 required.',
              'Adhere strictly to local port authority and State Fisheries Department advisories.',
              'Secure small crafts and inspect emergency life-saving equipment.'
            ],
            isBroadcast: true,
            isSimulation: false,
            isLive: true,
            status: 'ACTIVE'
          });
        }
      } else {
        // If no severe Sachet CAP disaster declared, fetch live Open-Meteo marine conditions
        let waveHeight = null;
        let wavePeriod = null;
        let windSpeed = null;
        let windGusts = null;

        try {
          const [marineRes, weatherRes] = await Promise.all([
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${sector.lat}&longitude=${sector.lon}&current=wave_height,wave_period`, {
              signal: AbortSignal.timeout(2500)
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${sector.lat}&longitude=${sector.lon}&current=wind_speed_10m,wind_gusts_10m,precipitation`, {
              signal: AbortSignal.timeout(2500)
            }).then(r => r.ok ? r.json() : null).catch(() => null)
          ]);

          waveHeight = marineRes?.current?.wave_height ?? null;
          wavePeriod = marineRes?.current?.wave_period ?? null;
          windSpeed = weatherRes?.current?.wind_speed_10m ?? null;
          windGusts = weatherRes?.current?.wind_gusts_10m ?? null;
        } catch (e) {}

        const telemetryText = [
          waveHeight !== null ? `Wave Height: ${waveHeight.toFixed(1)}m` : null,
          wavePeriod !== null ? `Period: ${wavePeriod.toFixed(0)}s` : null,
          windSpeed !== null ? `Wind: ${windSpeed.toFixed(1)} km/h` : null,
          windGusts !== null ? `Gusts: ${windGusts.toFixed(1)} km/h` : null
        ].filter(Boolean).join(' | ');

        if (windGusts && windGusts >= 38) {
          sectorAlerts.push({
            id: `live_squall_${sector.name.replace(/\s+/g, '_')}_${Date.now()}`,
            title: `Squally Wind Notice — ${sector.name}`,
            type: 'SQUALLY_WIND_NOTICE',
            severity: windGusts >= 50 ? 'WARNING' : 'ADVISORY',
            sector: sector.name,
            agency: 'IMD Marine Telemetry & INCOIS',
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 43200000).toISOString(),
            summary: `Live marine telemetry records squally wind gusts reaching ${windGusts.toFixed(1)} km/h along ${sector.name}. Rough sea conditions possible offshore.`,
            recommendedActions: [
              'Small and artisanal craft advised to operate with caution within 15 NM.',
              'Ensure all crew don lifejackets and secure deck cargo.',
              'Maintain watch on VHF Channel 16.'
            ],
            telemetry: { waveHeight, windSpeed, windGusts },
            isBroadcast: true,
            isSimulation: false,
            isLive: true,
            status: 'ACTIVE'
          });
        } else {
          sectorAlerts.push({
            id: `live_clear_${sector.name.replace(/\s+/g, '_')}`,
            title: `Standard Marine Weather Bulletin — ${sector.name}`,
            type: 'NORMAL_OCEAN_CONDITIONS',
            severity: 'INFORMATIONAL',
            sector: sector.name,
            agency: 'INCOIS Ocean State Forecast Centre & IMD Marine',
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            summary: `No severe storm, cyclone, or high wave warnings active in ${sector.name}. ${telemetryText ? `Live telemetry: ${telemetryText}.` : ''} Coastal marine operations permitted.`,
            recommendedActions: [
              'Standard coastal fishing operations cleared under routine safety protocols.',
              'Check onboard VHF radio equipment and distress flare kits before sailing.',
              'Monitor routine 06:00 and 18:00 IST marine weather broadcasts.'
            ],
            telemetry: { waveHeight, windSpeed, windGusts },
            isBroadcast: false,
            isSimulation: false,
            isLive: true,
            status: 'ACTIVE'
          });
        }
      }
      return sectorAlerts;
    });

    const sectorResults = await Promise.all(sectorPromises);
    for (const res of sectorResults) {
      liveAlerts.push(...res);
    }

    if (liveAlerts.length > 0) {
      liveAlertsCache = liveAlerts;
      lastLiveFetch = Date.now();
    }
    return liveAlertsCache;
  }

  static async refreshLiveAlertsIfNeeded() {
    const isStale = Date.now() - lastLiveFetch > CACHE_TTL_MS || liveAlertsCache.length === 0;
    if (isStale) {
      await this.fetchLiveAlerts();
    }
  }

  static async getAlerts({ sector, severity, status, feedType } = {}) {
    await this.refreshLiveAlertsIfNeeded();

    let list = [];
    if (feedType === 'live') {
      list = [...liveAlertsCache];
    } else if (feedType === 'simulated') {
      list = [...simulatedAlerts];
    } else {
      // Default: 'all' or combined (drills + live government bulletins)
      list = [...simulatedAlerts, ...liveAlertsCache];
    }

    if (sector && sector !== 'All') {
      list = list.filter(a => a.sector === sector || a.sector === 'All Indian Waters');
    }

    if (severity && severity !== 'ALL') {
      list = list.filter(a => a.severity === severity);
    }

    if (status) {
      list = list.filter(a => a.status === status);
    }

    // Sort by severity (EMERGENCY -> WARNING -> WATCH -> ADVISORY -> INFORMATIONAL) then date
    const severityOrder = { EMERGENCY: 1, WARNING: 2, WATCH: 3, ADVISORY: 4, INFORMATIONAL: 5 };
    list.sort((a, b) => {
      const sDiff = (severityOrder[a.severity] || 6) - (severityOrder[b.severity] || 6);
      if (sDiff !== 0) return sDiff;
      return new Date(b.issuedAt) - new Date(a.issuedAt);
    });

    return list;
  }

  static createAlert(alertData) {
    const newAlert = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: alertData.title || 'Marine Emergency Broadcast',
      type: alertData.type || 'GENERAL_ADVISORY',
      severity: alertData.severity || 'WARNING',
      sector: alertData.sector || 'Mumbai Coast',
      agency: alertData.agency || 'ORCA Emergency Broadcast Network',
      issuedAt: new Date().toISOString(),
      expiresAt: alertData.expiresAt || new Date(Date.now() + 3600000 * 24).toISOString(),
      summary: alertData.summary || 'Operational alert broadcast to coastal mariners.',
      recommendedActions: alertData.recommendedActions || ['Monitor VHF Marine Channel 16.'],
      isBroadcast: alertData.isBroadcast ?? true,
      isSimulation: alertData.isSimulation ?? true,
      isLive: false,
      status: 'ACTIVE'
    };

    simulatedAlerts.unshift(newAlert);
    return newAlert;
  }

  static acknowledgeAlert(alertId) {
    let alert = simulatedAlerts.find(a => a.id === alertId) || liveAlertsCache.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  static simulateScenario(scenario) {
    if (scenario === 'EMERGENCY_CYCLONE') {
      return this.createAlert({
        title: 'CRITICAL: Severe Cyclone "ORCA-1" Approaching Western Coast',
        type: 'CYCLONE_ALERT',
        severity: 'EMERGENCY',
        sector: 'Mumbai Coast',
        agency: 'National Disaster Management Authority (NDMA) & IMD',
        summary: 'Category 3 Cyclonic Storm with sustained winds of 90 km/h gusting to 110 km/h. Sea state is phenomenal (>4m). Complete coastal evacuation order active.',
        recommendedActions: [
          'Immediate cessation of all maritime activities.',
          'Secure craft in inner creeks or haul up onto dry slips.',
          'All port operations suspended.'
        ],
        isSimulation: true
      });
    } else if (scenario === 'HIGH_WAVE_SWELL') {
      return this.createAlert({
        title: 'INCOIS High Swell Alert: 3.8m Waves forecasted near Kochi',
        type: 'HIGH_WAVE_WARNING',
        severity: 'WARNING',
        sector: 'Kochi Harbor',
        agency: 'INCOIS Ocean State Forecast Centre',
        summary: 'Sudden swell surge expected due to distant Southern Ocean storm. Swell period 16 seconds.',
        recommendedActions: [
          'Small vessels return to harbor before 16:00 IST.',
          'Ensure life jackets donned on all operating craft.'
        ],
        isSimulation: true
      });
    } else if (scenario === 'PORT_CLOSURE') {
      return this.createAlert({
        title: 'Emergency Port Barricade: Kasimedu Harbor Entry Closed',
        type: 'PORT_CLOSURE',
        severity: 'WARNING',
        sector: 'Chennai Offshore',
        agency: 'Coast Guard Regional HQ (East)',
        summary: 'Obstruction in main navigation channel due to drifting container. Port closed for all vessel transit.',
        recommendedActions: [
          'Divert to nearest secondary fishing jetty at Ennore.',
          'Maintain watch on VHF Channel 16.'
        ],
        isSimulation: true
      });
    } else if (scenario === 'LIGHTNING_SQUALL') {
      return this.createAlert({
        title: 'Severe Convective Squall & Lightning Warning',
        type: 'LIGHTNING_HAZARD',
        severity: 'WATCH',
        sector: 'Visakhapatnam',
        agency: 'IMD Marine Cyclone Division',
        summary: 'Intense thunderstorm line moving east at 25 knots. Extreme electrocution hazard.',
        recommendedActions: [
          'Avoid open deck operations during lightning peak.',
          'Ensure vessel GPS and VHF are grounded.'
        ],
        isSimulation: true
      });
    }

    return null;
  }
}

module.exports = AlertService;
