/**
 * frontend/src/utils/glossary.js
 * ==============================
 * Central glossary providing dual labels (Plain Officer vs Technical ML/Engineering)
 * for the entire ForensiAir inspection and surveillance workflow.
 *
 * RULE: Single record, two labels.
 * DB and API always store exact, unchanging enum IDs.
 * UI displays mode-aware labels via this module.
 */

export const OUTCOME_OPTIONS = [
  {
    id: 'explained',
    simple: {
      label: 'Normal explanation found, no violation',
      description: 'Equipment maintenance, process shutdown, or sensor wash accounted for the variance.',
      badge: 'bg-[#e8f5e9] text-[#1b6d24] border-[#1b6d24]/30'
    },
    technical: {
      label: 'Statistical/instrumentation anomaly accounted for by maintenance, wash, or process change',
      description: 'Variance explained by verified telemetry sensor wash, zero-drift, or plant overhaul.',
      badge: 'bg-[#e8f5e9] text-[#1b6d24] border-[#1b6d24]/30'
    }
  },
  {
    id: 'inconclusive',
    simple: {
      label: 'Not enough proof yet, re-inspection or lab test needed',
      description: 'Grab samples sent to government laboratory or follow-up site visit needed.',
      badge: 'bg-[#fff3e6] text-[#c25e00] border-[#c25e00]/30'
    },
    technical: {
      label: 'Inconclusive telemetry correlation — requires lab analysis or sensor calibration',
      description: 'Telemetry deviation inconclusive against field conditions; awaiting 5-day lab results.',
      badge: 'bg-[#fff3e6] text-[#c25e00] border-[#c25e00]/30'
    }
  },
  {
    id: 'unexplained',
    simple: {
      label: 'Factory could not explain the problem',
      description: 'Plant records and power logs do not account for the suspicious readings.',
      badge: 'bg-[#fdecec] text-[#b91c1c] border-[#b91c1c]/30'
    },
    technical: {
      label: 'Unexplained telemetry variance — operational records do not account for deviation',
      description: 'Telemetry readings remain inconsistent with operational records and equipment status.',
      badge: 'bg-[#fdecec] text-[#b91c1c] border-[#b91c1c]/30'
    }
  },
  {
    id: 'referred',
    simple: {
      label: 'Serious issue, referred to senior officer / legal',
      description: 'Referred for legal notice, bank guarantee forfeiture, or statutory closure.',
      badge: 'bg-[#fef2f2] text-[#991b1b] border-[#991b1b]/30'
    },
    technical: {
      label: 'Referred for regulatory compliance audit / formal taskforce investigation',
      description: 'Flagged for formal CPCB/SPCB enforcement audit, evidentiary seizure, and statutory notice.',
      badge: 'bg-[#fef2f2] text-[#991b1b] border-[#991b1b]/30'
    }
  }
];

export const AI_CONFIRMATION_OPTIONS = [
  {
    id: 'confirmed',
    simple: {
      label: 'Confirmed on site',
      description: 'Field inspection confirmed the issue flagged by the AI system.',
      badge: 'bg-[#fdecec] text-[#b91c1c] border-[#b91c1c]/30'
    },
    technical: {
      label: 'True Positive (AI prediction verified)',
      description: 'Ground-truth site investigation confirmed the telemetry anomaly / tampering mechanism.',
      badge: 'bg-[#fdecec] text-[#b91c1c] border-[#b91c1c]/30'
    }
  },
  {
    id: 'partly_confirmed',
    simple: {
      label: 'Partly confirmed — some issues found',
      description: 'Inspection found related operational issues, but not exactly what was flagged.',
      badge: 'bg-[#fff3e6] text-[#c25e00] border-[#c25e00]/30'
    },
    technical: {
      label: 'Partially Confirmed (Related anomaly present)',
      description: 'Ground conditions exhibited related operational irregularities with partial correlation.',
      badge: 'bg-[#fff3e6] text-[#c25e00] border-[#c25e00]/30'
    }
  },
  {
    id: 'not_confirmed',
    simple: {
      label: 'Not confirmed — normal operations verified',
      description: 'Inspection found standard equipment maintenance or valid factory operations.',
      badge: 'bg-[#e8f5e9] text-[#1b6d24] border-[#1b6d24]/30'
    },
    technical: {
      label: 'False Positive (Legitimate operations confirmed)',
      description: 'Physical audit verified sensor maintenance, statutory shutdown, or electrical interruption.',
      badge: 'bg-[#e8f5e9] text-[#1b6d24] border-[#1b6d24]/30'
    }
  },
  {
    id: 'different_issue',
    simple: {
      label: 'Different issue discovered on site',
      description: 'A different operational or environmental problem was found during the visit.',
      badge: 'bg-[#e7f0f8] text-[#00355f] border-[#00355f]/30'
    },
    technical: {
      label: 'Secondary / Off-target Anomaly Discovered',
      description: 'Inspector uncovered distinct procedural/hardware non-compliance not detected by model.',
      badge: 'bg-[#e7f0f8] text-[#00355f] border-[#00355f]/30'
    }
  }
];

