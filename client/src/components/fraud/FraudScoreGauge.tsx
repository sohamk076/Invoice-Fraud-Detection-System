import React from 'react';
import { RiskLevel } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FraudScoreGaugeProps {
  score: number;
  riskLevel: RiskLevel | string;
  summaryExplanation?: string | null;
  passedCount?: number;
  warningCount?: number;
  failedCount?: number;
  criticalCount?: number;
  totalRulesCount?: number;
  riskContribution?: number;
}

export const FraudScoreGauge: React.FC<FraudScoreGaugeProps> = ({
  score,
  riskLevel,
  summaryExplanation,
  passedCount = 0,
  warningCount = 0,
  failedCount = 0,
  criticalCount = 0,
  totalRulesCount,
  riskContribution,
}) => {
  const normLevel = (riskLevel || 'LOW').toUpperCase();
  const totalEvaluated = totalRulesCount || (passedCount + warningCount + failedCount + criticalCount) || 20;
  const computedContribution = riskContribution !== undefined ? riskContribution : score;

  // Tier Colors and Explanations
  let ringColor = 'text-emerald-500 stroke-emerald-500';
  let bgColor = 'bg-emerald-950/20 border-emerald-900/30';
  let badgeColor = 'text-emerald-400';
  let verdictTitle = 'LOW RISK (Clean / Verified Transaction)';
  let tierMeaning = 'No critical anomalies or severe discrepancies detected. Valid GST and mathematical cross-checks contribute 0 penalty points.';

  if (normLevel === 'CRITICAL') {
    ringColor = 'text-red-500 stroke-red-500';
    bgColor = 'bg-red-950/20 border-red-900/50';
    badgeColor = 'text-red-400';
    verdictTitle = 'CRITICAL FRAUD RISK (Strong Fraud Indicators)';
    tierMeaning = 'Severe violations detected such as fake GSTIN checksum, duplicate invoice cloning, future dating, or PO vendor mismatch. Immediate block recommended.';
  } else if (normLevel === 'HIGH') {
    ringColor = 'text-orange-500 stroke-orange-500';
    bgColor = 'bg-orange-950/20 border-orange-900/50';
    badgeColor = 'text-orange-400';
    verdictTitle = 'HIGH FRAUD RISK (Manual Forensic Audit Required)';
    tierMeaning = 'Significant discrepancies detected such as intra-state CGST ≠ SGST asymmetry, PO limit overrun >5%, abnormal historical spikes, or GSTIN-PAN mismatch.';
  } else if (normLevel === 'MEDIUM') {
    ringColor = 'text-amber-500 stroke-amber-500';
    bgColor = 'bg-amber-950/20 border-amber-900/50';
    badgeColor = 'text-amber-400';
    verdictTitle = 'MEDIUM RISK (Minor Anomalies / Review Items)';
    tierMeaning = 'Minor review indicators detected such as unverified supplier billing, round amounts with zero GST, missing HSN/SAC, or stale invoice submission.';
  }

  // SVG Circular Gauge calculation
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className={`border rounded-3xl p-6 sm:p-7 shadow-lg transition-all ${bgColor} space-y-5`}>
      <div className="flex flex-col lg:flex-row items-center gap-7">
        {/* Left: Circular Score Gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-800/80"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Animated Score Value Ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={`${ringColor} transition-all duration-1000 ease-out`}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Score / 100
            </span>
          </div>
        </div>

        {/* Center/Right: Risk Tier Details & Rules Overview */}
        <div className="flex-1 space-y-3.5 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <h4 className={`text-base sm:text-lg font-extrabold tracking-tight ${badgeColor}`}>
              {verdictTitle}
            </h4>
            <RiskBadge level={normLevel} score={score} size="md" />
          </div>

          <p className="text-xs text-slate-200 leading-relaxed max-w-2xl font-medium">
            {summaryExplanation || tierMeaning}
          </p>

          {/* Risk Level Threshold Spectrum Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">LOW (0–24)</span>
              <span className="text-amber-400 font-bold">MEDIUM (25–49)</span>
              <span className="text-orange-400 font-bold">HIGH (50–74)</span>
              <span className="text-red-400 font-bold">CRITICAL (75–100)</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden flex border border-slate-800">
              <div className="w-1/4 bg-emerald-500/40 border-r border-slate-900" />
              <div className="w-1/4 bg-amber-500/40 border-r border-slate-900" />
              <div className="w-1/4 bg-orange-500/40 border-r border-slate-900" />
              <div className="w-1/4 bg-red-500/40" />
            </div>
          </div>

          {/* Rule Evaluation Summary Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              {totalEvaluated} Total Rules Evaluated
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {passedCount} Passed (0 pts)
            </span>
            {warningCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-amber-950/70 border border-amber-800/50 text-amber-300 font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {warningCount} Warnings
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-orange-950/70 border border-orange-800/50 text-orange-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {failedCount} Violations
              </span>
            )}
            {criticalCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-red-950/90 border border-red-800/80 text-red-300 font-bold flex items-center gap-1.5 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5" />
                {criticalCount} Critical Flags
              </span>
            )}
            {computedContribution > 0 && (
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-red-900/60 text-red-400 font-bold font-mono">
                Risk Penalty: +{computedContribution} pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
