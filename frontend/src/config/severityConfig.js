/**
 * frontend/src/config/severityConfig.js
 * ======================================
 * Centralized, configurable severity bands and score thresholds.
 * As models improve and calibrate, cutoffs can be adjusted here in one place.
 */

export const SEVERITY_CUTOFFS = {
  LOW_MAX: 0.35,
  MEDIUM_MAX: 0.65,
  HIGH_MAX: 0.85
};

export const SEVERITY_BANDS = {
  LOW: {
    key: 'low',
    label: 'Low Risk',
    simpleLabel: 'Normal Operation',
    technicalLabel: 'Low Anomaly Score',
    color: '#1b6d24',
    bg: '#e8f5e9',
    border: 'rgba(27, 109, 36, 0.3)',
    descriptionSimple: 'Sensor readings and telemetry show normal factory patterns with no major cause for concern.',
    descriptionTechnical: 'Telemetry within expected empirical bounds (Score < 0.35). Isolation Forest and fingerprint triggers are quiescent.'
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium Risk',
    simpleLabel: 'Moderate Irregularity',
    technicalLabel: 'Moderate Anomaly Score',
    color: '#d97706',
    bg: '#fffbeb',
    border: 'rgba(217, 119, 6, 0.3)',
    descriptionSimple: 'Minor irregular patterns detected. This is a surveillance warning sign, not proof of wrongdoing. Routine field review advised.',
    descriptionTechnical: 'Elevated telemetry anomaly score (0.35 ≤ Score < 0.65). 1–2 heuristic fingerprints or statistical drift detected.'
  },
  HIGH: {
    key: 'high',
    label: 'High Risk',
    simpleLabel: 'High Suspicion of Irregularity',
    technicalLabel: 'High Anomaly Score',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: 'rgba(185, 28, 28, 0.3)',
    descriptionSimple: 'Significant data mismatch detected across multiple checks. Cautious on-site physical verification strongly recommended.',
    descriptionTechnical: 'High composite anomaly score (0.65 ≤ Score < 0.85). Multiple concurrent fingerprint triggers and high SHAP feature attributions.'
  },
  CRITICAL: {
    key: 'critical',
    label: 'Critical Risk',
    simpleLabel: 'Urgent Attention Needed',
    technicalLabel: 'Critical Anomaly Score',
    color: '#7f1d1d',
    bg: '#fee2e2',
    border: 'rgba(127, 29, 29, 0.4)',
    descriptionSimple: 'Severe irregular telemetry pattern flagged. Immediate priority inspection recommended to verify physical equipment on-site.',
    descriptionTechnical: 'Critical composite score (Score ≥ 0.85). High-confidence multi-mechanism anomaly indicating significant signal distortion.'
  }
};

/**
 * Normalizes any score (0–1 or 0–100) and returns the corresponding severity band object.
 * @param {number|null|undefined} rawScore
 * @returns {object} Severity band descriptor with normalizedScore (0–1), displayScore, and styling
 */
export function getSeverityBand(rawScore) {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) {
    return {
      ...SEVERITY_BANDS.LOW,
      normalizedScore: 0,
      displayScore: '0.00',
      outOfOne: '0.00 out of 1.00'
    };
  }

  const num = Number(rawScore);
  // Normalize if given as 0–100 percentage
  const normalized = num > 1.0 ? Math.min(Math.max(num / 100.0, 0), 1.0) : Math.min(Math.max(num, 0), 1.0);
  const displayScore = normalized.toFixed(2);
  const outOfOne = `${displayScore} out of 1.00`;

  let band;
  if (normalized < SEVERITY_CUTOFFS.LOW_MAX) {
    band = SEVERITY_BANDS.LOW;
  } else if (normalized < SEVERITY_CUTOFFS.MEDIUM_MAX) {
    band = SEVERITY_BANDS.MEDIUM;
  } else if (normalized < SEVERITY_CUTOFFS.HIGH_MAX) {
    band = SEVERITY_BANDS.HIGH;
  } else {
    band = SEVERITY_BANDS.CRITICAL;
  }

  return {
    ...band,
    normalizedScore: normalized,
    displayScore,
    outOfOne
  };
}