export const CHECK_OPTIONS = [
  {
    id: 'sensor_condition_and_calibration',
    isTechnicalOnly: false,
    simple: {
      label: 'Physical sensor probe & on-site field calibration test',
      hint: 'Probe cleanliness, optical window, membrane condition, and standard buffer test'
    },
    technical: {
      label: 'Sensor probe condition, zero-drift & 4-20mA loop current',
      hint: 'Transducer optical cleanliness, reference junction impedance & 4-20mA transmitter loop check'
    }
  },
  {
    id: 'original_readings',
    isTechnicalOnly: false,
    simple: {
      label: 'Original ground wastewater readings verified',
      hint: 'Compared live display readings against treated water appearance in discharge tank'
    },
    technical: {
      label: 'Raw analog telemetry signals & transmitter diagnostics',
      hint: 'Verification of raw ADC counts, transmitter log memory, and loop calibration curve'
    }
  },
  {
    id: 'operational_records',
    isTechnicalOnly: false,
    simple: {
      label: 'Factory production batch logs & electricity meter verified',
      hint: 'Checked if factory was actually running batches and using electricity during the alert'
    },
    technical: {
      label: 'Plant operational logs, batch cycle energy correlation & mass balance',
      hint: 'Cross-check of batch production volume against MSEDCL power log and chemical dosing records'
    }
  },
  {
    id: 'maintenance_logs',
    isTechnicalOnly: false,
    simple: {
      label: 'Sensor washing & cleaning logbooks reviewed',
      hint: 'Checked routine maintenance tickets and sensor cleaning logs entered before the alert'
    },
    technical: {
      label: 'Sensor maintenance logs & chemical reagent dosing pump history',
      hint: 'Audit of sensor wash schedule, calibration gas cylinder validity, and reagent restock'
    }
  },
  {
    id: 'pipe_tracing_bypass',
    isTechnicalOnly: false,
    simple: {
      label: 'Pipe tracing for unauthorized bypass drains or dilution lines',
      hint: 'Walked discharge channel to check for flexible hoses, hidden pipes, or tap connections'
    },
    technical: {
      label: 'Hydraulic conduit inspection & unmetered effluent bypass pipe trace',
      hint: 'Tracing of industrial plumbing, fire hydrant taps, cooling tower blowdown tie-ins, and sumps'
    }
  },
  {
    id: 'missing_readings_or_transmission',
    isTechnicalOnly: false,
    simple: {
      label: 'Network outage, power cut, or data connection checked',
      hint: 'Verified if data stopped due to power cut, storm, SIM card issue, or internet failure'
    },
    technical: {
      label: 'Modbus RTU packet logs, buffer hold & transmission replays',
      hint: 'IoT cellular gateway memory buffer audit, handshake timeouts, and TCP retransmit frames'
    }
  },
  {
    id: 'scada_edge_audit',
    isTechnicalOnly: true,
    simple: {
      label: 'Computer control system verified (optional check)',
      hint: 'Checked factory computer monitoring screens for any manual override'
    },
    technical: {
      label: 'SCADA ladder logic, PLC firmware & edge gateway script audit (Technical check)',
      hint: 'Audit of WinCC/Wonderware SCADA tags, OPC UA server scaling formulas, and Lua clamping scripts'
    }
  },
  {
    id: 'other',
    isTechnicalOnly: false,
    simple: {
      label: 'Other physical verification checks on site',
      hint: 'Specify any additional ground observations below'
    },
    technical: {
      label: 'Other physical / instrumental verification checks',
      hint: 'Specify forensic details, serial numbers, or diagnostic instruments used'
    }
  }
];

