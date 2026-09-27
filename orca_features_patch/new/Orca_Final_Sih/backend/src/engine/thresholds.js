module.exports = {
  WIND: {
    LOW_MAX: 20.0,
    MODERATE_MAX: 35.0,
    HIGH_MAX: 50.0,
    CRITICAL_MIN: 50.0
  },
  WAVE: {
    LOW_MAX: 1.5,
    MODERATE_MAX: 2.5,
    HIGH_MAX: 3.5,
    CRITICAL_MIN: 3.5
  },
  SWELL: {
    LOW_MAX: 1.0,
    MODERATE_MAX: 1.8,
    HIGH_MAX: 2.5,
    CRITICAL_MIN: 3.2
  },
  CURRENT: {
    LOW_MAX: 0.25,
    MODERATE_MAX: 0.50,
    HIGH_MAX: 0.80,
    CRITICAL_MIN: 1.20
  },
  MHW: {
    SCORE_MODERATE: 28,
    SCORE_STRONG: 48,
    SCORE_SEVERE: 72,
    SCORE_EXTREME: 90
  },
  VISIBILITY: {
    POOR_KM: 3.0,
    MODERATE_KM: 6.0
  },
  WEIGHTS: {
    WAVE: 0.28,
    WIND: 0.18,
    CYCLONE: 0.16,
    SWELL: 0.10,
    CURRENT: 0.08,
    SVAS: 0.08,
    MHW: 0.04,
    VISIBILITY: 0.04,
    LIGHTNING: 0.02,
    GEOFENCE_HAZARD: 0.02
  },
  VESSEL_MODIFIERS: {
    'traditional_unmotorized': 1.35,
    'small_motorized': 1.20,
    'mechanized_trawler': 1.00,
    'deep_sea_vessel': 0.85
  }
};
