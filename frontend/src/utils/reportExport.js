/**
 * frontend/src/utils/reportExport.js
 * ===================================
 * Universal report export and PDF generation utility for Forensier.
 * Provides printable official regulatory compliance dossiers, PDF save,
 * and JSON/Markdown downloads across the entire application.
 */

export function exportReportToPrint(report) {
  if (!report) return;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to download/print the official inspection report.');
    return;
  }

  const checksMap = {
    sensor_condition_and_calibration: 'Sensor probe condition, zero-drift & field calibration',
    original_readings: 'Original raw wastewater telemetry readings & loop current (4-20mA)',
    operational_records: 'Plant operational records, batch logs & electricity consumption',
    maintenance_logs: 'Sensor wash, cleaning & chemical dosing pump maintenance logs',
    missing_readings_or_transmission: 'RTU transmission issues, buffer replays or missing packets',
    other: 'Other physical verification checks'
  };

  const outcomeLabels = {
    explained: 'Explained by verified evidence',
    inconclusive: 'Inconclusive — further checks required',
    unexplained: 'Unusual readings remain unexplained (Tamper Discrepancy)',
    referred: 'Referred for formal regulatory investigation'
  };

  const outcomeColors = {
    explained: '#1b6d24',
    inconclusive: '#d97706',
    unexplained: '#b91c1c',
    referred: '#00355f'
  };

  const outcomeBg = {
    explained: '#e8f5e9',
    inconclusive: '#fffbeb',
    unexplained: '#fef2f2',
    referred: '#e7f0f8'
  };

  const checks = report.checks_performed || [];
  const evidence = report.evidence_references || {};
  const attachments = evidence.attachments || [];
  const revisions = report.revisions || [];
  const outcomeKey = report.outcome || 'inconclusive';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official Inspection Report - ${report.report_id || 'Forensier'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #00355f;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 20px;
      color: #00355f;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      font-weight: 800;
    }
    .logo-area p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta {
      text-align: right;
    }
    .report-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: bold;
      font-size: 14px;
      color: #00355f;
      background: #e7f0f8;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #00355f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .info-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
    }
    .outcome-card {
      border: 1px solid ${outcomeColors[outcomeKey]};
      background: ${outcomeBg[outcomeKey]};
      color: ${outcomeColors[outcomeKey]};
      padding: 12px;
      border-radius: 6px;
      margin: 12px 0;
    }
    .outcome-title {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 11px;
    }
    .checkbox {
      width: 14px;
      height: 14px;
      border: 1.5px solid #00355f;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      color: #00355f;
    }
    .findings-box {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      white-space: pre-wrap;
      font-size: 11px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .attachment-img {
      max-width: 120px;
      max-height: 80px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .signatures {
      margin-top: 36px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      page-break-inside: avoid;
    }
    .sig-line {
      border-top: 1px dashed #64748b;
      padding-top: 6px;
      font-size: 10px;
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
  </style>
</head>
<body>
  <button class="print-actions" onclick="window.print()">
    🖨️ Print / Save as Official PDF
  </button>

  <div class="header">
    <div class="logo-area">
      <h1>Maharashtra Pollution Control Board</h1>
      <p>Continuous Telemetry Surveillance & Tamper Verification Audit Dossier</p>
    </div>
    <div class="report-meta">
      <div class="report-id">${report.report_id || 'RPT-DRAFT'}</div>
      <div>Status: <strong>${report.status || 'Draft'}</strong></div>
      <div style="font-size: 10px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="info-box">
      <div class="info-label">Target Facility</div>
      <div class="info-value">${report.factory_name || report.factory_id || 'Industrial Facility'}</div>
      <div style="font-size: 10px; color: #64748b;">ID: ${report.factory_id || 'N/A'}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Inspection Date</div>
      <div class="info-value">${report.inspection_date || 'N/A'}</div>
      <div style="font-size: 10px; color: #64748b;">Field Audit Date</div>
    </div>
    <div class="info-box">
      <div class="info-label">Officer In-Charge</div>
      <div class="info-value">${report.inspector_name || report.inspector_id || 'Authorized Inspector'}</div>
      <div style="font-size: 10px; color: #64748b;">Inspector ID: ${report.inspector_id || 'N/A'}</div>
    </div>
  </div>

  <div class="section-title">1. Surveillance Scope & Linked Anomaly Signal</div>
  <div class="info-box">
    <div class="grid-2">
      <div>
        <div class="info-label">Linked Alert / Scope ID</div>
        <div class="info-value" style="font-family: monospace;">${report.alert_id || 'Routine Scheduled Surveillance'}</div>
      </div>
      <div>
        <div class="info-label">Signal Category</div>
        <div class="info-value">${report.linked_alert?.alert_type || (report.alert_id?.startsWith('ROUTINE') ? 'Routine Unannounced Surveillance Audit' : 'Telemetry Variance Flag')}</div>
      </div>
    </div>
  </div>

  <div class="section-title">2. Physical On-Site Verification Checks</div>
  <div>
    ${Object.keys(checksMap).map(key => {
      const isChecked = checks.includes(key);
      return `
        <div class="checklist-item">
          <div class="checkbox">${isChecked ? '✓' : ''}</div>
          <span style="${isChecked ? 'font-weight: 600; color: #00355f;' : 'color: #64748b;'}">${checksMap[key]}</span>
        </div>
      `;
    }).join('')}
    ${report.other_checks_description ? `
      <div style="margin-top: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11px;">
        <strong>Other Checks Performed:</strong> ${report.other_checks_description}
      </div>
    ` : ''}
  </div>

  <div class="section-title">3. Detailed Inspector Findings & Site Observations</div>
  <div class="findings-box">
${report.findings || 'No detailed findings recorded.'}
  </div>

  <div class="section-title">4. Compliance Verification Outcome & Technical Justification</div>
  <div class="outcome-card">
    <div class="outcome-title">${outcomeLabels[outcomeKey] || outcomeKey}</div>
    <div>${evidence.supporting_reason || 'Verified on-site against plant logbooks and telemetry loop records.'}</div>
  </div>

  <div class="section-title">5. Supporting Evidence References & Attached Documentation</div>
  <table>
    <thead>
      <tr>
        <th>Document Reference Type</th>
        <th>Record Identifier / Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Lab Test / Analysis Report Reference</strong></td>
        <td>${evidence.doc_reference || 'None specified'}</td>
      </tr>
      <tr>
        <td><strong>Plant Maintenance / Wash Log Reference</strong></td>
        <td>${evidence.maintenance_log || 'None specified'}</td>
      </tr>
      <tr>
        <td><strong>Grab Sample Chain of Custody ID</strong></td>
        <td>${evidence.sample_id || 'None specified'}</td>
      </tr>
      <tr>
        <td><strong>Other Supporting Documentation</strong></td>
        <td>${evidence.other || 'None specified'}</td>
      </tr>
    </tbody>
  </table>

  ${attachments.length > 0 ? `
    <div style="margin-top: 12px;">
      <div class="info-label">Photographic & Attached File Evidence (${attachments.length} files)</div>
      <table>
        <thead>
          <tr>
            <th>Preview / File</th>
            <th>Filename</th>
            <th>Type</th>
            <th>File Size</th>
            <th>Upload Date</th>
          </tr>
        </thead>
        <tbody>
          ${attachments.map(att => {
            const isImg = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
            return `
              <tr>
                <td style="width: 90px; text-align: center;">
                  ${isImg ? `<img src="${att.dataUrl}" class="attachment-img" alt="${att.name}" />` : '📄 Document'}
                </td>
                <td><strong>${att.name}</strong></td>
                <td>${att.type || 'Document'}</td>
                <td>${att.size || 'N/A'}</td>
                <td>${new Date(att.uploadedAt).toLocaleDateString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <div class="section-title">6. Administrator Review & Compliance Decision</div>
  <div class="info-box">
    <div class="grid-2">
      <div>
        <div class="info-label">Review Status</div>
        <div class="info-value" style="color: ${report.status === 'Reviewed' ? '#1b6d24' : '#00355f'};">
          ${report.status || 'Draft'}
        </div>
      </div>
      <div>
        <div class="info-label">Reviewed By / Date</div>
        <div class="info-value">${report.reviewed_by || 'Awaiting Final Review'} ${report.reviewed_at ? `(${new Date(report.reviewed_at).toLocaleDateString()})` : ''}</div>
      </div>
    </div>
    ${report.admin_notes ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
        <div class="info-label">Review Notes / Directions</div>
        <div style="font-size: 11px; color: #1e293b;">${report.admin_notes}</div>
      </div>
    ` : ''}
  </div>

  <div class="signatures">
    <div>
      <div class="sig-line">
        <strong>Field Inspector Signature</strong><br />
        ${report.inspector_name || 'Authorized Inspector'}<br />
        Environmental Surveillance Wing
      </div>
    </div>
    <div>
      <div class="sig-line">
        <strong>Regional Officer / Administrator Sign-off</strong><br />
        ${report.reviewed_by || 'Competent Authority'}<br />
        Pollution Control Inspectorate
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto trigger print after 500ms
      setTimeout(function() {
        window.print();
      }, 500);
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