export const REPORT_STATUS_LABELS = {
  Draft: {
    simple: { label: 'Working Draft', badge: 'badge-status-draft' },
    technical: { label: 'Draft Dossier', badge: 'badge-status-draft' }
  },
  'Submitted for Review': {
    simple: { label: 'Awaiting Officer Review', badge: 'badge-status-submitted' },
    technical: { label: 'Submitted for Review', badge: 'badge-status-submitted' }
  },
  Reviewed: {
    simple: { label: 'Decision Recorded & Closed', badge: 'badge-status-reviewed' },
    technical: { label: 'Reviewed & Finalized', badge: 'badge-status-reviewed' }
  },
  'Further Information Required': {
    simple: { label: 'Clarification Requested', badge: 'badge-status-query' },
    technical: { label: 'Further Info Required', badge: 'badge-status-query' }
  }
};

export const SECTION_HELPER_TEXTS = {
  reportTitle: 'Environmental Inspection & Verification Report',
  subtitle: {
    simple: 'Official field verification dossier documenting on-site checks, ground findings, and regulatory decisions.',
    technical: 'Telemetry ground truth dossier correlating ML tampering fingerprints with physical instrumentation.'
  },
  predictionBoxHeading: {
    simple: '1. What the AI System Predicted',
    technical: '1. Machine Learning Prediction Snapshot'
  },
  findingsHeading: {
    simple: '2. What the Field Inspector Observed on Site',
    technical: '2. Inspector Physical Ground Truth Observations'
  },
  confirmationHeading: {
    simple: 'Did the on-site visit confirm the AI prediction?',
    technical: 'Prediction Validation (Ground Truth Feedback Loop)'
  },
  outcomeHeading: {
    simple: '3. Ground Verification Finding',
    technical: '3. Verification Outcome & Technical Justification'
  },
  decisionHeading: {
    simple: '4. Senior Officer Regulatory Decision & Actions',
    technical: '4. Administrative Compliance Decision & Statutory Directives'
  },
  evidenceHeading: {
    simple: '5. Photographic Proofs & Official Documents',
    technical: '5. Evidentiary References & Photographic Attachments'
  },
  legalDisclaimer:
    'Forensier identifies unusual patterns in industrial environmental telemetry that may indicate data-quality or data-integrity issues. AI alerts are indicators for physical verification and do not establish deliberate tampering, misconduct, or regulatory non-compliance. Ground inspections, operational records, and laboratory analyses must be conducted before drawing enforcement conclusions.'
};

/**
 * Helper to get mode-aware label for any outcome
 */
export function getOutcomeLabel(outcomeId, isSimple = true) {
  const opt = OUTCOME_OPTIONS.find((o) => o.id === outcomeId);
  if (!opt) return { label: outcomeId || 'Unknown', description: '', badge: 'bg-gray-100 text-gray-800' };
  return isSimple ? opt.simple : opt.technical;
}

/**
 * Helper to get mode-aware label for AI confirmation
 */
export function getAiConfirmationLabel(confId, isSimple = true) {
  const opt = AI_CONFIRMATION_OPTIONS.find((o) => o.id === confId);
  if (!opt) return { label: 'Pending Validation', description: '', badge: 'bg-gray-100 text-gray-700' };
  return isSimple ? opt.simple : opt.technical;
}

/**
 * Helper to get mode-aware label for check options
 */
export function getCheckOptionLabel(checkId, isSimple = true) {
  const opt = CHECK_OPTIONS.find((c) => c.id === checkId);
  if (!opt) return { label: checkId, hint: '' };
  return isSimple ? opt.simple : opt.technical;
}

/**
 * Helper to get mode-aware label for report status
 */
export function getReportStatusLabel(status, isSimple = true) {
  const entry = REPORT_STATUS_LABELS[status];
  if (!entry) return { label: status, badge: 'badge-status-draft' };
  return isSimple ? entry.simple : entry.technical;
}
