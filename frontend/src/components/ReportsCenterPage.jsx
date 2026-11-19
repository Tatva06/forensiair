import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Filter,
  Search,
  ChevronRight,
  User,
  RefreshCw,
  Paperclip,
  X
} from 'lucide-react';
import { apiFetch } from '../config';
import { useViewMode } from '../context/ViewModeContext';
import { InspectionReportModal } from './InspectionReportModal';
import {
  getOutcomeLabel,
  getReportStatusLabel,
  getAiConfirmationLabel
} from '../utils/glossary';
import {
  exportOfficialOfficerBrief,
  exportTechnicalDossier
} from '../utils/reportExport';

const REPORT_YEAR = new Date().getFullYear();

// Calm, easy-on-the-eyes formatters that avoid aggressive colored oval balloons
function getCleanOutcomeDisplay(outcomeId) {
  switch (outcomeId) {
    case 'explained':
      return {
        title: 'Normal Operations',
        detail: 'Routine maintenance, sensor wash, or process change',
        dotClass: 'bg-[#16a34a]',
        textClass: 'text-[#166534] font-bold'
      };
    case 'inconclusive':
      return {
        title: 'Inconclusive / Retest',
        detail: 'Awaiting laboratory analysis or sensor calibration',
        dotClass: 'bg-[#ea580c]',
        textClass: 'text-[#9a3412] font-bold'
      };
    case 'unexplained':
      return {
        title: 'Unexplained Variance',
        detail: 'Operational logs do not account for discrepancy',
        dotClass: 'bg-[#dc2626]',
        textClass: 'text-[#991b1b] font-bold'
      };
    case 'referred':
      return {
        title: 'Referred for Action',
        detail: 'Flagged for regulatory taskforce compliance audit',
        dotClass: 'bg-[#b91c1c]',
        textClass: 'text-[#7f1d1d] font-bold'
      };
    default:
      return {
        title: outcomeId || 'Pending Inspection',
        detail: 'Field ground findings pending documentation',
        dotClass: 'bg-slate-400',
        textClass: 'text-slate-700 font-semibold'
      };
  }
}

function getCleanAiFeedbackDisplay(aiConf) {
  switch (aiConf) {
    case 'confirmed':
      return {
        label: 'True Positive',
        chipClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dotClass: 'bg-rose-500'
      };
    case 'partly_confirmed':
      return {
        label: 'Partially Confirmed',
        chipClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dotClass: 'bg-amber-500'
      };
    case 'not_confirmed':
      return {
        label: 'False Positive',
        chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dotClass: 'bg-emerald-500'
      };
    case 'different_issue':
      return {
        label: 'Off-target Issue',
        chipClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
        dotClass: 'bg-sky-500'
      };
    default:
      return {
        label: 'Pending Validation',
        chipClass: 'bg-slate-50 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400'
      };
  }
}

function getCleanStatusDisplay(status) {
  switch (status) {
    case 'Reviewed':
      return {
        label: 'Reviewed & Finalized',
        chipClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
      };
    case 'Submitted for Review':
      return {
        label: 'Submitted for Review',
        chipClass: 'bg-sky-50 text-sky-800 border-sky-200/80'
      };
    case 'Further Information Required':
      return {
        label: 'Further Info Required',
        chipClass: 'bg-amber-50 text-amber-800 border-amber-200/80'
      };
    case 'Draft':
    default:
      return {
        label: 'Draft Dossier',
        chipClass: 'bg-slate-100 text-slate-700 border-slate-200/80'
      };
  }
}

