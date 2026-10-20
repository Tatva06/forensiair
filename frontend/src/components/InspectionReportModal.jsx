import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  Save,
  History,
  User,
  Building2,
  Paperclip,
  Upload,
  File,
  Trash2,
  Download,
  Printer
} from 'lucide-react';
import { apiFetch } from '../config';
import { exportReportToPrint } from '../utils/reportExport';

const CHECK_OPTIONS = [
  { id: 'sensor_condition_and_calibration', label: 'Sensor probe condition, zero-drift & field calibration' },
  { id: 'original_readings', label: 'Original raw wastewater telemetry readings & loop current (4-20mA)' },
  { id: 'operational_records', label: 'Plant operational records, batch logs & electricity consumption' },
  { id: 'maintenance_logs', label: 'Sensor wash, cleaning & chemical dosing pump maintenance logs' },
  { id: 'missing_readings_or_transmission', label: 'RTU transmission issues, buffer replays or missing packets' },
  { id: 'other', label: 'Other physical verification checks (specify below)' },
];

const OUTCOME_OPTIONS = [
  {
    id: 'explained',
    label: 'Explained by verified evidence',
    description: 'Anomalous pattern is accounted for by verified equipment maintenance, sensor wash, or process change.',
    badgeClass: 'bg-[#e8f5e9] text-[#1b6d24] border-[#1b6d24]/30'
  },
  {
    id: 'inconclusive',
    label: 'Inconclusive — further checks required',
    description: 'Evidence is insufficient to confirm or refute anomaly cause; requires grab-sampling or follow-up.',
    badgeClass: 'bg-[#fff3e6] text-[#F57C00] border-[#F57C00]/30'
  },
  {
    id: 'unexplained',
    label: 'Unusual readings remain unexplained',
    description: 'Operational and maintenance records do not explain telemetry deviation; discrepancy flagged.',
    badgeClass: 'bg-[#fdecec] text-[#D32F2F] border-[#D32F2F]/30'
  },
  {
    id: 'referred',
    label: 'Referred for further investigation',
    description: 'Referred to regional regulatory authority / CPCB taskforce for formal on-site audit.',
    badgeClass: 'bg-[#e7f0f8] text-[#00355f] border-[#00355f]/30'
  }
];

