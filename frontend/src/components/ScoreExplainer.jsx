import React from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { getSeverityBand } from '../config/severityConfig';
import { GLOSSARY, getTerm } from '../i18n/glossary';
import { TechDetails } from './TechDetails';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ClipboardCheck,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';

export function ScoreExplainer({
  score = 0,
  inspectionStatus = 'pending', // 'pending' | 'verified' | 'not_confirmed' | 'different_issue'
  fingerprints = [],
  shapValues = {},
  modelName = 'Forensier V2 Causal Supervised Detector',
  modelVersion = '2.0.0-frozen',
  modelBreakdown = null,
  factoryName = null,
  compact = false
}) {
  const { isSimple } = useViewMode();
  const severity = getSeverityBand(score);

  // Map inspection status to human-readable chip
  const getStatusChip = () => {
    switch (inspectionStatus) {
      case 'verified':
        return {
          label: 'Verified on site',
          bg: '#e8f5e9',
          text: '#1b6d24',
          border: 'rgba(27, 109, 36, 0.3)',
          icon: <CheckCircle2 size={13} />
        };
      case 'not_confirmed':
        return {
          label: 'Not confirmed on site (Innocent cause)',
          bg: '#f1f5f9',
          text: '#475569',
          border: '#cbd5e1',
          icon: <CheckCircle2 size={13} />
        };
      case 'different_issue':
        return {
          label: 'Different operational issue found',
          bg: '#fffbeb',
          text: '#b45309',
          border: 'rgba(180, 83, 9, 0.3)',
          icon: <AlertTriangle size={13} />
        };
      case 'pending':
      default:
        return {
          label: 'Predicted by AI. Not yet confirmed on site.',
          bg: '#eff6ff',
          text: '#1d4ed8',
          border: 'rgba(29, 78, 216, 0.3)',
          icon: <HelpCircle size={13} />
        };
    }
  };

  const statusChip = getStatusChip();

  // Extract top 3 contributing fingerprints
  // Normalize fingerprints to array of keys
  const topFpKeys = (Array.isArray(fingerprints) ? fingerprints : [])
    .map((fp) => (typeof fp === 'string' ? fp : fp.key || fp.id || fp.name))
    .filter(Boolean)
    .slice(0, 3);

  // If none given, fallback to standard key matching severity
  const activeFpKeys = topFpKeys.length > 0
    ? topFpKeys
    : (severity.key === 'critical' || severity.key === 'high' ? ['flatline', 'limit_hugging'] : ['drift']);

  // Collect causes and checks from glossary for the active fingerprints
  const innocentCauses = [];
  const tamperingCauses = [];
  const checklistItems = [];

  activeFpKeys.forEach((key) => {
    const term = getTerm(key);
    if (term) {
      if (term.possibleInnocentCauses) innocentCauses.push(...term.possibleInnocentCauses);
      if (term.possibleTamperingCauses) tamperingCauses.push(...term.possibleTamperingCauses);
      if (term.inspectionChecks) checklistItems.push(...term.inspectionChecks);
    }
  });

  // Unique lists capped for readability
  const uniqueInnocent = Array.from(new Set(innocentCauses)).slice(0, 3);
  const uniqueTampering = Array.from(new Set(tamperingCauses)).slice(0, 3);
  const uniqueChecklist = Array.from(new Set(checklistItems)).slice(0, 4);

  // Render Simple Mode
  if (isSimple) {
    return (
      <div className={`rounded-xl border p-5 bg-white shadow-xs space-y-4 ${compact ? 'p-3.5 space-y-3' : ''}`} style={{ borderColor: severity.border }}>
        {/* Header: Severity Band + Status Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}
            >
              <AlertTriangle size={14} />
              <span>{severity.simpleLabel}</span>
            </span>
            <span className="text-xs text-[#727780] font-medium">
              Score: <strong className="text-[#191c1e]">{severity.outOfOne}</strong>
            </span>
          </div>

          {/* Point 6: Status chip always visible in both modes */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
            style={{ backgroundColor: statusChip.bg, color: statusChip.text, borderColor: statusChip.border }}
          >
            {statusChip.icon}
            <span>{statusChip.label}</span>
          </div>
        </div>

        {/* Point 2: What does this mean? */}
        <div className="bg-[#f8f9fb] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1">
          <div className="font-bold text-[#00355f] flex items-center gap-1.5">
            <HelpCircle size={14} />
            <span>What does this mean for an inspecting officer?</span>
          </div>
          <p className="text-[#42474f] leading-relaxed">
            {severity.descriptionSimple} <em>Note: This score is a statistical surveillance warning sign. It does not establish legal proof of deliberate misconduct before physical on-site inspection.</em>
          </p>
        </div>

        {!compact && (
          <>
            {/* Point 3: Why did AI flag it? */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-[#191c1e] flex items-center gap-1.5">
                <Activity size={14} className="text-[#00355f]" />
                <span>Why did the AI flag this facility?</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {activeFpKeys.map((key) => {
                  const term = getTerm(key) || { simple: key, simpleHelp: 'Pattern anomaly' };
                  return (
                    <div key={key} className="p-2.5 bg-[#f0f7ff] border border-[#00355f]/20 rounded-lg flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#00355f] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        !
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#00355f] block">{term.simple}</span>
                        <span className="text-[#5f6368] text-[11px] leading-tight block mt-0.5">{term.simpleHelp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Point 4: Possible Reasons (Innocent vs Tampering) */}
            <div className="space-y-1.5">
              <div className="font-bold text-xs text-[#191c1e]">
                Possible explanations (patterns consistent with):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Innocent Causes */}
                <div className="p-3 bg-[#f8fafc] border border-[#E5E7EB] rounded-lg space-y-1.5">
                  <div className="font-bold text-[#1b6d24] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    <span>Possible Innocent Causes</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#42474f] text-[11px]">
                    {uniqueInnocent.length > 0 ? (
                      uniqueInnocent.map((cause, idx) => <li key={idx}>{cause}</li>)
                    ) : (
                      <li>Routine equipment washdown or expected operational shift downtime</li>
                    )}
                  </ul>
                </div>

                {/* Tampering Causes */}
                <div className="p-3 bg-[#fff8f8] border border-[#D32F2F]/20 rounded-lg space-y-1.5">
                  <div className="font-bold text-[#b91c1c] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <ShieldAlert size={12} />
                    <span>Possible Tampering Causes</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#42474f] text-[11px]">
                    {uniqueTampering.length > 0 ? (
                      uniqueTampering.map((cause, idx) => <li key={idx}>{cause}</li>)
                    ) : (
                      <li>Sensor held in fresh tap water or selective data disconnection</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Point 5: What should the inspector check? */}
            <div className="space-y-1.5">
              <div className="font-bold text-xs text-[#00355f] flex items-center gap-1.5">
                <ClipboardCheck size={14} />
                <span>Recommended On-Site Verification Steps:</span>
              </div>
              <div className="space-y-1">
                {uniqueChecklist.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#42474f] bg-[#f8f9fb] p-2 rounded border border-[#E5E7EB]">
                    <span className="font-bold text-[#00355f] shrink-0">{idx + 1}.</span>
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Point 7: See technical details expander */}
        <TechDetails title="See technical model scores & engineering parameters">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-bold text-[#191c1e]">Model: {modelName}</p>
              <p className="text-[11px] text-[#727780]">Version: {modelVersion}</p>
              <p className="mt-1 text-[#42474f]">
                Normalized Score: <code className="font-mono bg-[#f2f4f6] px-1 py-0.5 rounded">{severity.displayScore}</code>
              </p>
            </div>
            {modelBreakdown && (
              <div className="space-y-1">
                <p className="font-bold text-[#191c1e]">Ensemble Weight Breakdown:</p>
                <div className="text-[11px] text-[#42474f] space-y-0.5">
                  <div>Fingerprint Engine (67.5%): {modelBreakdown.fingerprints?.contribution ?? 'N/A'} pts</div>
                  <div>Isolation Forest (22.5%): {modelBreakdown.isolation_forest?.contribution ?? 'N/A'} pts</div>
                  <div>Tamper Model (10.0%): {modelBreakdown.tamper_model?.contribution ?? 'N/A'} pts</div>
                </div>
              </div>
            )}
          </div>
        </TechDetails>
      </div>
    );
  }

  // Render Technical Mode
  return (
    <div className="rounded-xl border border-[#00355f]/30 p-5 bg-white shadow-xs space-y-4">
      {/* Header: Technical Anomaly Score & Model Version */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}
            >
              τ = {severity.displayScore}
            </span>
            <span className="text-xs font-bold text-[#00355f]">{severity.technicalLabel}</span>
          </div>
          <p className="text-[11px] text-[#727780] font-mono mt-0.5">
            Model: {modelName} (frozen: {modelVersion})
          </p>
        </div>

        {/* Status chip */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
          style={{ backgroundColor: statusChip.bg, color: statusChip.text, borderColor: statusChip.border }}
        >
          {statusChip.icon}
          <span>{statusChip.label}</span>
        </div>
      </div>

      {/* Technical Statistical Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg">
          <span className="font-bold text-[#191c1e] flex items-center gap-1.5 mb-1">
            <Cpu size={14} className="text-[#00355f]" />
            Feature Engineering
          </span>
          <p className="text-[11px] text-[#727780] leading-tight">
            Past-only causal Median Absolute Deviation (MAD) expanding window. No future data leakage.
          </p>
        </div>

        <div className="p-3 bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg">
          <span className="font-bold text-[#191c1e] flex items-center gap-1.5 mb-1">
            <Layers size={14} className="text-[#00355f]" />
            SHAP Contribution
          </span>
          <p className="text-[11px] text-[#727780] leading-tight">
            Triggered Fingerprints: {activeFpKeys.length} / 8 active heuristic triggers evaluated.
          </p>
        </div>

        <div className="p-3 bg-[#f8f9fb] border border-[#E5E7EB] rounded-lg">
          <span className="font-bold text-[#191c1e] flex items-center gap-1.5 mb-1">
            <Activity size={14} className="text-[#00355f]" />
            Operating Budget
          </span>
          <p className="text-[11px] text-[#727780] leading-tight">
            Calibrated cutoff budget: 1.0 alert / factory-month under Stage 2 LOFO protocol.
          </p>
        </div>
      </div>

      {/* Triggered Fingerprint List */}
      <div className="space-y-1.5">
        <div className="font-bold text-xs text-[#191c1e]">Active Heuristic Signal Triggers:</div>
        <div className="space-y-1">
          {activeFpKeys.map((key) => {
            const term = getTerm(key) || { technical: key, name: key };
            return (
              <div key={key} className="flex items-center justify-between p-2 bg-[#f8f9fb] border border-[#E5E7EB] rounded text-xs font-mono">
                <span className="text-[#00355f] font-bold">{term.technical}</span>
                <span className="text-[11px] text-[#727780]">Threshold Exceeded</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
