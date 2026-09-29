import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Anchor,
  Wind,
  Waves,
  Eye,
  Zap,
  Info
} from 'lucide-react';

export default function RiskAuditViewer({ riskAssessment }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!riskAssessment) return null;

  const {
    riskScore = 24,
    riskLevel = 'LOW',
    confidenceScore = 94,
    isOverride = false,
    overrideReason = null,
    vesselProfile = {},
    primaryFactors = [],
    triggeredRules = [],
    safetyDirectives = []
  } = riskAssessment;

  const levelColors = {
    LOW: {
      badge: 'bg-success-surface border-success/40 text-success',
      text: 'text-success',
      bar: 'bg-success'
    },
    MODERATE: {
      badge: 'bg-warning-surface border-warning/40 text-warning',
      text: 'text-warning',
      bar: 'bg-warning'
    },
    HIGH: {
      badge: 'bg-danger-surface border-danger/40 text-danger',
      text: 'text-danger',
      bar: 'bg-danger'
    },
    CRITICAL: {
      badge: 'bg-danger-surface border-danger/60 text-danger animate-pulse',
      text: 'text-danger',
      bar: 'bg-danger'
    }
  };

  const style = levelColors[riskLevel] || levelColors.LOW;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden text-xs shadow-lg space-y-0">
      {/* Top Banner */}
      <div className="p-4 bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${style.badge}`}>
            {riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">Deterministic Risk Engine</span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${style.badge}`}>
                {riskLevel} RISK
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Pure rule-based threshold evaluation &bull; Zero LLM hallucination</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-xl font-black ${style.text}`}>
              {riskScore} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">Confidence: {confidenceScore}%</div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-surface-tertiary hover:bg-muted text-foreground transition"
            title="Inspect Triggered Rules"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Override Warning (if critical) */}
      {isOverride && (
        <div className="p-3 bg-danger-surface border-b border-danger/30 text-danger text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>Critical Safety Override Active:</strong> {overrideReason}</span>
        </div>
      )}

      {/* Expandable Rule Audit Table */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-surface border-t border-border">
          {/* Primary Factors Summary */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Primary Contributing Risk Factors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {primaryFactors.map((factor, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-foreground text-[11px] font-medium"
                >
                  &bull; {factor}
                </span>
              ))}
            </div>
          </div>

          {/* Triggered Rules Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
              Triggered Boundary Rules Audit Trail ({triggeredRules.length} Rules):
            </span>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface-secondary">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-surface-tertiary text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Rule Factor</th>
                    <th className="py-2 px-3">Measured Telemetry</th>
                    <th className="py-2 px-3">Sub-Score</th>
                    <th className="py-2 px-3">Weight</th>
                    <th className="py-2 px-3">Severity</th>
                    <th className="py-2 px-3">Actionable Advisory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans">
                  {triggeredRules.map((rule, rIdx) => (
                    <tr key={rIdx} className="hover:bg-surface-tertiary transition">
                      <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                        {rule.factor}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">
                        {rule.measuredValue}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {rule.subScore}/100
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {rule.weight}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                          rule.severity === 'CRITICAL' ? 'bg-danger-surface border-danger/40 text-danger' :
                          rule.severity === 'HIGH'     ? 'bg-danger-surface border-danger/30 text-danger' :
                          rule.severity === 'MODERATE' ? 'bg-warning-surface border-warning/40 text-warning' :
                          'bg-success-surface border-success/40 text-success'
                        }`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs leading-relaxed">
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
            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-1.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Operational Directives for Vessel Master:</span>
              </span>
              <ul className="space-y-1 text-muted-foreground pl-4 list-disc text-xs">
                {safetyDirectives.map((d, dIdx) => (
                  <li key={dIdx}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Golden Rule Footer */}
          <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Evaluated on: {new Date(riskAssessment.evaluatedAt || Date.now()).toLocaleTimeString()}</span>
            <span className="font-mono text-accent">WMO-522 &bull; INCOIS-OSF Standard Compliance</span>
          </div>
        </div>
      )}
    </div>
  );
}