export function InspectionReportModal({
  isOpen,
  onClose,
  alertId,
  alertData,
  reportId,
  currentUser,
  onReportSaved
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'history'
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Form State
  const [currentReportId, setCurrentReportId] = useState(reportId || null);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [linkedAlert, setLinkedAlert] = useState(alertData || null);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [checksPerformed, setChecksPerformed] = useState([]);
  const [otherChecksDesc, setOtherChecksDesc] = useState('');
  const [findings, setFindings] = useState('');
  const [outcome, setOutcome] = useState('inconclusive');
  const [evidenceRefs, setEvidenceRefs] = useState({
    doc_reference: '',
    maintenance_log: '',
    sample_id: '',
    other: '',
    supporting_reason: '',
    attachments: []
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [adminDecision, setAdminDecision] = useState('Reviewed');
  const [revisions, setRevisions] = useState([]);

  // State for creating new reports without a pre-linked alert
  const [availableFactories, setAvailableFactories] = useState([]);
  const [selectedFacId, setSelectedFacId] = useState('');
  const [availableAlerts, setAvailableAlerts] = useState([]);
  const [selectedAlertMode, setSelectedAlertMode] = useState('routine'); // 'routine' or 'alert'
  const [selectedAlertId, setSelectedAlertId] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isReadOnly = reportStatus === 'Submitted for Review' && !isAdmin;
  const isReviewed = reportStatus === 'Reviewed';

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowSubmitConfirm(false);
      setActiveTab('form');
      if (reportId) {
        fetchExistingReport(reportId);
      } else if (alertId) {
        checkAlertReport(alertId);
      } else {
        initNewReport();
      }
    }
  }, [isOpen, reportId, alertId]);

  const initNewReport = async () => {
    setCurrentReportId(null);
    setReportStatus('Draft');
    setInspectionDate(new Date().toISOString().slice(0, 10));
    setChecksPerformed([]);
    setOtherChecksDesc('');
    setFindings('');
    setOutcome('inconclusive');
    setEvidenceRefs({ doc_reference: '', maintenance_log: '', sample_id: '', other: '', supporting_reason: '', attachments: [] });
    setRevisions([]);
    setLinkedAlert(null);
    setSelectedAlertMode('routine');
    setSelectedAlertId('');
    setLoading(true);

    try {
      const [facRes, alRes] = await Promise.all([
        apiFetch('/api/factories'),
        apiFetch('/api/v2/alerts?limit=100&detected_only=true')
      ]);
      if (facRes.ok) {
        const facs = await facRes.json();
        setAvailableFactories(facs || []);
        if (facs && facs.length > 0) {
          setSelectedFacId(facs[0].factory_id);
        }
      }
      if (alRes.ok) {
        const alData = await alRes.json();
        setAvailableAlerts(alData.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load factories or alerts for new report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReport = async (rid) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/reports/${rid}`);
      if (res.ok) {
        const data = await res.json();
        populateReportData(data);
      } else {
        setErrorMsg(`Could not load report '${rid}'.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error while loading report.');
    } finally {
      setLoading(false);
    }
  };

  const checkAlertReport = async (aid) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/reports?alert_id=${encodeURIComponent(aid)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.reports && json.reports.length > 0) {
          fetchExistingReport(json.reports[0].report_id);
          return;
        }
      }
      // No existing report: start new draft
      setCurrentReportId(null);
      setReportStatus('Draft');
      setInspectionDate(new Date().toISOString().slice(0, 10));
      setChecksPerformed([]);
      setOtherChecksDesc('');
      setFindings('');
      setOutcome('inconclusive');
      setEvidenceRefs({ doc_reference: '', maintenance_log: '', sample_id: '', other: '', attachments: [] });
      setRevisions([]);
      if (alertData) {
        setLinkedAlert(alertData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateReportData = (data) => {
    setCurrentReportId(data.report_id);
    setReportStatus(data.status);
    setInspectionDate(data.inspection_date || new Date().toISOString().slice(0, 10));
    setChecksPerformed(data.checks_performed || []);
    setOtherChecksDesc(data.other_checks_description || '');
    setFindings(data.findings || '');
    setOutcome(data.outcome || 'inconclusive');
    setEvidenceRefs({
      doc_reference: data.evidence_references?.doc_reference || '',
      maintenance_log: data.evidence_references?.maintenance_log || '',
      sample_id: data.evidence_references?.sample_id || '',
      other: data.evidence_references?.other || '',
      supporting_reason: data.evidence_references?.supporting_reason || '',
      attachments: data.evidence_references?.attachments || []
    });
    setAdminNotes(data.admin_notes || '');
    setAdminDecision(data.admin_decision || 'Reviewed');
    setRevisions(data.revisions || []);
    if (data.linked_alert) {
      setLinkedAlert(data.linked_alert);
    }
  };

  const handleCheckToggle = (checkId) => {
    if (isReadOnly || isReviewed) return;
    setChecksPerformed(prev =>
      prev.includes(checkId) ? prev.filter(c => c !== checkId) : [...prev, checkId]
    );
  };

  const handleFileUpload = (e) => {
    if (isReadOnly || isReviewed) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type || 'application/octet-stream',
          dataUrl: loadEvt.target.result,
          uploadedAt: new Date().toISOString()
        };
        setEvidenceRefs(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (attId) => {
    if (isReadOnly || isReviewed) return;
    setEvidenceRefs(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
  };

  const buildReportData = () => ({
    report_id: currentReportId || 'RPT-DRAFT',
    alert_id: alertId || linkedAlert?.alert_id || (selectedFacId ? `ROUTINE-${selectedFacId}-${inspectionDate}` : 'Routine'),
    factory_id: linkedAlert?.factory_id || selectedFacId || 'N/A',
    factory_name: linkedAlert?.factory_name || availableFactories.find(f => f.factory_id === selectedFacId)?.name || 'Facility',
    inspection_date: inspectionDate,
    inspector_id: currentUser?.username || 'inspector',
    inspector_name: currentUser?.full_name || currentUser?.username || 'Field Inspector',
    checks_performed: checksPerformed,
    other_checks_description: otherChecksDesc,
    findings: findings,
    outcome: outcome,
    evidence_references: evidenceRefs,
    status: reportStatus,
    admin_notes: adminNotes,
    admin_decision: adminDecision,
    reviewed_by: reportStatus === 'Reviewed' ? (currentUser?.role === 'admin' ? currentUser.username : 'Regional Administrator') : null,
    reviewed_at: reportStatus === 'Reviewed' ? new Date().toISOString() : null,
    revisions: revisions,
    linked_alert: linkedAlert
  });

  const handleDownloadReport = () => {
    exportReportToPrint(buildReportData());
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const effectiveAlertId =
      alertId ||
      linkedAlert?.alert_id ||
      (selectedAlertMode === 'alert' && selectedAlertId ? selectedAlertId : (selectedFacId ? `ROUTINE-${selectedFacId}-${inspectionDate}` : null));

    if (!effectiveAlertId) {
      setErrorMsg('Please select a target facility or active anomaly alert before saving.');
      setSaving(false);
      return;
    }

    const payload = {
      alert_id: effectiveAlertId,
      inspection_date: inspectionDate,
      checks_performed: checksPerformed,
      other_checks_description: otherChecksDesc,
      findings: findings || 'Preliminary inspection draft.',
      outcome: outcome,
      evidence_references: evidenceRefs,
      submit_immediately: false
    };

    try {
      let res;
      if (currentReportId) {
        res = await apiFetch(`/api/reports/${currentReportId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/api/reports`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (res.ok) {
        populateReportData(json);
        setSuccessMsg('Inspection report draft saved successfully.');
        if (onReportSaved) onReportSaved(json);
      } else {
        setErrorMsg(json.detail || 'Failed to save report draft.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error while saving draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!findings || findings.trim().length < 10) {
      setErrorMsg('Please describe your inspection findings (at least 10 characters required).');
      return;
    }
    if (checksPerformed.length === 0) {
      setErrorMsg('Please select at least one physical check performed during the inspection.');
      return;
    }

    const effectiveAlertId =
      alertId ||
      linkedAlert?.alert_id ||
      (selectedAlertMode === 'alert' && selectedAlertId ? selectedAlertId : (selectedFacId ? `ROUTINE-${selectedFacId}-${inspectionDate}` : null));

    if (!effectiveAlertId) {
      setErrorMsg('Please select a target facility or active anomaly alert before submitting.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let reportToSubmitId = currentReportId;

      // If not yet saved in DB, create it first as Draft
      if (!reportToSubmitId) {
        const createRes = await apiFetch(`/api/reports`, {
          method: 'POST',
          body: JSON.stringify({
            alert_id: effectiveAlertId,
            inspection_date: inspectionDate,
            checks_performed: checksPerformed,
            other_checks_description: otherChecksDesc,
            findings: findings,
            outcome: outcome,
            evidence_references: evidenceRefs,
            submit_immediately: false
          })
        });
        const createdJson = await createRes.json();
        if (!createRes.ok) {
          setErrorMsg(createdJson.detail || 'Could not initialize report before submission.');
          setSaving(false);
          return;
        }
        reportToSubmitId = createdJson.report_id;
      } else {
        // Save latest edits first
        await apiFetch(`/api/reports/${reportToSubmitId}`, {
          method: 'PUT',
          body: JSON.stringify({
            inspection_date: inspectionDate,
            checks_performed: checksPerformed,
            other_checks_description: otherChecksDesc,
            findings: findings,
            outcome: outcome,
            evidence_references: evidenceRefs
          })
        });
      }

      // Submit for admin review
      const subRes = await apiFetch(`/api/reports/${reportToSubmitId}/submit`, {
        method: 'POST'
      });
      const subJson = await subRes.json();
      if (subRes.ok) {
        populateReportData(subJson);
        setShowSubmitConfirm(false);
        setSuccessMsg('Inspection report submitted for Administrator review.');
        if (onReportSaved) onReportSaved(subJson);
      } else {
        setErrorMsg(subJson.detail || 'Failed to submit report for review.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error during report submission.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminReview = async () => {
    if (!adminNotes || !adminNotes.trim()) {
      setErrorMsg('Administrator review notes are required before recording a decision.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch(`/api/reports/${currentReportId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision: adminDecision,
          admin_notes: adminNotes
        })
      });
      const json = await res.json();
      if (res.ok) {
        populateReportData(json);
        setSuccessMsg(`Report decision recorded: ${adminDecision}.`);
        if (onReportSaved) onReportSaved(json);
      } else {
        setErrorMsg(json.detail || 'Failed to record administrator review decision.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error recording review decision.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#f8f9fb] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00355f] text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-[#00355f]">
                  Inspection Verification Report
                </h2>
                {currentReportId && (
                  <span className="font-mono text-xs font-bold bg-[#00355f]/10 text-[#00355f] px-2 py-0.5 rounded">
                    {currentReportId}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#727780]">
                Official on-site verification & inspector findings documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span className={`badge-status ${
              reportStatus === 'Reviewed' ? 'badge-status-reviewed' :
              reportStatus === 'Submitted for Review' ? 'badge-status-submitted' :
              reportStatus === 'Further Information Required' ? 'badge-status-query' :
              'badge-status-draft'
            }`}>
              {reportStatus}
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#727780] hover:bg-[#edeef0] transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Form vs Revision Audit Trail */}
        <div className="flex border-b border-[#E5E7EB] bg-white px-6 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('form')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'form' ? 'border-[#00355f] text-[#00355f]' : 'border-transparent text-[#727780]'
            }`}
          >
            <FileText size={14} /> Verification Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ml-6 ${
              activeTab === 'history' ? 'border-[#00355f] text-[#00355f]' : 'border-transparent text-[#727780]'
            }`}
          >
            <History size={14} /> Revision Audit Trail ({revisions.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00355f]">
                <div className="w-4 h-4 border-2 border-[#00355f] border-t-transparent rounded-full animate-spin" />
                <span>Loading report details...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#fdecec] border border-[#D32F2F]/30 rounded-lg text-xs text-[#D32F2F] flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#e8f5e9] border border-[#1b6d24]/30 rounded-lg text-xs text-[#1b6d24] flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FORM */}
          {activeTab === 'form' && (
            <div className="space-y-6 text-xs">
              {/* Linked Alert Card OR New Report Facility Selector */}
              {linkedAlert ? (
                <div className="p-4 bg-[#f8f9fb] border border-[#E5E7EB] rounded-xl space-y-2">
                  <div className="font-bold text-[#00355f] flex items-center gap-2 text-xs uppercase tracking-wider">
                    <AlertTriangle size={14} /> Linked Anomaly Signal
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#727780] block text-[11px]">Facility:</span>
                      <strong className="text-[#191c1e] text-xs">{linkedAlert.factory_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#727780] block text-[11px]">Alert ID / Event:</span>
                      <strong className="font-mono text-[#00355f] text-xs">{linkedAlert.alert_id}</strong>
                    </div>
                    <div>
                      <span className="text-[#727780] block text-[11px]">Signal / Pattern:</span>
                      <span className="font-medium text-[#191c1e] text-xs">
                        {linkedAlert.tamper_label || linkedAlert.alert_type || 'Statistical Anomaly'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#f8f9fb] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="font-bold text-[#00355f] flex items-center justify-between text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} /> Target Facility & Inspection Scope
                    </div>
                    <span className="text-[10px] text-[#727780] font-normal">Select facility to file report</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">Select Facility <span className="text-[#D32F2F]">*</span></label>
                      <select
                        value={selectedFacId}
                        disabled={isReadOnly || isReviewed || !!currentReportId}
                        onChange={(e) => {
                          setSelectedFacId(e.target.value);
                          setSelectedAlertId('');
                        }}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#00355f]"
                      >
                        {availableFactories.length === 0 ? (
                          <option value="">Loading facilities...</option>
                        ) : (
                          availableFactories.map(f => (
                            <option key={f.factory_id} value={f.factory_id}>
                              {f.factory_id}: {f.name || f.factory_name} ({f.region || 'Industrial Zone'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">Inspection Type</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="alertMode"
                            checked={selectedAlertMode === 'routine'}
                            onChange={() => setSelectedAlertMode('routine')}
                            disabled={isReadOnly || isReviewed || !!currentReportId}
                          />
                          <span className="font-medium text-[#191c1e]">Routine / Scheduled</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="alertMode"
                            checked={selectedAlertMode === 'alert'}
                            onChange={() => setSelectedAlertMode('alert')}
                            disabled={isReadOnly || isReviewed || !!currentReportId}
                          />
                          <span className="font-medium text-[#191c1e]">Link Anomaly Alert</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {selectedAlertMode === 'alert' && (
                    <div className="pt-2 border-t border-[#E5E7EB]">
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">Choose Active Alert:</label>
                      <select
                        value={selectedAlertId}
                        disabled={isReadOnly || isReviewed || !!currentReportId}
                        onChange={(e) => setSelectedAlertId(e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#00355f]"
                      >
                        <option value="">-- Choose alert from list --</option>
                        {availableAlerts
                          .filter(a => !selectedFacId || a.factory_id === selectedFacId)
                          .map(a => (
                            <option key={a.alert_id} value={a.alert_id}>
                              {a.alert_id} — {a.parameter} {a.tamper_type || a.alert_type} ({a.severity})
                            </option>
                          ))}
                      </select>
                      {availableAlerts.filter(a => !selectedFacId || a.factory_id === selectedFacId).length === 0 && (
                        <p className="text-[11px] text-[#F57C00] mt-1">
                          No active alerts found for this facility. Will automatically register as a Routine Audit.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section A: Inspection Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">
                    Inspection Date <span className="text-[#D32F2F]">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly || isReviewed}
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#191c1e] font-semibold focus:outline-none focus:border-[#00355f]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">
                    Inspector Identity
                  </label>
                  <div className="w-full bg-[#f2f4f6] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#42474f] flex items-center gap-2">
                    <User size={14} className="text-[#727780]" />
                    <span>{currentUser?.username || 'Field Inspector'}</span>
                    <span className="text-[10px] text-[#727780] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                      Authenticated Context
                    </span>
                  </div>
                </div>
              </div>

              {/* Section B: Checks Performed */}
              <div className="space-y-2">
                <label className="font-bold text-[#191c1e] block">
                  Checks Performed on Site <span className="text-[#D32F2F]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECK_OPTIONS.map((chk) => {
                    const isChecked = checksPerformed.includes(chk.id);
                    return (
                      <label
                        key={chk.id}
                        className={`check-item-card ${isChecked ? 'selected' : ''} ${(isReadOnly || isReviewed) ? 'disabled opacity-70 pointer-events-none' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckToggle(chk.id)}
                          disabled={isReadOnly || isReviewed}
                        />
                        <span className="text-xs text-[#42474f] font-medium leading-tight">
                          {chk.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {checksPerformed.includes('other') && (
                  <div className="mt-2">
                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="Specify other verification checks performed..."
                      value={otherChecksDesc}
                      onChange={(e) => setOtherChecksDesc(e.target.value)}
                      className="w-full bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#00355f]"
                    />
                  </div>
                )}
              </div>

              {/* Section C: Findings & Observations */}
              <div className="space-y-1">
                <label className="font-bold text-[#191c1e] block">
                  Inspection Findings & Observations <span className="text-[#D32F2F]">*</span>
                </label>
                <textarea
                  rows={4}
                  disabled={isReadOnly || isReviewed}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Describe in detail what was checked at the facility, probe conditions, physical water clarity, dosing system status, and explanation for anomalous telemetry readings..."
                  className="w-full bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#00355f] leading-relaxed"
                />
              </div>

              {/* Section D: Inspection Outcome */}
              <div className="space-y-2">
                <label className="font-bold text-[#191c1e] block">
                  Inspection Outcome & Conclusion <span className="text-[#D32F2F]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OUTCOME_OPTIONS.map((opt) => {
                    const isSelected = outcome === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => !(isReadOnly || isReviewed) && setOutcome(opt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-[#00355f] bg-[#e7f0f8]/40 ring-1 ring-[#00355f]' : 'border-[#E5E7EB] bg-white hover:bg-[#fafbfc]'
                        } ${(isReadOnly || isReviewed) ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#191c1e]">{opt.label}</span>
                          <span className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-[#00355f] border-[#00355f]' : 'border-[#c2c7d1]'}`} />
                        </div>
                        <p className="text-[11px] text-[#727780] leading-snug">{opt.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section E: Supporting Evidence References */}
              <div className="space-y-4 p-4 bg-[#f8f9fb] border border-[#E5E7EB] rounded-xl">
                <div className="font-bold text-[#00355f] text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Supporting Evidence & Compliance Rationale
                  </span>
                  <span className="text-[10px] text-[#727780] font-normal">Documents justifying outcome</span>
                </div>

                {/* Technical Justification / Documented Reason */}
                <div>
                  <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                    Documented Reason & Technical Justification
                  </label>
                  <div className="space-y-1.5">
                    <select
                      disabled={isReadOnly || isReviewed}
                      value={
                        ['Sensor probe recalibration and zero-drift wash verified in plant maintenance log',
                         'Process batch production paused / ETP plant shut down during telemetry episode',
                         'Grab sample analysis conforms to effluent discharge CTO limits',
                         'Telemetry deviation confirmed as physical tampering / sensor bypass conduit',
                         'Flow meter pulse rate transmission buffer replay',
                         'Inconclusive evidence: awaiting 5-day BOD laboratory results'].includes(evidenceRefs.supporting_reason)
                          ? evidenceRefs.supporting_reason
                          : evidenceRefs.supporting_reason ? 'Other' : ''
                      }
                      onChange={(e) => {
                        if (e.target.value !== 'Other') {
                          setEvidenceRefs({ ...evidenceRefs, supporting_reason: e.target.value });
                        }
                      }}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#00355f]"
                    >
                      <option value="">-- Select standard compliance justification / reason --</option>
                      <option value="Sensor probe recalibration and zero-drift wash verified in plant maintenance log">
                        Sensor probe recalibration and zero-drift wash verified in plant maintenance log
                      </option>
                      <option value="Process batch production paused / ETP plant shut down during telemetry episode">
                        Process batch production paused / ETP plant shut down during telemetry episode
                      </option>
                      <option value="Grab sample analysis conforms to effluent discharge CTO limits">
                        Grab sample analysis conforms to effluent discharge CTO limits
                      </option>
                      <option value="Telemetry deviation confirmed as physical tampering / sensor bypass conduit">
                        Telemetry deviation confirmed as physical tampering / sensor bypass conduit
                      </option>
                      <option value="Flow meter pulse rate transmission buffer replay">
                        Flow meter pulse rate transmission buffer replay
                      </option>
                      <option value="Inconclusive evidence: awaiting 5-day BOD laboratory results">
                        Inconclusive evidence: awaiting 5-day BOD laboratory results
                      </option>
                      <option value="Other">Custom technical justification (enter below)</option>
                    </select>

                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="Specific explanation of how attached documents justify or explain the outcome..."
                      value={evidenceRefs.supporting_reason || ''}
                      onChange={(e) => setEvidenceRefs({ ...evidenceRefs, supporting_reason: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#00355f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#727780] block mb-1">
                      Lab Report / Certificate Reference
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="e.g. CPCB/LAB/2026/OCT-88"
                      value={evidenceRefs.doc_reference}
                      onChange={(e) => setEvidenceRefs({ ...evidenceRefs, doc_reference: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-[#191c1e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#727780] block mb-1">
                      Maintenance Log Reference
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="e.g. LOG-MAINT-2026-44B"
                      value={evidenceRefs.maintenance_log}
                      onChange={(e) => setEvidenceRefs({ ...evidenceRefs, maintenance_log: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-[#191c1e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#727780] block mb-1">
                      Grab Sample / Outfall Chain of Custody ID
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="e.g. SMPL-OUT-991"
                      value={evidenceRefs.sample_id}
                      onChange={(e) => setEvidenceRefs({ ...evidenceRefs, sample_id: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-[#191c1e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#727780] block mb-1">
                      Other Supporting Record
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly || isReviewed}
                      placeholder="e.g. SCADA audit export file ref"
                      value={evidenceRefs.other}
                      onChange={(e) => setEvidenceRefs({ ...evidenceRefs, other: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-[#191c1e] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sub-section: Supporting File & Photo Attachments */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#191c1e] text-xs flex items-center gap-1.5">
                        <Paperclip size={14} className="text-[#00355f]" />
                        Supporting Files & Photographic Evidence ({evidenceRefs.attachments?.length || 0})
                      </span>
                      <p className="text-[11px] text-[#727780]">
                        Attach sensor photos, ETP outfalls, grab sample seals, or scanned calibration PDFs (max 10MB per file).
                      </p>
                    </div>

                    {!(isReadOnly || isReviewed) && (
                      <label className="cursor-pointer bg-[#00355f] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#0f4c81] transition-colors shadow-xs self-start sm:self-auto">
                        <Upload size={13} />
                        <span>Attach Files / Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Attachments List / Grid */}
                  {(!evidenceRefs.attachments || evidenceRefs.attachments.length === 0) ? (
                    <label className={`evidence-dropzone flex flex-col items-center justify-center gap-1.5 ${
                      (isReadOnly || isReviewed) ? 'disabled opacity-75' : ''
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f6] text-[#727780] flex items-center justify-center">
                        <Paperclip size={16} />
                      </div>
                      <p className="text-xs text-[#191c1e] font-bold">No files or photos attached</p>
                      <p className="text-[11px] text-[#727780]">
                        {!(isReadOnly || isReviewed)
                          ? 'Click or drag files here to upload sensor photos, lab reports, or calibration certificates.'
                          : 'No supporting documentation was uploaded for this report.'}
                      </p>
                      {!(isReadOnly || isReviewed) && (
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      )}
                    </label>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {evidenceRefs.attachments.map((att) => {
                        const isImg = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                        return (
                          <div
                            key={att.id}
                            className="attachment-chip"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImg ? (
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-10 h-10 object-cover rounded border border-[#E5E7EB] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-[#f2f4f6] text-[#00355f] flex items-center justify-center shrink-0">
                                  <File size={20} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-[#191c1e] truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#727780]">
                                  <span>{att.size}</span>
                                  <span>•</span>
                                  <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download / Open file"
                                className="p-1.5 text-[#00355f] hover:bg-[#f2f4f6] rounded transition-colors"
                              >
                                <Download size={14} />
                              </a>
                              {!(isReadOnly || isReviewed) && (
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(att.id)}
                                  title="Remove attachment"
                                  className="p-1.5 text-[#D32F2F] hover:bg-[#fdecec] rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Section F: Administrator Review (Visible if Admin or if reviewed/notes present) */}
              {(isAdmin || adminNotes) && (
                <div className="p-4 bg-[#fff9f0] border border-[#F57C00]/30 rounded-xl space-y-3">
                  <div className="font-bold text-[#b45309] text-xs uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Administrator Review & Decision
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] bg-[#F57C00]/10 text-[#F57C00] px-2 py-0.5 rounded font-mono">
                        Admin Controls Active
                      </span>
                    )}
                  </div>

                  {isAdmin ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                          Review Decision
                        </label>
                        <select
                          value={adminDecision}
                          onChange={(e) => setAdminDecision(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs font-bold text-[#00355f] focus:outline-none"
                        >
                          <option value="Reviewed">Approve & Mark as Reviewed</option>
                          <option value="Further Information Required">Request Further Information</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                          Admin Review Notes <span className="text-[#D32F2F]">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Record review notes, verification findings, or specific queries required from field inspector..."
                          className="w-full bg-white border border-[#E5E7EB] rounded-lg p-2.5 text-xs text-[#191c1e] focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleAdminReview}
                        disabled={saving}
                        className="px-4 py-2 bg-[#00355f] text-white rounded-lg font-bold text-xs hover:bg-[#0f4c81] transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Recording Decision...' : 'Record Administrator Decision'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-[#42474f] space-y-1">
                      <div>
                        <strong>Review Status:</strong> {reportStatus}
                      </div>
                      <div>
                        <strong>Admin Notes:</strong> {adminNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVISION AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg text-xs text-[#727780]">
                Immutable server audit log recording all changes, submissions, and administrator reviews.
              </div>

              {revisions.length === 0 ? (
                <p className="text-xs text-[#727780] text-center py-6">No revisions logged yet.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                  {revisions.map((rev) => (
                    <div key={rev.revision_id} className="relative text-xs space-y-1">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#00355f] border-2 border-white ring-2 ring-[#00355f]/20" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#00355f]">Revision #{rev.revision_number}</span>
                        <span className="text-[10px] bg-[#f2f4f6] text-[#727780] px-2 py-0.5 rounded font-mono">
                          {rev.action}
                        </span>
                        <span className="text-[#727780] text-[11px]">
                          by <strong>{rev.actor_id}</strong> ({rev.actor_role})
                        </span>
                      </div>
                      <p className="text-[#191c1e] leading-snug">{rev.summary}</p>
                      <div className="text-[10px] text-[#727780]">{rev.created_at}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#f8f9fb] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#727780]">
            {isReviewed ? (
              <span className="text-[#1b6d24] font-bold">✓ This report has been reviewed and finalized.</span>
            ) : isReadOnly ? (
              <span>Locked for Admin Review. Inspectors cannot overwrite submitted reports.</span>
            ) : (
              <span>Drafts are saved locally in database until submitted.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#00355f] bg-[#e7f0f8] text-[#00355f] rounded-lg font-bold text-xs hover:bg-[#d5e7f6] transition-colors"
            >
              <Printer size={14} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg font-bold text-xs text-[#42474f] hover:bg-[#edeef0] transition-colors"
            >
              Close
            </button>

            {!(isReadOnly || isReviewed) && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#00355f] text-[#00355f] rounded-lg font-bold text-xs hover:bg-[#e7f0f8] transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#00355f] text-white rounded-lg font-bold text-xs hover:bg-[#0f4c81] transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>Submit for Review</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Confirmation Modal before Final Submit */}
        {showSubmitConfirm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-[#00355f] font-bold text-sm">
                <Send size={18} />
                <span>Confirm Final Report Submission</span>
              </div>
              <p className="text-xs text-[#42474f] leading-relaxed">
                Submitting this report will lock it from direct modifications and forward it to the administrator for compliance review. Are you sure you are ready to submit?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#727780] hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#00355f] text-white rounded-lg text-xs font-bold hover:bg-[#0f4c81]"
                >
                  {saving ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
