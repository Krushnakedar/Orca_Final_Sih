import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

export default function RiskAuditViewer({ riskAssessment }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!riskAssessment) return null;

  const {
    riskScore = 24,
    riskLevel = "LOW",
    confidenceScore = 94,
    isOverride = false,
    overrideReason = null,
    vesselProfile = {},
    primaryFactors = [],
    triggeredRules = [],
    safetyDirectives = [],
  } = riskAssessment;

  const levelColors = {
    LOW: {
      badge: "bg-emerald-950 border-emerald-800 text-emerald-300",
      text: "text-emerald-400",
      bar: "bg-emerald-500",
    },
    MODERATE: {
      badge: "bg-amber-950 border-amber-800 text-amber-300",
      text: "text-amber-400",
      bar: "bg-amber-500",
    },
    HIGH: {
      badge: "bg-rose-950 border-rose-800 text-rose-300",
      text: "text-rose-400",
      bar: "bg-rose-500",
    },
    CRITICAL: {
      badge: "bg-red-950 border-red-700 text-red-200 animate-pulse",
      text: "text-red-400",
      bar: "bg-red-600",
    },
  };

  const style = levelColors[riskLevel] || levelColors.LOW;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden text-xs shadow-lg space-y-0">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${style.badge}`}>
            {riskLevel === "CRITICAL" || riskLevel === "HIGH" ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">
                Deterministic Risk Engine
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${style.badge}`}
              >
                {riskLevel} RISK
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pure rule-based threshold evaluation &bull; Zero LLM hallucination
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-xl font-black ${style.text}`}>
              {riskScore}{" "}
              <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Confidence: {confidenceScore}%
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Inspect Triggered Rules"
            aria-label={isOpen ? "Collapse rule audit" : "Expand rule audit"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Override Warning (if critical) */}
      {isOverride && (
        <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Critical Safety Override Active:</strong> {overrideReason}
          </span>
        </div>
      )}

      {/* Expandable Rule Audit Table */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-slate-950 border-t border-slate-900">
          {/* Primary Factors Summary */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Primary Contributing Risk Factors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {primaryFactors.map((factor, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium"
                >
                  &bull; {factor}
                </span>
              ))}
            </div>
          </div>

          {/* Triggered Rules Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Triggered Boundary Rules Audit Trail ({triggeredRules.length}{" "}
              Rules):
            </span>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Rule Factor</th>
                    <th className="py-2 px-3">Measured Telemetry</th>
                    <th className="py-2 px-3">Sub-Score</th>
                    <th className="py-2 px-3">Weight</th>
                    <th className="py-2 px-3">Severity</th>
                    <th className="py-2 px-3">Actionable Advisory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {triggeredRules.map((rule, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {rule.factor}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-ocean-300 whitespace-nowrap">
                        {rule.measuredValue}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {rule.subScore}/100
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {rule.weight}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                            rule.severity === "CRITICAL"
                              ? "bg-red-950 border-red-800 text-red-300"
                              : rule.severity === "HIGH"
                                ? "bg-rose-950 border-rose-800 text-rose-300"
                                : rule.severity === "MODERATE"
                                  ? "bg-amber-950 border-amber-800 text-amber-300"
                                  : "bg-emerald-950 border-emerald-800 text-emerald-300"
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs leading-relaxed">
                        {rule.advisory}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Directives */}
          {safetyDirectives.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Operational Directives for Vessel Master:</span>
              </span>
              <ul className="space-y-1 text-slate-300 pl-4 list-disc text-xs">
                {safetyDirectives.map((d, dIdx) => (
                  <li key={dIdx}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Golden Rule Footer */}
          <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <span>
              Evaluated on:{" "}
              {new Date(
                riskAssessment.evaluatedAt || Date.now(),
              ).toLocaleTimeString()}
            </span>
            <span className="font-mono text-tealAccent-400">
              WMO-522 &bull; INCOIS-OSF Standard Compliance
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
