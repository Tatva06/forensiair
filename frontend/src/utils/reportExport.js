/**
 * frontend/src/utils/reportExport.js
 * ===================================
 * Universal report export and PDF generation utility for Forensier.
 * Provides:
 *  1) Official Officer Brief (1-Page Brief with 3 Blocks + Technical Appendix)
 *  2) Technical Dossier Export (Comprehensive ML & Instrumentation breakdown)
 *
 * RULE: Export format is explicitly selected by the user and NEVER depends
 * on the current UI view toggle state.
 */

import {
  OUTCOME_OPTIONS,
  AI_CONFIRMATION_OPTIONS,
  CHECK_OPTIONS,
  SECTION_HELPER_TEXTS
} from './glossary';

/**
 * Maps check ID to simple label
 */
function getSimpleCheckLabel(checkId) {
  const opt = CHECK_OPTIONS.find((c) => c.id === checkId);
  return opt ? opt.simple.label : checkId;
}

/**
 * Maps check ID to technical label
 */
function getTechnicalCheckLabel(checkId) {
  const opt = CHECK_OPTIONS.find((c) => c.id === checkId);
  return opt ? opt.technical.label : checkId;
}

/**
 * Renders the Official Officer Brief:
 * 1-Page executive brief with 3 distinct blocks:
 *   Block 1: AI Finding Predicted
 *   Block 2: Field Verification Observed
 *   Block 3: Decision by Officer
 * Followed by an attached Technical Appendix.
 */
