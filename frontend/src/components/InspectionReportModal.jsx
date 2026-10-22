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
  Printer,
  Eye,
  Scale
} from 'lucide-react';
import { apiFetch } from '../config';
import { useViewMode } from '../context/ViewModeContext';
import {
  CHECK_OPTIONS,
  OUTCOME_OPTIONS,
  AI_CONFIRMATION_OPTIONS,
  SECTION_HELPER_TEXTS,
  getReportStatusLabel
} from '../utils/glossary';
import {
  exportOfficialOfficerBrief,
  exportTechnicalDossier
} from '../utils/reportExport';

export function InspectionReportModal({
  isOpen,
  onClose,
  alertId,
  alertData,
  reportId,
  currentUser,
  onReportSaved
}) {
  const { isSimple, isTechnical } = useViewMode();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'history'
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Form State
  const [currentReportId, setCurrentReportId] = useState(reportId || null);
  const [reportStatus, setReportStatus] = useState('Draft');
  const [linkedAlert, setLinkedAlert] = useState(alertData || null);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [checksPerformed, setChecksPerformed] = useState([]);
  const [otherChecksDesc, setOtherChecksDesc] = useState('');
  const [findings, setFindings] = useState('');
  const [outcome, setOutcome] = useState('inconclusive');
  const [aiConfirmation, setAiConfirmation] = useState('confirmed');
  const [aiPredictionSnapshot, setAiPredictionSnapshot] = useState(null);
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
  const [previewImage, setPreviewImage] = useState(null);

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
      setShowExportModal(false);
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
    setAiConfirmation('confirmed');
    setAiPredictionSnapshot(null);
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
      setAiConfirmation('confirmed');
      setAiPredictionSnapshot(null);
      setEvidenceRefs({ doc_reference: '', maintenance_log: '', sample_id: '', other: '', supporting_reason: '', attachments: [] });
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
    setAiConfirmation(data.ai_confirmation || 'confirmed');
    setAiPredictionSnapshot(data.ai_prediction_snapshot || null);
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
    setChecksPerformed((prev) =>
      prev.includes(checkId) ? prev.filter((c) => c !== checkId) : [...prev, checkId]
    );
  };

  const handleFileUpload = (e) => {
    if (isReadOnly || isReviewed) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size:
            file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type || 'application/octet-stream',
          dataUrl: loadEvt.target.result,
          uploadedAt: new Date().toISOString()
        };
        setEvidenceRefs((prev) => ({
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
    setEvidenceRefs((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId)
    }));
  };

  const buildReportData = () => ({
    report_id: currentReportId || 'RPT-DRAFT',
    alert_id:
      alertId ||
      linkedAlert?.alert_id ||
      (selectedFacId ? `ROUTINE-${selectedFacId}-${inspectionDate}` : 'Routine'),
    factory_id: linkedAlert?.factory_id || selectedFacId || 'N/A',
    factory_name:
      linkedAlert?.factory_name ||
      availableFactories.find((f) => f.factory_id === selectedFacId)?.name ||
      'Facility',
    inspection_date: inspectionDate,
    inspector_id: currentUser?.username || 'inspector',
    inspector_name: currentUser?.full_name || currentUser?.username || 'Field Inspector',
    checks_performed: checksPerformed,
    other_checks_description: otherChecksDesc,
    findings: findings,
    outcome: outcome,
    ai_confirmation: aiConfirmation,
    ai_prediction_snapshot: aiPredictionSnapshot,
    evidence_references: evidenceRefs,
    status: reportStatus,
    admin_notes: adminNotes,
    admin_decision: adminDecision,
    reviewed_by:
      reportStatus === 'Reviewed'
        ? currentUser?.role === 'admin'
          ? currentUser.username
          : 'Regional Administrator'
        : null,
    reviewed_at: reportStatus === 'Reviewed' ? new Date().toISOString() : null,
    revisions: revisions,
    linked_alert: linkedAlert
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const effectiveAlertId =
      alertId ||
      linkedAlert?.alert_id ||
      (selectedAlertMode === 'alert' && selectedAlertId
        ? selectedAlertId
        : selectedFacId
        ? `ROUTINE-${selectedFacId}-${inspectionDate}`
        : null);

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
      ai_confirmation: aiConfirmation,
      ai_prediction_snapshot: aiPredictionSnapshot,
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
      (selectedAlertMode === 'alert' && selectedAlertId
        ? selectedAlertId
        : selectedFacId
        ? `ROUTINE-${selectedFacId}-${inspectionDate}`
        : null);

    if (!effectiveAlertId) {
      setErrorMsg('Please select a target facility or active anomaly alert before submitting.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let reportToSubmitId = currentReportId;

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
            ai_confirmation: aiConfirmation,
            ai_prediction_snapshot: aiPredictionSnapshot,
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
        await apiFetch(`/api/reports/${reportToSubmitId}`, {
          method: 'PUT',
          body: JSON.stringify({
            inspection_date: inspectionDate,
            checks_performed: checksPerformed,
            other_checks_description: otherChecksDesc,
            findings: findings,
            outcome: outcome,
            ai_confirmation: aiConfirmation,
            ai_prediction_snapshot: aiPredictionSnapshot,
            evidence_references: evidenceRefs
          })
        });
      }

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

  const statusLabel = getReportStatusLabel(reportStatus, isSimple);

  // Derive snapshot values for display
  const snapshotData = aiPredictionSnapshot || {
    plain_summary:
      linkedAlert?.tamper_label ||
      'AI telemetry surveillance flagged an unusual drop or variance pattern requiring physical ground verification.',
    score: linkedAlert?.tamper_score || 0.74,
    raw_score: linkedAlert?.tamper_score || 0.74,
    severity_band: linkedAlert?.severity || 'High',
    model_version: 'ForensiAir-XGBoost-Ensemble-v2.4',
    triggered_fingerprints: ['sensor_zero_variance', 'flow_decoupling'],
    time_window: 'Continuous 24h Telemetry Stream'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#f8f9fb] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00355f] text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-[#00355f]">
                  {SECTION_HELPER_TEXTS.reportTitle}
                </h2>
                {currentReportId && (
                  <span className="font-mono text-xs font-bold bg-[#00355f]/10 text-[#00355f] px-2 py-0.5 rounded">
                    {currentReportId}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#727780]">
                {SECTION_HELPER_TEXTS.subtitle[isSimple ? 'simple' : 'technical']}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span className={`badge-status ${statusLabel.badge}`}>
              {statusLabel.label}
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
              activeTab === 'form'
                ? 'border-[#00355f] text-[#00355f]'
                : 'border-transparent text-[#727780]'
            }`}
          >
            <FileText size={14} /> Verification &amp; Decision Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ml-6 ${
              activeTab === 'history'
                ? 'border-[#00355f] text-[#00355f]'
                : 'border-transparent text-[#727780]'
            }`}
          >
            <History size={14} /> Revision Audit Trail ({revisions.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
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
                    <AlertTriangle size={14} /> Linked Surveillance Event
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#727780] block text-[11px]">Facility:</span>
                      <strong className="text-[#191c1e] text-xs">{linkedAlert.factory_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#727780] block text-[11px]">Alert ID:</span>
                      <strong className="font-mono text-[#00355f] text-xs">{linkedAlert.alert_id}</strong>
                    </div>
                    <div>
                      <span className="text-[#727780] block text-[11px]">Pattern / Parameter:</span>
                      <span className="font-medium text-[#191c1e] text-xs">
                        {linkedAlert.parameter || 'Effluent'} • {linkedAlert.tamper_label || linkedAlert.alert_type || 'Anomaly'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#f8f9fb] border border-[#E5E7EB] rounded-xl space-y-3">
                  <div className="font-bold text-[#00355f] flex items-center justify-between text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} /> Target Facility &amp; Inspection Scope
                    </div>
                    <span className="text-[10px] text-[#727780] font-normal">Select facility to file report</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">
                        Select Facility <span className="text-[#D32F2F]">*</span>
                      </label>
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
                          availableFactories.map((f) => (
                            <option key={f.factory_id} value={f.factory_id}>
                              {f.factory_id}: {f.name || f.factory_name} ({f.region || 'Industrial Zone'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">Inspection Scope</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="alertMode"
                            checked={selectedAlertMode === 'routine'}
                            onChange={() => setSelectedAlertMode('routine')}
                            disabled={isReadOnly || isReviewed || !!currentReportId}
                          />
                          <span className="font-medium text-[#191c1e]">Routine Field Audit</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="alertMode"
                            checked={selectedAlertMode === 'alert'}
                            onChange={() => setSelectedAlertMode('alert')}
                            disabled={isReadOnly || isReviewed || !!currentReportId}
                          />
                          <span className="font-medium text-[#191c1e]">Link Anomaly Signal</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {selectedAlertMode === 'alert' && (
                    <div className="pt-2 border-t border-[#E5E7EB]">
                      <label className="text-[#727780] block text-[11px] mb-1 font-bold">Choose Active Signal:</label>
                      <select
                        value={selectedAlertId}
                        disabled={isReadOnly || isReviewed || !!currentReportId}
                        onChange={(e) => setSelectedAlertId(e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#00355f]"
                      >
                        <option value="">-- Choose alert from list --</option>
                        {availableAlerts
                          .filter((a) => !selectedFacId || a.factory_id === selectedFacId)
                          .map((a) => (
                            <option key={a.alert_id} value={a.alert_id}>
                              {a.alert_id} — {a.parameter} {a.tamper_type || a.alert_type} ({a.severity})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Meta: Inspection Date & Inspector Identity */}
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
                      SPCB Authorized Context
                    </span>
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE BOX: PREDICTION vs FIELD FINDING (Requirement 5) */}
              <div className="border border-[#cbd5e1] rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#cbd5e1]">
                  {/* LEFT: Frozen Snapshot of AI Prediction */}
                  <div className="p-4 bg-[#f8fafc] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#00355f] text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          {SECTION_HELPER_TEXTS.predictionBoxHeading[isSimple ? 'simple' : 'technical']}
                        </span>
                        <span className="text-[10px] bg-[#00355f]/10 text-[#00355f] font-mono px-1.5 py-0.5 rounded font-semibold">
                          Frozen Snapshot
                        </span>
                      </div>

                      {isSimple ? (
                        /* PLAIN MODE: Plain sentences describing what AI flagged */
                        <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
                          <p className="font-medium bg-white p-3 rounded-lg border border-[#e2e8f0]">
                            {snapshotData.plain_summary}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="bg-white p-2 rounded border border-[#e2e8f0]">
                              <span className="text-[#64748b] block text-[10px] uppercase font-bold">Severity Band</span>
                              <strong className="text-[#00355f]">{snapshotData.severity_band}</strong>
                            </div>
                            <div className="bg-white p-2 rounded border border-[#e2e8f0]">
                              <span className="text-[#64748b] block text-[10px] uppercase font-bold">Surveillance Window</span>
                              <span className="text-[#334155]">{snapshotData.time_window || 'Continuous 24h'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* TECHNICAL MODE: Score, SHAP, fingerprints, XGBoost output label */
                        <div className="space-y-2 text-xs text-[#334155]">
                          <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#64748b] uppercase">
                                Model output (not a calibrated probability):
                              </span>
                              <span className="font-mono text-sm font-bold text-[#00355f]">
                                {snapshotData.raw_score !== undefined ? snapshotData.raw_score : snapshotData.score}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#64748b]">
                              Raw tree margin output from {snapshotData.model_version || 'ForensiAir-XGBoost-Ensemble-v2.4'}
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] space-y-1">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase block">
                              Triggered Fingerprint Signatures:
                            </span>
                            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                              {(snapshotData.triggered_fingerprints || []).map((fp, i) => (
                                <span key={i} className="bg-[#e7f0f8] text-[#00355f] px-1.5 py-0.5 rounded border border-[#00355f]/20">
                                  {fp}
                                </span>
                              ))}
                            </div>
                          </div>

                          {snapshotData.top_shap_features && (
                            <div className="bg-white p-2 rounded-lg border border-[#e2e8f0]">
                              <span className="text-[10px] font-bold text-[#64748b] uppercase block mb-1">
                                Top SHAP Feature Contributions:
                              </span>
                              <div className="space-y-0.5 font-mono text-[10px]">
                                {snapshotData.top_shap_features.map((sf, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="text-[#475569]">{sf.feature}</span>
                                    <span className={sf.shap_value > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'}>
                                      {sf.shap_value > 0 ? `+${sf.shap_value}` : sf.shap_value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-[#64748b] italic pt-1 border-t border-[#e2e8f0]">
                      * Snapshot locked at alert generation. Never alters with field inputs.
                    </div>
                  </div>

                  {/* RIGHT: Inspector Ground Observations */}
                  <div className="p-4 bg-white flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-[#191c1e] text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-[#15803d]" />
                          {SECTION_HELPER_TEXTS.findingsHeading[isSimple ? 'simple' : 'technical']} <span className="text-[#D32F2F]">*</span>
                        </label>
                        <span className="text-[10px] text-[#727780]">Ground Truth</span>
                      </div>
                      <textarea
                        rows={7}
                        disabled={isReadOnly || isReviewed}
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                        placeholder="Describe what was checked at the facility: physical probe condition, water clarity, dosing pumps, meter logs, and factory explanations..."
                        className="w-full bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#00355f] leading-relaxed resize-none"
                      />
                    </div>
                    <div className="text-[10px] text-[#727780] flex justify-between">
                      <span>Must record specific physical conditions observed.</span>
                      <span>{findings.length} characters</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW FIELD: DID THE VISIT CONFIRM THE AI PREDICTION? (Requirement 4) */}
              <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#00355f] text-xs flex items-center gap-1.5">
                    <Scale size={14} />
                    {SECTION_HELPER_TEXTS.confirmationHeading[isSimple ? 'simple' : 'technical']}
                    <span className="text-[#D32F2F]">*</span>
                  </label>
                  <span className="text-[10px] text-[#64748b]">Model Feedback Loop Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {AI_CONFIRMATION_OPTIONS.map((confOpt) => {
                    const isSelected = aiConfirmation === confOpt.id;
                    const optContent = isSimple ? confOpt.simple : confOpt.technical;
                    return (
                      <div
                        key={confOpt.id}
                        onClick={() => !(isReadOnly || isReviewed) && setAiConfirmation(confOpt.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#00355f] bg-[#e7f0f8] ring-1 ring-[#00355f]'
                            : 'border-[#E5E7EB] bg-white hover:bg-[#fafbfc]'
                        } ${isReadOnly || isReviewed ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#0f172a]">{optContent.label}</span>
                          <span
                            className={`w-3 h-3 rounded-full border ${
                              isSelected ? 'bg-[#00355f] border-[#00355f]' : 'border-[#cbd5e1]'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-[#64748b] leading-tight">{optContent.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section B: Checks Performed (Requirement 7: Checklists with Pipe Tracing & Optional Technical Checks) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#191c1e] text-xs block">
                    Physical On-Site Verification Checks Conducted <span className="text-[#D32F2F]">*</span>
                  </label>
                  <span className="text-[10px] text-[#727780]">Select all checks executed on site</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECK_OPTIONS.map((chk) => {
                    const isChecked = checksPerformed.includes(chk.id);
                    const optContent = isSimple ? chk.simple : chk.technical;

                    return (
                      <label
                        key={chk.id}
                        className={`check-item-card p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#f0fdf4] border-[#166534] ring-1 ring-[#166534]'
                            : 'bg-white border-[#E5E7EB] hover:bg-[#f8fafc]'
                        } ${isReadOnly || isReviewed ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckToggle(chk.id)}
                          disabled={isReadOnly || isReviewed}
                          className="mt-0.5 rounded text-[#00355f]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-[#0f172a] font-bold leading-tight">
                              {optContent.label}
                            </span>
                            {chk.isTechnicalOnly && (
                              <span className="text-[9px] font-bold bg-[#e0f2fe] text-[#0369a1] px-1.5 py-0.5 rounded">
                                Optional / Technical Check
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-[#64748b] mt-0.5 leading-snug">
                            {optContent.hint}
                          </p>
                        </div>
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

              {/* Section D: Ground Verification Finding Outcome (Requirement 1 & 2: Single Record, Exact Outcome Wording) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#191c1e] text-xs block">
                    {SECTION_HELPER_TEXTS.outcomeHeading[isSimple ? 'simple' : 'technical']} <span className="text-[#D32F2F]">*</span>
                  </label>
                  <span className="text-[10px] text-[#727780]">Ground Truth Conclusion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OUTCOME_OPTIONS.map((opt) => {
                    const isSelected = outcome === opt.id;
                    const optContent = isSimple ? opt.simple : opt.technical;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => !(isReadOnly || isReviewed) && setOutcome(opt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#00355f] bg-[#e7f0f8]/50 ring-1 ring-[#00355f]'
                            : 'border-[#E5E7EB] bg-white hover:bg-[#fafbfc]'
                        } ${isReadOnly || isReviewed ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#191c1e]">{optContent.label}</span>
                          <span
                            className={`w-3 h-3 rounded-full border ${
                              isSelected ? 'bg-[#00355f] border-[#00355f]' : 'border-[#c2c7d1]'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-[#727780] leading-snug">{optContent.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section E: Supporting Evidence References */}
              <div className="space-y-4 p-4 bg-[#f8f9fb] border border-[#E5E7EB] rounded-xl">
                <div className="font-bold text-[#00355f] text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Supporting Evidence &amp; Compliance Rationale
                  </span>
                  <span className="text-[10px] text-[#727780] font-normal">Documents justifying outcome</span>
                </div>

                {/* Technical Justification / Documented Reason */}
                <div>
                  <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                    Documented Reason &amp; Compliance Justification
                  </label>
                  <div className="space-y-1.5">
                    <select
                      disabled={isReadOnly || isReviewed}
                      value={
                        [
                          'Sensor probe recalibration and zero-drift wash verified in plant maintenance log',
                          'Process batch production paused / ETP plant shut down during telemetry episode',
                          'Grab sample analysis conforms to effluent discharge CTO limits',
                          'Telemetry deviation confirmed as physical tampering / sensor bypass conduit',
                          'Flow meter pulse rate transmission buffer replay',
                          'Inconclusive evidence: awaiting 5-day BOD laboratory results'
                        ].includes(evidenceRefs.supporting_reason)
                          ? evidenceRefs.supporting_reason
                          : evidenceRefs.supporting_reason
                          ? 'Other'
                          : ''
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
                        Supporting Files &amp; Photographic Evidence ({evidenceRefs.attachments?.length || 0})
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
                  {!evidenceRefs.attachments || evidenceRefs.attachments.length === 0 ? (
                    <label
                      className={`evidence-dropzone flex flex-col items-center justify-center gap-1.5 p-6 border-2 border-dashed border-[#cbd5e1] rounded-xl cursor-pointer hover:border-[#00355f] transition-colors ${
                        isReadOnly || isReviewed ? 'disabled opacity-75' : ''
                      }`}
                    >
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
                        const isImg =
                          att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                        return (
                          <div
                            key={att.id}
                            className={`attachment-chip p-2.5 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-between ${
                              isImg ? 'cursor-pointer hover:border-[#00355f] hover:bg-[#f0f7ff]/50' : ''
                            }`}
                            onClick={() => isImg && setPreviewImage(att)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImg ? (
                                <div className="relative group shrink-0">
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-11 h-11 object-cover rounded-lg border border-[#cbd5e1] group-hover:opacity-90 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-[#00355f]/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye size={16} className="text-white drop-shadow" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-[#f2f4f6] text-[#00355f] flex items-center justify-center shrink-0">
                                  <File size={22} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-[#191c1e] truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[#727780] mt-0.5">
                                  <span className="font-semibold text-[#00355f] bg-[#e7f0f8] px-1 rounded">
                                    {att.size}
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                                  {isImg && <span className="text-[#10b981] font-semibold">• Click to view</span>}
                                </div>
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-1 shrink-0 ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isImg && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(att)}
                                  title="View full-size photo"
                                  className="p-1.5 text-[#00355f] hover:bg-[#e7f0f8] rounded transition-colors"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download file"
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

              {/* SECTION F: DECISION BY OFFICER (Requirement 3: SEPARATE STAGES — Officer-Entered Only, Never Auto-Generated) */}
              <div className="p-4 bg-[#fff9f0] border border-[#F57C00]/30 rounded-xl space-y-3">
                <div className="font-bold text-[#b45309] text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> {SECTION_HELPER_TEXTS.decisionHeading[isSimple ? 'simple' : 'technical']}
                  </span>
                  <span className="text-[10px] bg-[#F57C00]/10 text-[#F57C00] px-2 py-0.5 rounded font-mono font-bold">
                    Officer-Entered Only (Never Auto-Generated)
                  </span>
                </div>

                {isAdmin ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                        Administrative Action / Statutory Decision
                      </label>
                      <select
                        value={adminDecision}
                        onChange={(e) => setAdminDecision(e.target.value)}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs font-bold text-[#00355f] focus:outline-none"
                      >
                        <option value="Reviewed">Approve &amp; Close Verification Dossier</option>
                        <option value="Further Information Required">Request Clarification / Grab Sampling from Inspector</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#191c1e] block mb-1">
                        Officer Directives &amp; Action Notes <span className="text-[#D32F2F]">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Enter official directives, penalties, show-cause notice refs, or closure instructions..."
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg p-2.5 text-xs text-[#191c1e] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleAdminReview}
                      disabled={saving}
                      className="px-4 py-2 bg-[#00355f] text-white rounded-lg font-bold text-xs hover:bg-[#0f4c81] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Recording Decision...' : 'Record Officer Decision'}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-[#42474f] space-y-1.5">
                    <div>
                      <strong>Review Status:</strong> {statusLabel.label}
                    </div>
                    <div>
                      <strong>Officer Directives:</strong> {adminNotes || 'Awaiting Senior Officer Review.'}
                    </div>
                  </div>
                )}

                {/* Statutory Legal Disclaimer (Requirement 6: VERBATIM in both modes) */}
                <div className="p-3 bg-white border border-[#e2e8f0] rounded-lg text-[10.5px] text-[#475569] leading-relaxed">
                  <strong className="text-[#00355f]">Section F Statutory Notice: </strong>
                  {SECTION_HELPER_TEXTS.legalDisclaimer}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REVISION AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg text-xs text-[#727780]">
                Immutable server audit log recording all changes, submissions, and officer review decisions.
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
              <span className="text-[#1b6d24] font-bold">✓ This report has been reviewed and closed by Senior Officer.</span>
            ) : isReadOnly ? (
              <span>Locked for Officer Review. Field inspectors cannot overwrite submitted reports.</span>
            ) : (
              <span>Drafts are saved locally in database until submitted.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export Choice Modal Trigger (Requirement 8) */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#00355f] bg-[#e7f0f8] text-[#00355f] rounded-lg font-bold text-xs hover:bg-[#d5e7f6] transition-colors"
            >
              <Printer size={14} />
              <span>Export PDF / Dossier</span>
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

        {/* EXPORT CHOICE MODAL (Requirement 8: Export Choice Independent of Current Toggle State) */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#cbd5e1] space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                    <Download size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#00355f]">Select Export Document Format</h3>
                    <p className="text-[11px] text-[#64748b]">Select document type to print or download as PDF</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 rounded text-[#94a3b8] hover:text-[#0f172a]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Choice 1: Official Officer Brief */}
                <div
                  onClick={() => {
                    setShowExportModal(false);
                    exportOfficialOfficerBrief(buildReportData());
                  }}
                  className="p-4 rounded-xl border-2 border-[#00355f] bg-[#f0f7ff] hover:bg-[#e0efff] cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#00355f] uppercase tracking-wide">
                      📄 Official Officer Brief (Recommended)
                    </span>
                    <span className="text-[10px] bg-[#00355f] text-white px-2 py-0.5 rounded font-bold">
                      Official Brief
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    1-page executive summary organized into three blocks: <strong>Block 1: AI Finding Predicted</strong>, <strong>Block 2: Field Verification Observed</strong>, and <strong>Block 3: Decision by Officer</strong>, followed by a Technical Appendix with chain of custody and photo proofs.
                  </p>
                  <div className="text-[10.5px] text-[#00355f] font-semibold pt-1">
                    ✓ Recommended for regional officers, judicial records, and administrative review.
                  </div>
                </div>

                {/* Choice 2: Technical Dossier Export */}
                <div
                  onClick={() => {
                    setShowExportModal(false);
                    exportTechnicalDossier(buildReportData());
                  }}
                  className="p-4 rounded-xl border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0f172a] uppercase tracking-wide">
                      🔬 Technical Dossier Export
                    </span>
                    <span className="text-[10px] bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded font-bold">
                      ML &amp; Diagnostics
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Comprehensive telemetry forensic packet with raw tree margin scores, SHAP values, sensor loop current (4-20mA), RTU packet replay diagnostics, and SCADA gateway audit entries.
                  </p>
                  <div className="text-[10.5px] text-[#475569] pt-1">
                    ✓ Designed for instrument engineers, data science audits, and CPCB technical committees.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal before Final Submit */}
        {showSubmitConfirm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-[#00355f] font-bold text-sm">
                <Send size={18} />
                <span>Confirm Final Report Submission</span>
              </div>
              <p className="text-xs text-[#42474f] leading-relaxed">
                Submitting this report will lock it from direct modifications and forward it to the senior administrator for compliance review. Are you sure you are ready to submit?
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

        {/* Image Evidence Lightbox Viewer Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="bg-[#0f172a] border border-[#334155] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#334155] flex items-center justify-between text-white bg-[#1e293b]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0284c7] text-white border border-[#38bdf8]/40 shadow-xs uppercase tracking-wider">
                    📷 Evidentiary Proof
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate text-[#f8fafc]">{previewImage.name}</p>
                    <p className="text-[10px] text-[#94a3b8]">{previewImage.size} • Captured by SPCB Field Inspector</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewImage.dataUrl}
                    download={previewImage.name}
                    className="px-3 py-1.5 rounded-lg bg-[#00355f] text-white text-xs font-bold hover:bg-[#0f4c81] flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download size={13} />
                    <span>Download Original</span>
                  </a>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors"
                    title="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-[#020617]/90 min-h-[350px]">
                <img
                  src={previewImage.dataUrl}
                  alt={previewImage.name}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-[#334155]"
                />
              </div>

              <div className="p-3 bg-[#0f172a] border-t border-[#334155] text-center text-[11px] text-[#94a3b8]">
                <span>Official Forensic Telemetry Verification Evidence • Press ESC or click outside to dismiss</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
