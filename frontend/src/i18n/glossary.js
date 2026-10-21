/**
 * frontend/src/i18n/glossary.js
 * ==============================
 * Central Single Source of Truth for Terminology across Forensier.
 * Every term provides:
 *   - simple: Plain-language phrasing suitable for government officials (8th-grade level)
 *   - technical: Rigorous engineering / ML phrasing
 *   - simpleHelp: Plain explanation for tooltips and help popovers
 *   - (for fingerprints) possibleInnocentCauses, possibleTamperingCauses, inspectionChecks
 */

export const GLOSSARY = {
  // =========================================================================
  // 1. TAMPERING FINGERPRINTS (8 CORE MECHANISMS)
  // =========================================================================
  flatline: {
    id: 'flatline',
    name: 'Flatline',
    simple: 'Sensor stuck on one value',
    technical: 'Flatline (zero-variance window)',
    simpleHelp: 'Real factory water readings constantly fluctuate as effluent flows. An unvarying constant reading for hours is unnatural.',
    possibleInnocentCauses: [
      'Sensor probe dried out or caught in an air bubble',
      'Automated transmitter on power-save hold during plant maintenance',
      'Factory effluent discharge stopped completely during plant shutdown'
    ],
    possibleTamperingCauses: [
      'Sensor probe deliberately kept in a container of clean tap water',
      'Analog loop current wire electronically clamped or bypassed',
      'Digital controller programmed to hold a safe fake value'
    ],
    inspectionChecks: [
      'Check if the sensor probe is physically immersed in running effluent stream',
      'Check if water is visibly flowing through the discharge channel',
      'Compare handheld testing meter value against online screen value',
      'Inspect transmitter wire connections for electronic clamps'
    ]
  },

  correlation_break: {
    id: 'correlation_break',
    name: 'Correlation Break',
    simple: 'Related pollution levels do not match',
    technical: 'Correlation Break (COD/BOD decoupling, r < 0.65)',
    simpleHelp: 'When organic waste rises, chemical pollution rises too. When one shoots up and the other drops to zero, the sensors disagree.',
    possibleInnocentCauses: [
      'Sudden change in factory manufacturing raw materials',
      'Separate chemical dosing neutralizing one pollutant faster than others',
      'One sensor fouled or needing cleaning while the other is clean'
    ],
    possibleTamperingCauses: [
      'Selective dilution or selective sensor cleaning',
      'Feeding fake readings to only one analyzer',
      'Bypassing one sensor line around treatment plant'
    ],
    inspectionChecks: [
      'Collect split effluent sample for certified laboratory analysis',
      'Verify calibration certificates and cleaning logs for both probes',
      'Inspect chemical dosing pumps and batch reaction logs'
    ]
  },

  drift: {
    id: 'drift',
    name: 'Gradual Drift',
    simple: 'Gradual artificial drop in readings',
    technical: 'Gradual Drift (systematic baseline level shift > 3σ)',
    simpleHelp: 'Pollution numbers slowly sinking downwards week after week without factory production changes.',
    possibleInnocentCauses: [
      'Gradual sludge buildup or biofouling on the optical sensor lens',
      'Sensor electronic calibration slowly drifting over time',
      'Genuine efficiency improvement in biological treatment system'
    ],
    possibleTamperingCauses: [
      'Undocumented manual adjustment of sensor zero/span calibration dial',
      'Intentional slow dilution with fresh tap water',
      'Progressive manipulation of data logger scaling factors'
    ],
    inspectionChecks: [
      'Perform zero and span field calibration check with standard buffer liquids',
      'Inspect factory freshwater meter and compare with wastewater volume',
      'Check data logger calibration audit history and password access logs'
    ]
  },

  limit_hugging: {
    id: 'limit_hugging',
    name: 'Limit Hugging',
    simple: 'Readings unnaturally staying just below the legal limit',
    technical: 'Limit Hugging (concentration in 5% band below CTO threshold)',
    simpleHelp: 'Readings hovering unnaturally at 95% of the permitted ceiling without ever exceeding it, like a car speed limiter.',
    possibleInnocentCauses: [
      'Very precise automatic chemical dosing control system',
      'Equalization tank smoothing out all concentration peaks'
    ],
    possibleTamperingCauses: [
      'Software code clipping readings to never cross the government limit',
      'Manual dial adjustment whenever pollution threatens to exceed limit',
      'Throttling discharge valve specifically when limits approach'
    ],
    inspectionChecks: [
      'Review raw unedited PLC / SCADA automated control logs',
      'Conduct unannounced grab sampling during peak production hours',
      'Inspect analyzer maximum reading limit settings in device firmware'
    ]
  },

  copy_paste: {
    id: 'copy_paste',
    name: 'Copy-Paste',
    simple: "Yesterday's data repeated today",
    technical: 'Copy-Paste / Lagged Autocorrelation (> 0.95)',
    simpleHelp: 'The exact same curve or series of numbers seen yesterday is being played back today.',
    possibleInnocentCauses: [
      'Data logger memory buffer repeating unsent packets after network restoration',
      'SCADA software communication loop replaying unacknowledged data'
    ],
    possibleTamperingCauses: [
      'Automated script replaying previously recorded clean day telemetry',
      'Factory staff manually copying compliant historic readings into RTU',
      'Simulated waveform generated by test hardware to fake live compliance'
    ],
    inspectionChecks: [
      'Inspect raw data transmission packets, packet sequence IDs and timestamps',
      'Verify factory power meter and batch records to confirm active work on both days',
      'Cross-examine plant operator on automated logging computer logs'
    ]
  },

  coordinated_missing_data: {
    id: 'coordinated_missing_data',
    name: 'Coordinated Missing Data',
    simple: 'Sensors disconnected during working hours',
    technical: 'Coordinated Missing Data (selective packet loss during operational shifts)',
    simpleHelp: 'The internet or sensors stop sending data right during factory production shifts.',
    possibleInnocentCauses: [
      'Genuine regional cellular network outage or power line trip',
      'Plant shutdown for scheduled maintenance or repairs'
    ],
    possibleTamperingCauses: [
      'Intentionally pulling the power plug or SIM card during dirty discharge',
      'Switching off telemetry logger to hide untreated effluent release',
      'Simulating "system fault" during heavy manufacturing shifts'
    ],
    inspectionChecks: [
      'Review factory electricity supply records during the missing data period',
      'Check mobile operator cell tower uptime logs for the industrial area',
      'Inspect physical backup power (UPS) battery health for the OCEMS unit'
    ]
  },

  inspection_dip: {
    id: 'inspection_dip',
    name: 'Pre-Inspection Cleanup',
    simple: 'Sudden clean water right before scheduled visit',
    technical: 'Pre-Inspection Cleanup (abrupt dip prior to audit, > 20% drop)',
    simpleHelp: 'Readings drop dramatically right before an announced inspection or shift start.',
    possibleInnocentCauses: [
      'Planned factory cleanup and washdown before official audit',
      'Routine pre-inspection equipment servicing and filter change'
    ],
    possibleTamperingCauses: [
      'Shutting down production lines specifically to deceive inspecting officers',
      'Dumping fresh water into effluent tanks to present clean samples',
      'Switching to cleaner auxiliary water sources temporarily'
    ],
    inspectionChecks: [
      'Conduct unannounced spot checks without advance notice',
      'Check chemical storage levels and raw material consumption before the visit',
      'Inspect aeration tanks for signs of sudden dilution'
    ]
  },

  impossible_sensor_values: {
    id: 'impossible_sensor_values',
    name: 'Impossible Sensor Values',
    simple: 'Physically impossible numbers (like negative pollution)',
    technical: 'Impossible Sensor Values (hard range bounds violation, pH ∉ [0, 14])',
    simpleHelp: 'Readings that cannot physically exist in nature, like negative chemical concentration or pH above 14.',
    possibleInnocentCauses: [
      'Broken sensor electrode, severed signal cable, or power surge',
      'Transmitter analog-to-digital converter failure'
    ],
    possibleTamperingCauses: [
      'Careless manual data entry into logger',
      'Faulty signal emulator circuit wired into transmitter terminal'
    ],
    inspectionChecks: [
      'Inspect sensor physical wiring, junction boxes, and terminal voltage',
      'Perform standard buffer calibration to test probe response',
      'Review sensor replacement records and warranty age'
    ]
  },

  // =========================================================================
  // 2. SURVEILLANCE & ENVIRONMENTAL PARAMETERS
  // =========================================================================
  ph: {
    id: 'ph',
    name: 'pH',
    simple: 'Acidity / Alkalinity level (pH)',
    technical: 'pH (Hydrogen Ion Activity)',
    simpleHelp: 'Measures whether the water is acidic like vinegar (below 6.5) or alkaline like soap (above 8.5). Safe range is 6.5 to 8.5.'
  },

  cod: {
    id: 'cod',
    name: 'COD',
    simple: 'Chemical Pollution level (COD)',
    technical: 'Chemical Oxygen Demand (COD, mg/L)',
    simpleHelp: 'Total chemical matter in the water that consumes oxygen. High values mean severe industrial pollution.'
  },

  bod: {
    id: 'bod',
    name: 'BOD',
    simple: 'Organic Waste level (BOD)',
    technical: 'Biochemical Oxygen Demand (BOD, mg/L)',
    simpleHelp: 'Amount of biodegradable organic waste that bacteria break down. High values suffocate fish and aquatic life.'
  },

  tss: {
    id: 'tss',
    name: 'TSS',
    simple: 'Floating Mud & Particles (TSS)',
    technical: 'Total Suspended Solids (TSS, mg/L)',
    simpleHelp: 'Visible solid particles, mud, or chemical dust floating in the water that make it cloudy and murky.'
  },

  tds: {
    id: 'tds',
    name: 'TDS',
    simple: 'Dissolved Salts & Minerals (TDS)',
    technical: 'Total Dissolved Solids (TDS, mg/L)',
    simpleHelp: 'Dissolved salts and chemicals invisible to the naked eye. Used to detect if tap water was mixed into wastewater.'
  },

  flow: {
    id: 'flow',
    name: 'Flow Rate',
    simple: 'Wastewater Discharge Speed / Volume',
    technical: 'Effluent Flow Rate (m³/hour)',
    simpleHelp: 'How much wastewater is being pumped out of the factory per hour.'
  },

  so2: {
    id: 'so2',
    name: 'SO₂',
    simple: 'Sulphur Gas Emission (SO₂)',
    technical: 'Sulphur Dioxide (SO₂, mg/Nm³)',
    simpleHelp: 'Acidic smoke gas produced from burning coal or fuel oil in industrial boilers.'
  },

  nox: {
    id: 'nox',
    name: 'NOₓ',
    simple: 'Nitrogen Gas Emission (NOₓ)',
    technical: 'Nitrogen Oxides (NOₓ, mg/Nm³)',
    simpleHelp: 'Toxic exhaust gas produced from high-temperature combustion in boilers and engines.'
  },

  rtu: {
    id: 'rtu',
    name: 'RTU',
    simple: 'Factory Data Transmitter (RTU)',
    technical: 'Remote Terminal Unit (RTU / Data Logger)',
    simpleHelp: 'The electronic box on-site that collects sensor readings and sends them to the government server via internet.'
  },

  ocems: {
    id: 'ocems',
    name: 'OCEMS',
    simple: 'Online Pollution Metering Station (OCEMS)',
    technical: 'Online Continuous Emission/Effluent Monitoring System',
    simpleHelp: 'The automated surveillance sensors installed at factory chimneys and wastewater discharge pipes.'
  },

  loop_current: {
    id: 'loop_current',
    name: 'Loop Current',
    simple: 'Sensor Power & Signal Wire (4-20mA)',
    technical: '4-20mA Analog Loop Current Signal',
    simpleHelp: 'The electrical wire connecting the probe to the computer. If unplugged or cut, loop current drops to 0mA.'
  },

  shap: {
    id: 'shap',
    name: 'SHAP',
    simple: 'Primary Evidence Points',
    technical: 'SHAP (Shapley Additive Explanations) Feature Attribution',
    simpleHelp: 'The specific factors and records that caused the AI system to raise this warning.'
  },

  anomaly_score: {
    id: 'anomaly_score',
    name: 'Anomaly Score',
    simple: 'Suspicion / Risk Level',
    technical: 'Composite Anomaly Score',
    simpleHelp: 'A combined risk level based on cross-checking all telemetry, power usage, and historical patterns.'
  },

  severity_bands: {
    id: 'severity_bands',
    name: 'Severity Bands',
    simple: 'Priority Category',
    technical: 'Severity Stratification (Low / Medium / High / Critical)',
    simpleHelp: 'How urgently this factory requires an in-person field verification visit.'
  },

  telemetry: {
    id: 'telemetry',
    name: 'Telemetry',
    simple: 'Automated Sensor Stream',
    technical: 'Real-Time Continuous Telemetry Stream',
    simpleHelp: 'Digital readings sent automatically every 15 minutes from the factory to the government server.'
  },

  calibration: {
    id: 'calibration',
    name: 'Calibration',
    simple: 'Machine Accuracy Adjustment',
    technical: 'Sensor Zero & Span Field Calibration',
    simpleHelp: 'Regular tuning of the sensor using certified reference liquids so it reads accurate numbers.'
  },

  baseline: {
    id: 'baseline',
    name: 'Baseline',
    simple: 'Normal Everyday Factory Pattern',
    technical: '33-Factory Regional Empirical Baseline',
    simpleHelp: 'The normal benchmark pattern of clean, legal operation established across compliant industrial units.'
  },

  // =========================================================================
  // 3. INSPECTION OUTCOMES & STATUSES
  // =========================================================================
  outcome_explained: {
    id: 'outcome_explained',
    name: 'Explained',
    simple: 'Satisfactory (No violation found)',
    technical: 'Explained by verified operational evidence',
    simpleHelp: 'Inspector found legitimate proof (such as factory maintenance or plant shutdown) explaining the pattern.'
  },

  outcome_inconclusive: {
    id: 'outcome_inconclusive',
    name: 'Inconclusive',
    simple: 'Re-inspection / lab test needed',
    technical: 'Inconclusive telemetry delta',
    simpleHelp: 'Evidence on site was unclear. Water samples have been sent to a central lab for chemical analysis.'
  },

  outcome_unexplained: {
    id: 'outcome_unexplained',
    name: 'Unexplained',
    simple: 'Suspected tampering — action needed',
    technical: 'Unexplained tamper discrepancy',
    simpleHelp: 'Factory could not provide valid records for the discrepancy. Formal Show-Cause Notice recommended.'
  },

  outcome_referred: {
    id: 'outcome_referred',
    name: 'Referred',
    simple: 'Escalated for legal penalty / closure',
    technical: 'Referred for formal statutory investigation',
    simpleHelp: 'Critical intentional fraud or illegal bypass confirmed. Forwarded to Board for heavy environmental fine or closure.'
  },

  status_draft: {
    id: 'status_draft',
    name: 'Draft',
    simple: 'Draft Report',
    technical: 'Uncommitted Draft',
    simpleHelp: 'Report is still being drafted by the visiting officer.'
  },

  status_submitted: {
    id: 'status_submitted',
    name: 'Submitted',
    simple: 'Awaiting Senior Officer Sign-off',
    technical: 'Submitted for Regional Admin Review',
    simpleHelp: 'Field report submitted by inspector and waiting for senior officer review.'
  },

  status_reviewed: {
    id: 'status_reviewed',
    name: 'Reviewed',
    simple: 'Approved / Official Record',
    technical: 'Reviewed & Finalized Compliance Record',
    simpleHelp: 'Report has been reviewed and stamped as an official government record.'
  },

  status_action_required: {
    id: 'status_action_required',
    name: 'Action Required',
    simple: 'Needs Immediate Attention',
    technical: 'High Anomaly Priority Queue',
    simpleHelp: 'Flags that require priority attention or follow-up notice.'
  },

  // =========================================================================
  // 4. UI LABELS & SECTIONS
  // =========================================================================
  dashboard_title: {
    id: 'dashboard_title',
    name: 'Dashboard Title',
    simple: 'Industrial Environmental Surveillance',
    technical: 'Executive Surveillance & Model Overview',
    simpleHelp: 'Real-time overview of environmental monitoring.'
  },

  dashboard_attention: {
    id: 'dashboard_attention',
    name: 'Factories Needing Attention',
    simple: 'Factories that need attention',
    technical: 'Priority Anomaly Queue (Stratified by Risk Tier)',
    simpleHelp: 'Facilities showing unusual patterns ranked by urgency.'
  },

  ai_analysis_title: {
    id: 'ai_analysis_title',
    name: 'AI Analysis Title',
    simple: 'AI Factory Inspection Analysis',
    technical: 'Multi-Model Forensic Telemetry Evaluation',
    simpleHelp: 'Detailed breakdown of sensor checks and patterns.'
  },

  alerts_title: {
    id: 'alerts_title',
    name: 'Alerts Title',
    simple: 'Pollution & Sensor Alerts',
    technical: 'Real-Time Telemetry Anomaly Feed',
    simpleHelp: 'Warnings generated when sensor behavior departs from baseline.'
  },

  reports_title: {
    id: 'reports_title',
    name: 'Reports Title',
    simple: 'Verification & Audit Reports',
    technical: 'Regulatory Inspection & Audit Dossiers',
    simpleHelp: 'Official inspection reports and audit history.'
  },

  tab_pending: {
    id: 'tab_pending',
    name: 'Pending Review Tab',
    simple: 'Awaiting senior officer sign-off',
    technical: 'Pending Review',
    simpleHelp: 'Reports ready for administrative review.'
  },

  tab_reviewed: {
    id: 'tab_reviewed',
    name: 'Reviewed Tab',
    simple: 'Approved / official record',
    technical: 'Reviewed',
    simpleHelp: 'Completed and finalized records.'
  },

  tab_action_required: {
    id: 'tab_action_required',
    name: 'Action Required Tab',
    simple: 'Needs immediate attention',
    technical: 'Action Required',
    simpleHelp: 'Facilities where non-compliance was suspected.'
  }
};

/**
 * Helper to fetch a term safely with fallback
 * @param {string} id Term key
 * @param {'simple'|'technical'} mode Current view mode
 * @returns {string} Term text
 */
export function getTermText(id, mode = 'simple') {
  const entry = GLOSSARY[id];
  if (!entry) return id;
  return mode === 'technical' ? (entry.technical || entry.simple) : (entry.simple || entry.technical);
}

/**
 * Returns the entire term descriptor
 * @param {string} id Term key
 * @returns {object|null}
 */
export function getTerm(id) {
  return GLOSSARY[id] || null;
}