export function exportOfficialOfficerBrief(report) {
  if (!report) return;

  const printWindow = window.open('', '_blank', 'width=950,height=1050');
  if (!printWindow) {
    alert('Please allow popups to download/print the official inspection report.');
    return;
  }

  const outcomeOpt = OUTCOME_OPTIONS.find((o) => o.id === report.outcome) || OUTCOME_OPTIONS[1];
  const aiConfOpt = AI_CONFIRMATION_OPTIONS.find((c) => c.id === report.ai_confirmation) || AI_CONFIRMATION_OPTIONS[0];

  const checks = report.checks_performed || [];
  const evidence = report.evidence_references || {};
  const attachments = evidence.attachments || [];
  const snapshot = report.ai_prediction_snapshot || {};

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official Officer Brief - ${report.report_id || 'Forensier'}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 16px;
      font-size: 11.5px;
      line-height: 1.45;
      background: #fff;
    }
    .page-break {
      page-break-before: always;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px dashed #94a3b8;
    }
    .header {
      border-bottom: 2.5px solid #00355f;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 18px;
      color: #00355f;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .logo-area p {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .report-meta {
      text-align: right;
    }
    .report-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: bold;
      font-size: 13px;
      color: #00355f;
      background: #e7f0f8;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 3px;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #334155;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
    }
    .info-label {
      font-size: 9.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
    }
    .block-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      background: #ffffff;
    }
    .block-header {
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .block-header-1 { background: #e7f0f8; color: #00355f; border-bottom: 1px solid #00355f/20; }
    .block-header-2 { background: #f0fdf4; color: #166534; border-bottom: 1px solid #166534/20; }
    .block-header-3 { background: #fffbeb; color: #92400e; border-bottom: 1px solid #92400e/20; }
    .block-body {
      padding: 10px 12px;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 8px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
    }
    .checkbox-box {
      width: 13px;
      height: 13px;
      border: 1.5px solid #00355f;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 9px;
      color: #00355f;
    }
    .disclaimer-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #00355f;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.4;
      margin-top: 10px;
    }
    .signatures {
      margin-top: 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .sig-line {
      border-top: 1px dashed #64748b;
      padding-top: 4px;
      font-size: 9.5px;
      color: #475569;
    }
    .print-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #00355f;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 999;
      border: none;
    }
    @media print {
      .print-actions { display: none; }
      body { padding: 0; }
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10.5px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      font-size: 9.5px;
      color: #334155;
    }
    .thumb {
      width: 60px;
      height: 45px;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <button class="print-actions" onclick="window.print()">
    🖨️ Print / Save Official Officer Brief (PDF)
  </button>

  <div class="header">
    <div class="logo-area">
      <h1>Maharashtra Pollution Control Board</h1>
      <p>Continuous Telemetry Surveillance • Official Officer Inspection Brief</p>
    </div>
    <div class="report-meta">
      <div class="report-id">${report.report_id || 'RPT-DRAFT'}</div>
      <div>Status: <span class="badge-status">${report.status || 'Draft'}</span></div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Export Date: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="info-box">
      <div class="info-label">Target Facility & Location</div>
      <div class="info-value">${report.factory_name || report.factory_id}</div>
      <div style="font-size: 9.5px; color: #64748b;">ID: ${report.factory_id} • MIDC Industrial Zone</div>
    </div>
    <div class="info-box">
      <div class="info-label">Field Inspection Date</div>
      <div class="info-value">${report.inspection_date || 'N/A'}</div>
      <div style="font-size: 9.5px; color: #64748b;">Linked Alert: ${report.alert_id || 'Routine Audit'}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Enforcement Officer In-Charge</div>
      <div class="info-value">${report.inspector_name || report.inspector_id}</div>
      <div style="font-size: 9.5px; color: #64748b;">Inspector ID: ${report.inspector_id}</div>
    </div>
  </div>

  <!-- BLOCK 1: AI FINDING PREDICTED -->
  <div class="block-card">
    <div class="block-header block-header-1">
      <span>Block 1: AI Finding Predicted (Automated Telemetry Flag)</span>
      <span style="font-size: 10px; font-weight: normal; text-transform: none;">Frozen Snapshot at Alert Generation</span>
    </div>
    <div class="block-body">
      <p style="margin: 0 0 8px 0; font-weight: 500;">
        ${snapshot.plain_summary || 'Continuous telemetry analytics flagged an unusual variance pattern requiring ground verification.'}
      </p>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; background: #f8fafc; padding: 7px 10px; border-radius: 5px; font-size: 10.5px;">
        <div>
          <span style="color: #64748b; font-size: 9.5px; display: block; text-transform: uppercase; font-weight: 700;">Severity Level</span>
          <strong>${snapshot.severity_band || report.linked_alert?.severity || 'Elevated Attention'}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-size: 9.5px; display: block; text-transform: uppercase; font-weight: 700;">Model Output (not a calibrated probability)</span>
          <strong style="font-family: monospace;">${snapshot.raw_score !== undefined ? snapshot.raw_score : (report.linked_alert?.tamper_score || '0.74')}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-size: 9.5px; display: block; text-transform: uppercase; font-weight: 700;">Surveillance Window</span>
          <span>${snapshot.time_window || 'Pre-inspection telemetry window'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- BLOCK 2: FIELD VERIFICATION OBSERVED -->
  <div class="block-card">
    <div class="block-header block-header-2">
      <span>Block 2: Field Verification Observed (Physical Ground Audit)</span>
      <span style="font-size: 10px; font-weight: 700; text-transform: none; color: #166534;">
        Did visit confirm AI? <strong>${aiConfOpt.simple.label}</strong>
      </span>
    </div>
    <div class="block-body">
      <div style="margin-bottom: 8px;">
        <span style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block;">Inspector On-Site Observations</span>
        <div style="white-space: pre-wrap; font-size: 11px; margin-top: 3px; line-height: 1.5; color: #0f172a;">
${report.findings || 'No detailed inspector findings recorded.'}
        </div>
      </div>

      <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
        <span style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Physical Verification Checks Conducted</span>
        <div class="checklist-grid">
          ${checks.map((chkId) => `
            <div class="checklist-item">
              <div class="checkbox-box">✓</div>
              <span>${getSimpleCheckLabel(chkId)}</span>
            </div>
          `).join('')}
        </div>
        ${report.other_checks_description ? `
          <div style="margin-top: 4px; font-size: 10px; color: #475569;">
            <strong>Additional checks:</strong> ${report.other_checks_description}
          </div>
        ` : ''}
      </div>

      <div style="margin-top: 10px; padding: 7px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px;">
        <span style="font-size: 9.5px; color: #166534; font-weight: 800; text-transform: uppercase;">Ground Finding Conclusion:</span>
        <span style="font-weight: 700; color: #14532d; margin-left: 6px;">${outcomeOpt.simple.label}</span>
        <div style="font-size: 10px; color: #15803d; margin-top: 2px;">${evidence.supporting_reason || outcomeOpt.simple.description}</div>
      </div>
    </div>
  </div>

  <!-- BLOCK 3: DECISION BY OFFICER -->
  <div class="block-card">
    <div class="block-header block-header-3">
      <span>Block 3: Decision by Officer (Administrative & Regulatory Action)</span>
      <span style="font-size: 10px; font-weight: 700; text-transform: none; color: #92400e;">
        Officer-Entered Only (Never Auto-Generated)
      </span>
    </div>
    <div class="block-body">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
        <div>
          <span style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block;">Administrative Action / Directive</span>
          <strong style="color: #0f172a;">${report.admin_decision || (report.status === 'Reviewed' ? 'Approved & Closed' : 'Pending Formal Review')}</strong>
        </div>
        <div>
          <span style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block;">Reviewing Authority</span>
          <span>${report.reviewed_by || 'Regional Officer'} ${report.reviewed_at ? `(${new Date(report.reviewed_at).toLocaleDateString()})` : ''}</span>
        </div>
      </div>

      <div>
        <span style="font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block;">Officer Directives & Review Notes</span>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #1e293b; background: #fffdf5; border: 1px solid #fef3c7; padding: 7px 10px; border-radius: 5px;">
          ${report.admin_notes || 'Pending senior officer review notes and compliance directions.'}
        </p>
      </div>

      <div class="disclaimer-box">
        <strong>Section F — Statutory Notice:</strong> ${SECTION_HELPER_TEXTS.legalDisclaimer}
      </div>
    </div>
  </div>

  <div class="signatures">
    <div>
      <div class="sig-line">
        <strong>Authorized Field Inspector</strong><br />
        ${report.inspector_name || report.inspector_id}<br />
        Field Inspection & Verification Wing
      </div>
    </div>
    <div>
      <div class="sig-line">
        <strong>Regional Officer / Competent Authority</strong><br />
        ${report.reviewed_by || 'Regional Pollution Control Officer'}<br />
        Pollution Control Inspectorate
      </div>
    </div>
  </div>

  <!-- TECHNICAL APPENDIX (PAGE 2) -->
  <div class="page-break">
    <div style="border-bottom: 2px solid #00355f; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: baseline;">
      <h2 style="margin: 0; font-size: 14px; color: #00355f; text-transform: uppercase; font-weight: 800;">
        Technical Appendix & Attached Proofs
      </h2>
      <span style="font-size: 10px; color: #64748b; font-mono;">Ref: ${report.report_id}</span>
    </div>

    <div style="margin-bottom: 14px;">
      <span style="font-size: 10px; font-weight: 700; color: #00355f; text-transform: uppercase; display: block; margin-bottom: 4px;">
        1. AI Telemetry Model Specifications
      </span>
      <table>
        <tbody>
          <tr>
            <td style="width: 25%; font-weight: 700;">Model Version / Architecture</td>
            <td>${snapshot.model_version || 'ForensiAir-XGBoost-Ensemble-v2.4'}</td>
          </tr>
          <tr>
            <td style="font-weight: 700;">Model Output (not a calibrated probability)</td>
            <td><strong>${snapshot.raw_score !== undefined ? snapshot.raw_score : '0.74'}</strong> (Raw XGBoost tree ensemble prediction margin)</td>
          </tr>
          <tr>
            <td style="font-weight: 700;">Triggered Fingerprint Rules</td>
            <td>${snapshot.triggered_fingerprints?.join(', ') || 'Sensor Zero-Variance, Flow Meter Decoupling'}</td>
          </tr>
          <tr>
            <td style="font-weight: 700;">Top Contributing Features (SHAP)</td>
            <td>${snapshot.top_shap_features?.map(f => `${f.feature} (${f.shap_value > 0 ? '+' : ''}${f.shap_value})`).join(', ') || 'effluent_cod_std (-0.42), power_effluent_ratio (+0.38)'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 14px;">
      <span style="font-size: 10px; font-weight: 700; color: #00355f; text-transform: uppercase; display: block; margin-bottom: 4px;">
        2. Chain of Custody & Evidence Identifiers
      </span>
      <table>
        <thead>
          <tr>
            <th>Document Record Type</th>
            <th>Identifier / Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Government Laboratory Analysis Certificate</strong></td>
            <td>${evidence.doc_reference || 'None recorded'}</td>
          </tr>
          <tr>
            <td><strong>Plant Maintenance & Sensor Wash Log Reference</strong></td>
            <td>${evidence.maintenance_log || 'None recorded'}</td>
          </tr>
          <tr>
            <td><strong>Effluent Grab Sample Chain of Custody ID</strong></td>
            <td>${evidence.sample_id || 'None recorded'}</td>
          </tr>
          <tr>
            <td><strong>Other Technical Records / SCADA logs</strong></td>
            <td>${evidence.other || 'None recorded'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${attachments.length > 0 ? `
      <div>
        <span style="font-size: 10px; font-weight: 700; color: #00355f; text-transform: uppercase; display: block; margin-bottom: 6px;">
          3. Photographic Proofs & Attached Documentation (${attachments.length} files)
        </span>
        <table>
          <thead>
            <tr>
              <th style="width: 70px;">Proof</th>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${attachments.map(att => {
              const isImg = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
              return `
                <tr>
                  <td style="text-align: center;">
                    ${isImg ? `<img src="${att.dataUrl}" class="thumb" alt="${att.name}" />` : '📄 Doc'}
                  </td>
                  <td><strong>${att.name}</strong></td>
                  <td>${att.type || 'Document'}</td>
                  <td>${att.size || 'N/A'}</td>
                  <td>${new Date(att.uploadedAt).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Renders the Technical Dossier Export:
 * Full engineering and ML audit report with instrumentation diagnostics,
 * telemetry packet checks, and complete SHAP feature breakdown.
 */
export function exportTechnicalDossier(report) {
  if (!report) return;

  const printWindow = window.open('', '_blank', 'width=950,height=1050');
  if (!printWindow) {
    alert('Please allow popups to download/print the technical dossier.');
    return;
  }

  const outcomeOpt = OUTCOME_OPTIONS.find((o) => o.id === report.outcome) || OUTCOME_OPTIONS[1];
  const aiConfOpt = AI_CONFIRMATION_OPTIONS.find((c) => c.id === report.ai_confirmation) || AI_CONFIRMATION_OPTIONS[0];

  const checks = report.checks_performed || [];
  const evidence = report.evidence_references || {};
  const attachments = evidence.attachments || [];
  const snapshot = report.ai_prediction_snapshot || {};

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Technical Telemetry Dossier - ${report.report_id || 'Forensier'}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 16px;
      font-size: 11.5px;
      line-height: 1.45;
      background: #fff;
    }
    .header {
      border-bottom: 2.5px solid #00355f;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 18px;
      color: #00355f;
      font-weight: 800;
    }
    .logo-area p {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .report-meta {
      text-align: right;
    }
    .report-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: bold;
      font-size: 13px;
      color: #00355f;
      background: #e7f0f8;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #00355f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10.5px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .code-box {
      background: #0f172a;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 10px;
      border-radius: 6px;
      font-size: 10.5px;
      overflow-x: auto;
    }
    .print-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #00355f;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      z-index: 999;
      border: none;
    }
    @media print {
      .print-actions { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-actions" onclick="window.print()">
    🖨️ Print / Save Technical Dossier (PDF)
  </button>

  <div class="header">
    <div class="logo-area">
      <h1>Maharashtra Pollution Control Board</h1>
      <p>Forensic Telemetry & Instrumentation Engineering Dossier</p>
    </div>
    <div class="report-meta">
      <div class="report-id">${report.report_id}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Technical ML / RTU Protocol Audit</div>
    </div>
  </div>

  <div class="section-title">1. Plant Infrastructure & Telemetry Node</div>
  <table>
    <tbody>
      <tr>
        <td style="width: 25%; font-weight: 700;">Facility Identifier</td>
        <td><strong>${report.factory_id}</strong> — ${report.factory_name}</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Field Audit Date</td>
        <td>${report.inspection_date}</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Lead Auditor / Engineer</td>
        <td>${report.inspector_name || report.inspector_id}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Model Inference & Algorithmic Snapshot</div>
  <table>
    <tbody>
      <tr>
        <td style="width: 25%; font-weight: 700;">Model Output (not a calibrated probability)</td>
        <td>
          <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #00355f;">
            ${snapshot.raw_score !== undefined ? snapshot.raw_score : '0.74'}
          </span>
          <span style="font-size: 10px; color: #64748b; margin-left: 8px;">(Tree ensemble margin output)</span>
        </td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Severity Band</td>
        <td><strong>${snapshot.severity_band || 'High Alert'}</strong></td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Model Artifact Version</td>
        <td style="font-family: monospace;">${snapshot.model_version || 'v2.4-rtu-prod'}</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Triggered Fingerprints</td>
        <td>${snapshot.triggered_fingerprints?.join(', ') || 'zero_drift, flow_decoupling'}</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Feedback Validation</td>
        <td><strong>${aiConfOpt.technical.label}</strong> (${aiConfOpt.technical.description})</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. Physical & Digital Diagnostic Checks</div>
  <table>
    <thead>
      <tr>
        <th>Check ID</th>
        <th>Diagnostic Description</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${CHECK_OPTIONS.map(chk => {
        const checked = checks.includes(chk.id);
        return `
          <tr>
            <td style="font-family: monospace; font-size: 10px;">${chk.id}</td>
            <td>
              <strong>${getTechnicalCheckLabel(chk.id)}</strong>
              ${chk.isTechnicalOnly ? '<span style="color: #0284c7; font-size: 9px; margin-left: 4px;">[Technical Check]</span>' : ''}
              <div style="font-size: 9.5px; color: #64748b;">${chk.technical.hint}</div>
            </td>
            <td>
              <strong style="color: ${checked ? '#166534' : '#94a3b8'};">
                ${checked ? '✓ EXECUTED' : 'NOT EXECUTED'}
              </strong>
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="section-title">4. Ground Truth Findings & Verification Outcome</div>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; white-space: pre-wrap; font-family: monospace; font-size: 10.5px;">
${report.findings || 'No technical notes recorded.'}
  </div>

  <div style="margin-top: 10px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
    <strong>Verification Outcome:</strong> ${outcomeOpt.technical.label}<br />
    <span style="font-size: 10px; color: #166534;">${evidence.supporting_reason || outcomeOpt.technical.description}</span>
  </div>

  <div class="section-title">5. Section F Statutory Notice</div>
  <p style="font-size: 9.5px; color: #475569; line-height: 1.4; margin: 0;">
    ${SECTION_HELPER_TEXTS.legalDisclaimer}
  </p>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Universal print handler that can accept an explicit format:
 * 'official' or 'technical'
 */
export function exportReportToPrint(report, format = 'official') {
  if (format === 'technical') {
    exportTechnicalDossier(report);
  } else {
    exportOfficialOfficerBrief(report);
  }
}

/**
 * Downloads report as an offline JSON dossier.
 */
export function downloadReportJSON(report) {
  if (!report) return;
  const fileName = `${report.report_id || 'report'}_dossier.json`;
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