export function ReportsCenterPage({ onNavigate, currentUser }) {
  const { isSimple, isTechnical } = useViewMode();
  const [mainView, setMainView] = useState('verification_reports'); // 'verification_reports' or 'compliance_dossiers'

  // Verification Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [exportTargetReport, setExportTargetReport] = useState(null);

  // Existing Dossiers state
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [filterTag, setFilterTag] = useState('All');
  const [factoriesLoading, setFactoriesLoading] = useState(true);

  useEffect(() => {
    fetchVerificationReports();
    fetchFactories();
  }, []);

  const fetchVerificationReports = async () => {
    setReportsLoading(true);
    try {
      const res = await apiFetch('/api/reports?limit=100');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load verification reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchFactories = async () => {
    try {
      const res = await apiFetch(`/api/factories`);
      if (res.ok) {
        const data = await res.json();
        setFactories(data);
        if (data.length > 0) {
          fetchFactoryReport(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFactoriesLoading(false);
    }
  };

  const fetchFactoryReport = async (fObj) => {
    setExplanation(null);
    try {
      const [factoryRes, shapRes] = await Promise.all([
        apiFetch(`/api/factories/${fObj.factory_id}`),
        apiFetch(`/api/factories/${fObj.factory_id}/shap`)
      ]);
      setSelectedFactory(factoryRes.ok ? await factoryRes.json() : fObj);
      if (shapRes.ok) setExplanation(await shapRes.json());
    } catch (err) {
      setSelectedFactory(fObj);
    }
  };

  const handleOpenReport = (rptId) => {
    setSelectedReportId(rptId);
    setIsReportModalOpen(true);
  };

  const handleDownloadReportDirect = async (r) => {
    try {
      const res = await apiFetch(`/api/reports/${r.report_id}`);
      if (res.ok) {
        const fullReport = await res.json();
        setExportTargetReport(fullReport);
      } else {
        setExportTargetReport(r);
      }
    } catch (err) {
      setExportTargetReport(r);
    }
  };

  const handleNewReport = () => {
    setSelectedReportId(null);
    setIsReportModalOpen(true);
  };

  // Filter verification reports
  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (outcomeFilter !== 'ALL') {
      if (outcomeFilter === 'explained' && r.outcome !== 'explained') return false;
      if (
        outcomeFilter === 'tampering' &&
        r.outcome !== 'referred' &&
        r.outcome !== 'unexplained'
      )
        return false;
      if (outcomeFilter === 'unexplained' && r.outcome !== 'unexplained') return false;
      if (outcomeFilter === 'referred' && r.outcome !== 'referred') return false;
      if (outcomeFilter === 'inconclusive' && r.outcome !== 'inconclusive') return false;
    }
    if (districtFilter !== 'ALL') {
      const qDist = districtFilter.toLowerCase();
      const matchDistrict =
        (r.factory_name || '').toLowerCase().includes(qDist) ||
        (r.factory_id || '').toLowerCase().includes(qDist) ||
        factories.find((f) => f.factory_id === r.factory_id)?.location?.toLowerCase()?.includes(qDist) ||
        factories.find((f) => f.factory_id === r.factory_id)?.district?.toLowerCase()?.includes(qDist) ||
        factories.find((f) => f.factory_id === r.factory_id)?.region?.toLowerCase()?.includes(qDist);
      if (!matchDistrict) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.factory_name || '').toLowerCase().includes(q);
      const matchId = (r.report_id || '').toLowerCase().includes(q);
      const matchAlert = (r.alert_id || '').toLowerCase().includes(q);
      const matchFindings = (r.findings || '').toLowerCase().includes(q);
      const matchReason = (r.evidence_references?.supporting_reason || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchAlert && !matchFindings && !matchReason) return false;
    }
    return true;
  });

  // KPI Metrics by Verification Outcome
  const totalReportsCount = reports.length;
  const severeOrUnexplainedCount = reports.filter(
    (r) => r.outcome === 'referred' || r.outcome === 'unexplained'
  ).length;
  const normalExplainedCount = reports.filter((r) => r.outcome === 'explained').length;
  const inconclusiveCount = reports.filter((r) => r.outcome === 'inconclusive').length;

  // Filter factories for dossier view
  const filteredFactories = factories.filter((f) => {
    if (filterTag === 'Critical') return f.risk_tier === 'High';
    if (filterTag === 'Routine') return f.risk_tier === 'Low' || f.risk_tier === 'Medium';
    return true;
  });

  const activeFac = selectedFactory || factories[0] || {};
  const isHigh = activeFac.risk_tier === 'High' || activeFac.risk_tier === 'High Risk';
  const isMedium = activeFac.risk_tier === 'Medium' || activeFac.risk_tier === 'Moderate Risk';
  const regionStr = activeFac.region || activeFac.district || 'Taloja';
  const licenseNo = activeFac.consent_number || 'Not available';

  const tamperProbVal =
    activeFac.tamper_probability !== undefined
      ? `${activeFac.tamper_probability.toFixed(1)}%`
      : 'Not available';

  const anomalyScoreVal =
    activeFac.raw_fingerprint_signals?.anomaly_score !== undefined
      ? activeFac.raw_fingerprint_signals.anomaly_score.toFixed(2)
      : activeFac.anomaly_score !== undefined
      ? activeFac.anomaly_score.toFixed(2)
      : 'Not available';

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-[#00355f] flex items-center gap-2">
            <FileText size={28} />
            <span>Reports &amp; Compliance Verification Center</span>
          </h1>
          <p className="text-body-sm text-[#727780] mt-1">
            {isSimple
              ? 'Official on-site inspector findings, verified equipment explanations, and authorized regulatory decisions.'
              : 'Continuous telemetry ground truth repository correlating physical audits with ML tampering fingerprints.'}
          </p>
        </div>

        {/* Primary View Switcher */}
        <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] p-1.5 rounded-xl shadow-xs shrink-0">
          <button
            onClick={() => setMainView('verification_reports')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 ${
              mainView === 'verification_reports'
                ? 'bg-[#00355f] text-white shadow-xs'
                : 'text-[#727780] hover:text-[#191c1e] hover:bg-[#f8f9fb]'
            }`}
          >
            <ShieldCheck size={16} />
            <span>{isSimple ? 'Verification Reports' : 'Field Inspection Dossiers'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                mainView === 'verification_reports'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#f2f4f6] text-[#727780]'
              }`}
            >
              {totalReportsCount}
            </span>
          </button>

          <button
            onClick={() => setMainView('compliance_dossiers')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 ${
              mainView === 'compliance_dossiers'
                ? 'bg-[#00355f] text-white shadow-xs'
                : 'text-[#727780] hover:text-[#191c1e] hover:bg-[#f8f9fb]'
            }`}
          >
            <Download size={16} />
            <span>Facility Compliance Dossiers</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INSPECTOR VERIFICATION REPORTS */}
      {mainView === 'verification_reports' && (
        <div className="space-y-6">
          {/* KPI Dashboard Summary (Mode-Aware, No "False Alarm" or "Tampering Confirmed" auto-labeling) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Reports */}
            <div
              onClick={() => setOutcomeFilter('ALL')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                outcomeFilter === 'ALL'
                  ? 'bg-white border-[#00355f] shadow-sm ring-1 ring-[#00355f]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#00355f]/40'
              }`}
            >
              <div className="text-[10px] font-bold text-[#727780] uppercase tracking-wider flex items-center justify-between">
                <span>{isSimple ? 'Total Verification Reports' : 'Total Telemetry Dossiers'}</span>
                <FileText size={16} className="text-[#00355f]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#00355f] mt-1">{totalReportsCount}</div>
              <p className="text-[11px] text-[#727780]">Taloja &amp; Mahad enforcement dossiers</p>
            </div>

            {/* Card 2: Serious / Unexplained Issues */}
            <div
              onClick={() => setOutcomeFilter('tampering')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                outcomeFilter === 'tampering'
                  ? 'bg-[#fdecec]/60 border-[#D32F2F] shadow-sm ring-1 ring-[#D32F2F]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D32F2F]/40'
              }`}
            >
              <div className="text-[10px] font-bold text-[#D32F2F] uppercase tracking-wider flex items-center justify-between">
                <span>{isSimple ? 'Serious / Unexplained Issues' : 'Unexplained / Referred'}</span>
                <AlertTriangle size={16} className="text-[#D32F2F]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#D32F2F] mt-1">{severeOrUnexplainedCount}</div>
              <p className="text-[11px] text-[#727780]">
                {isSimple ? 'Referred to senior officer / legal' : 'Regulatory audit & statutory directives'}
              </p>
            </div>

            {/* Card 3: Normal Explanation Found (No Violation) */}
            <div
              onClick={() => setOutcomeFilter('explained')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                outcomeFilter === 'explained'
                  ? 'bg-[#e8f5e9]/60 border-[#1b6d24] shadow-sm ring-1 ring-[#1b6d24]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#1b6d24]/40'
              }`}
            >
              <div className="text-[10px] font-bold text-[#1b6d24] uppercase tracking-wider flex items-center justify-between">
                <span>{isSimple ? 'Normal Explanation Found' : 'Accounted Telemetry Anomaly'}</span>
                <CheckCircle2 size={16} className="text-[#1b6d24]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#1b6d24] mt-1">{normalExplainedCount}</div>
              <p className="text-[11px] text-[#727780]">
                {isSimple ? 'Sensor wash & verified maintenance' : 'Verified sensor wash & overhaul logs'}
              </p>
            </div>

            {/* Card 4: Lab / Calibration Pending */}
            <div
              onClick={() => setOutcomeFilter('inconclusive')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                outcomeFilter === 'inconclusive'
                  ? 'bg-[#fff3e6]/60 border-[#F57C00] shadow-sm ring-1 ring-[#F57C00]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#F57C00]/40'
              }`}
            >
              <div className="text-[10px] font-bold text-[#F57C00] uppercase tracking-wider flex items-center justify-between">
                <span>{isSimple ? 'Proof / Lab Tests Needed' : 'Inconclusive Correlation'}</span>
                <Clock size={16} className="text-[#F57C00]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#F57C00] mt-1">{inconclusiveCount}</div>
              <p className="text-[11px] text-[#727780]">
                {isSimple ? 'Grab samples undergoing laboratory test' : '5-Day BOD incubation / loop check'}
              </p>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#f8f9fb] border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-xs">
                <Search size={14} className="text-[#727780]" />
                <input
                  type="text"
                  placeholder="Search facility, report ID, or findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-[#191c1e] focus:outline-none w-48 sm:w-60"
                />
              </div>

              {/* Outcome / Finding Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-[#727780]">Finding:</span>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="bg-[#f8f9fb] border border-[#E5E7EB] rounded px-2.5 py-1.5 font-bold text-[#00355f] focus:outline-none"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="explained">
                    {isSimple ? 'Normal explanation found, no violation' : 'Accounted by maintenance/wash'}
                  </option>
                  <option value="tampering">
                    {isSimple ? 'Serious issue / Unexplained' : 'Unexplained / Referred'}
                  </option>
                  <option value="unexplained">
                    {isSimple ? 'Factory could not explain the problem' : 'Unexplained variance'}
                  </option>
                  <option value="referred">
                    {isSimple ? 'Referred to senior officer / legal' : 'Referred for compliance audit'}
                  </option>
                  <option value="inconclusive">
                    {isSimple ? 'Not enough proof yet, re-inspection needed' : 'Inconclusive correlation'}
                  </option>
                </select>
              </div>

              {/* District Filter (Strictly Taloja & Mahad) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-[#727780]">District:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-[#f8f9fb] border border-[#E5E7EB] rounded px-2.5 py-1.5 font-bold text-[#00355f] focus:outline-none"
                >
                  <option value="ALL">All Industrial Zones</option>
                  <option value="Taloja">Taloja MIDC</option>
                  <option value="Mahad">Mahad MIDC</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-[#727780]">Review Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#f8f9fb] border border-[#E5E7EB] rounded px-2.5 py-1.5 font-bold text-[#00355f] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Reviewed">
                    {getReportStatusLabel('Reviewed', isSimple).label}
                  </option>
                  <option value="Submitted for Review">
                    {getReportStatusLabel('Submitted for Review', isSimple).label}
                  </option>
                  <option value="Draft">
                    {getReportStatusLabel('Draft', isSimple).label}
                  </option>
                  <option value="Further Information Required">
                    {getReportStatusLabel('Further Information Required', isSimple).label}
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchVerificationReports}
                className="p-2 border border-[#E5E7EB] rounded-lg hover:bg-[#f8f9fb] text-[#727780] transition-colors"
                title="Refresh verification reports"
              >
                <RefreshCw size={15} />
              </button>

              <button
                onClick={handleNewReport}
                className="flex items-center gap-2 bg-[#00355f] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#0f4c81] transition-colors shadow-xs"
              >
                <Plus size={15} />
                <span>File Verification Report</span>
              </button>
            </div>
          </div>

          {/* Verification Reports Table / Grid */}
          {reportsLoading ? (
            <div className="p-12 text-center text-xs text-[#727780] bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading verification reports from database...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#727780] bg-white border border-[#E5E7EB] rounded-xl space-y-2">
              <p className="font-bold text-sm text-[#191c1e]">No verification reports found</p>
              <p>No reports match the selected criteria. Click "File Verification Report" to document on-site checks.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-[#f8f9fb] border-b border-[#E5E7EB] text-[#727780] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Facility &amp; Scope</th>
                    <th className="py-3 px-4">Inspection Date</th>
                    <th className="py-3 px-4">Inspector</th>
                    <th className="py-3 px-4">AI Feedback</th>
                    <th className="py-3 px-4">Ground Outcome</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredReports.map((r) => {
                    const cleanOutcome = getCleanOutcomeDisplay(r.outcome);
                    const cleanAi = getCleanAiFeedbackDisplay(r.ai_confirmation);
                    const cleanStatus = getCleanStatusDisplay(r.status);

                    // Derive Taloja or Mahad region
                    const facObj = factories.find((f) => f.factory_id === r.factory_id);
                    const region =
                      facObj?.region ||
                      facObj?.district ||
                      facObj?.location ||
                      (r.factory_name?.toLowerCase().includes('mahad') || r.report_id?.includes('MHD')
                        ? 'Mahad'
                        : 'Taloja');

                    const attCount = r.evidence_references?.attachments?.length || 0;

                    return (
                      <tr key={r.report_id} className="hover:bg-[#f8fafc] transition-colors">
                        {/* Report ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top font-mono">
                          <div className="font-bold text-xs text-[#00355f] tracking-tight">{r.report_id}</div>
                          {attCount > 0 ? (
                            <button
                              onClick={() => handleOpenReport(r.report_id)}
                              className="inline-flex items-center gap-1 text-[11px] text-[#727780] hover:text-[#00355f] font-sans font-medium mt-1 transition-colors"
                              title="Click to view photographic proofs in dossier"
                            >
                              <Paperclip size={11} className="text-[#00355f]" />
                              <span>{attCount} Proof{attCount > 1 ? 's' : ''} Attached</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#9ca3af] font-sans block mt-0.5">No attachments</span>
                          )}
                        </td>

                        {/* Facility & Scope */}
                        <td className="py-3.5 px-4 min-w-[200px] align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#191c1e]">{r.factory_name || r.factory_id}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wider ${
                                region.toLowerCase().includes('mahad')
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200/60'
                              }`}
                            >
                              {region}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#727780] font-mono mt-0.5 flex items-center gap-1.5">
                            <span>Alert #{r.alert_id}</span>
                            {r.case_id && <span className="text-[#9ca3af]">• {r.case_id}</span>}
                          </div>
                        </td>

                        {/* Inspection Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#42474f] font-mono text-xs align-top">
                          {r.inspection_date}
                        </td>

                        {/* Inspector */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          <div className="font-semibold text-xs text-[#191c1e]">
                            {r.inspector_name || r.inspector_id}
                          </div>
                          <div className="text-[11px] text-[#727780]">SPCB Enforcement Officer</div>
                        </td>

                        {/* AI Feedback - Clean subtle chip with indicator dot, no aggressive oval balloon */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cleanAi.chipClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cleanAi.dotClass}`} />
                            <span>{cleanAi.label}</span>
                          </span>
                        </td>

                        {/* Ground Outcome - Clean title + subtle detail, zero oval balloons */}
                        <td className="py-3.5 px-4 min-w-[210px] max-w-[270px] align-top">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${cleanOutcome.dotClass}`} />
                            <span className={`text-xs ${cleanOutcome.textClass}`}>{cleanOutcome.title}</span>
                          </div>
                          <p className="text-[11px] text-[#727780] mt-0.5 leading-snug">
                            {cleanOutcome.detail}
                          </p>
                        </td>

                        {/* Status - Soft calm pill */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-top">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cleanStatus.chipClass}`}>
                            {cleanStatus.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadReportDirect(r)}
                              title="Download / Print Official PDF Report"
                              className="p-1.5 text-[#727780] hover:text-[#00355f] hover:bg-[#e7f0f8] rounded-lg transition-colors border border-transparent hover:border-[#00355f]/20"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenReport(r.report_id)}
                              className="px-3 py-1 bg-white border border-[#00355f] text-[#00355f] hover:bg-[#00355f] hover:text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                            >
                              Open &amp; Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FACILITY COMPLIANCE DOSSIERS (PRESERVED VIEW) */}
      {mainView === 'compliance_dossiers' && (
        <div className="flex flex-col md:h-[calc(100vh-180px)] md:flex-row md:overflow-hidden print:h-auto print:block">
          {/* Left Sidebar: Report Archive List (1/3) */}
          <section className="w-full md:w-1/3 border-r border-[#E5E7EB] flex flex-col bg-[#f8f9fb] print:hidden">
            <div className="p-4 border-b border-[#E5E7EB] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-[#00355f]">Dossiers List</h2>
                <span className="bg-[#00355f]/10 text-[#00355f] text-[10px] font-bold px-2 py-1 rounded">
                  {factories.length} SITES
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', 'Critical', 'Routine'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterTag === tag
                        ? 'bg-[#00355f] text-white font-bold'
                        : 'bg-white text-[#727780] border border-[#E5E7EB] hover:border-[#00355f]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
              {filteredFactories.map((fItem) => {
                const isSelected = activeFac.factory_id === fItem.factory_id;
                const itemHigh = fItem.risk_tier === 'High';
                const itemMed = fItem.risk_tier === 'Medium';

                return (
                  <div
                    key={fItem.factory_id}
                    onClick={() => fetchFactoryReport(fItem)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white border-l-4 border-[#00355f]'
                        : 'hover:bg-white border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-[#727780] uppercase">
                        FR-{REPORT_YEAR}-#{fItem.factory_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          itemHigh
                            ? 'bg-[#D32F2F]/10 text-[#D32F2F]'
                            : itemMed
                            ? 'bg-[#F57C00]/10 text-[#F57C00]'
                            : 'bg-[#1b6d24]/10 text-[#1b6d24]'
                        }`}
                      >
                        {fItem.risk_tier || 'ROUTINE'}
                      </span>
                    </div>
                    <h3 className="font-body-md font-bold text-[#00355f] mb-1">
                      {fItem.factory_name || fItem.name}
                    </h3>
                    <div className="text-xs text-[#727780]">
                      {fItem.region || fItem.district || 'Not available'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Dynamic PDF Preview Canvas (2/3) */}
          <section className="w-full md:w-2/3 flex flex-col bg-[#edeef0] p-8 overflow-y-auto print:w-full print:bg-white print:p-0 print:overflow-visible">
            <div className="max-w-3xl mx-auto w-full bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-md space-y-6 print:max-w-full print:border-none print:shadow-none print:rounded-none">
              <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-6">
                <div>
                  <span className="text-[10px] font-label-caps text-[#727780] uppercase">
                    OFFICIAL COMPLIANCE DOSSIER
                  </span>
                  <h1 className="text-headline-lg font-headline-lg text-[#00355f] mt-1">
                    {activeFac.factory_name || activeFac.name}
                  </h1>
                  <p className="text-body-sm text-[#42474f]">
                    District: {regionStr} | License: #{licenseNo}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-[#00355f] text-white px-5 py-2 rounded-lg font-bold text-body-sm flex items-center gap-2 hover:opacity-90 shadow-xs print:hidden"
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#f8f9fb] rounded-lg border border-[#E5E7EB]">
                  <div className="text-[10px] font-label-caps text-[#727780] uppercase font-bold">
                    TAMPER PROBABILITY
                  </div>
                  <div
                    className={`text-display-kpi text-display-kpi mt-1 ${
                      isHigh ? 'text-[#D32F2F]' : isMedium ? 'text-[#F57C00]' : 'text-[#1b6d24]'
                    }`}
                  >
                    {tamperProbVal}
                  </div>
                </div>
                <div className="p-4 bg-[#f8f9fb] rounded-lg border border-[#E5E7EB]">
                  <div className="text-[10px] font-label-caps text-[#727780] uppercase font-bold">
                    ANOMALY SCORE
                  </div>
                  <div
                    className={`text-display-kpi text-display-kpi mt-1 ${
                      isHigh ? 'text-[#D32F2F]' : isMedium ? 'text-[#F57C00]' : 'text-[#1b6d24]'
                    }`}
                  >
                    {anomalyScoreVal}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <h3 className="font-headline-md text-headline-md text-[#00355f]">
                  Executive Summary &amp; Evidence
                </h3>
                <p className="text-body-sm text-[#42474f] leading-relaxed">
                  Forensic AI evaluation of real-time telemetry from{' '}
                  <strong className="text-[#191c1e]">{activeFac.factory_name || activeFac.name}</strong>{' '}
                  ({regionStr}) revealed TSI risk score of{' '}
                  <strong className="text-[#191c1e]">
                    {activeFac.tsi_score !== undefined
                      ? `${activeFac.tsi_score.toFixed(1)} / 100`
                      : 'Not available'}
                  </strong>
                  . {activeFac.note ? `${activeFac.note} ` : ''}Automated compliance audit report compiled
                  for inspector review.
                </p>
              </div>

              {/* Composite Score Breakdown */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <h3 className="font-headline-md text-headline-md text-[#00355f]">
                  Composite Risk Score Breakdown
                </h3>
                {!explanation?.composite_breakdown ? (
                  <p className="text-body-sm text-[#727780]">Composite breakdown not available for this factory.</p>
                ) : (
                  <table className="w-full text-body-sm">
                    <tbody>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="py-1.5 text-[#42474f]">
                          Fingerprint Checks (
                          {(explanation.composite_breakdown.fingerprints.weight * 100).toFixed(1)}% weight,{' '}
                          {explanation.composite_breakdown.fingerprints.triggered_count}/
                          {explanation.composite_breakdown.fingerprints.total_checks} triggered)
                        </td>
                        <td className="py-1.5 text-right font-bold text-[#191c1e]">
                          {explanation.composite_breakdown.fingerprints.contribution}
                        </td>
                      </tr>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="py-1.5 text-[#42474f]">
                          Isolation Forest (
                          {(explanation.composite_breakdown.isolation_forest.weight * 100).toFixed(1)}% weight)
                        </td>
                        <td className="py-1.5 text-right font-bold text-[#191c1e]">
                          {explanation.composite_breakdown.isolation_forest.contribution}
                        </td>
                      </tr>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="py-1.5 text-[#42474f]">
                          Factory-Level Tamper Model (
                          {(explanation.composite_breakdown.tamper_model.weight * 100).toFixed(1)}% weight)
                        </td>
                        <td className="py-1.5 text-right font-bold text-[#191c1e]">
                          {explanation.composite_breakdown.tamper_model.contribution}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-[#00355f]">Total Risk Score</td>
                        <td className="py-1.5 text-right font-bold text-[#00355f]">
                          {explanation.composite_breakdown.total_risk_score}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Fingerprint Checks */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <h3 className="font-headline-md text-headline-md text-[#00355f]">
                  Fingerprint Check Detail
                </h3>
                {!explanation?.fingerprint_checks?.length ? (
                  <p className="text-body-sm text-[#727780]">
                    Fingerprint check detail not available for this factory.
                  </p>
                ) : (
                  <ul className="text-body-sm text-[#42474f] space-y-1">
                    {explanation.fingerprint_checks.map((chk) => (
                      <li key={chk.key} className="flex justify-between gap-4">
                        <span className={chk.triggered ? 'font-bold text-[#D32F2F]' : ''}>
                          {chk.triggered ? '⚠ ' : '✓ '}
                          {chk.label}
                        </span>
                        <span className="text-xs text-[#727780]">
                          {chk.raw_value === null
                            ? 'Not available'
                            : `value: ${chk.raw_value.toFixed(2)}${chk.unit}`}{' '}
                          (trigger: {chk.threshold_desc})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SHAP Explanation Summary */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <h3 className="font-headline-md text-headline-md text-[#00355f]">
                  SHAP Feature Attribution
                </h3>
                {!explanation?.shap ? (
                  <p className="text-body-sm text-[#727780]">
                    SHAP explanation not available for this factory.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-6 text-body-sm">
                    <div>
                      <div className="text-xs font-bold text-[#727780] uppercase mb-1">
                        Tamper Model (top drivers)
                      </div>
                      <ul className="space-y-0.5 text-[#42474f]">
                        {explanation.shap.tamper_model_shap?.features.slice(0, 3).map((f, idx) => (
                          <li key={idx}>
                            {f.label}:{' '}
                            <strong
                              className={
                                f.shap_value_logit > 0 ? 'text-[#D32F2F]' : 'text-[#1b6d24]'
                              }
                            >
                              {f.shap_value_logit > 0 ? '+' : ''}
                              {f.shap_value_logit}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#727780] uppercase mb-1">
                        Isolation Forest (top drivers)
                      </div>
                      <ul className="space-y-0.5 text-[#42474f]">
                        {explanation.shap.isolation_forest_shap?.features.slice(0, 3).map((f, idx) => (
                          <li key={idx}>
                            {f.label}:{' '}
                            <strong
                              className={f.shap_value < 0 ? 'text-[#D32F2F]' : 'text-[#1b6d24]'}
                            >
                              {f.shap_value}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Verification Report Dialog / Modal */}
      <InspectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportId={selectedReportId}
        currentUser={currentUser}
        onReportSaved={() => {
          fetchVerificationReports();
        }}
      />

      {/* EXPORT CHOICE MODAL FOR TABLE ACTION */}
      {exportTargetReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#cbd5e1] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#00355f]">
                    Export {exportTargetReport.report_id}
                  </h3>
                  <p className="text-[11px] text-[#64748b]">Select document format to download / print</p>
                </div>
              </div>
              <button
                onClick={() => setExportTargetReport(null)}
                className="p-1 rounded text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => {
                  const rep = exportTargetReport;
                  setExportTargetReport(null);
                  exportOfficialOfficerBrief(rep);
                }}
                className="p-4 rounded-xl border-2 border-[#00355f] bg-[#f0f7ff] hover:bg-[#e0efff] cursor-pointer transition-all space-y-1"
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
                  1-Page executive brief (Block 1: AI Finding Predicted / Block 2: Field Verification Observed / Block 3: Decision by Officer) + attached Technical Appendix.
                </p>
              </div>

              <div
                onClick={() => {
                  const rep = exportTargetReport;
                  setExportTargetReport(null);
                  exportTechnicalDossier(rep);
                }}
                className="p-4 rounded-xl border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] cursor-pointer transition-all space-y-1"
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
                  Comprehensive telemetry diagnostics, raw tree margin scores, SHAP values, RTU frame audit, and sensor loop logs.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setExportTargetReport(null)}
                className="px-4 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f2f4f6]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
