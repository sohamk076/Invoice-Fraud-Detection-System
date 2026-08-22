import React, { useState } from 'react';
import { FraudRuleResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ShieldCheck, AlertCircle, AlertTriangle, AlertOctagon, Search, Filter, Tag } from 'lucide-react';

interface RuleResultsListProps {
  rules: FraudRuleResult[];
}

export const RuleResultsList: React.FC<RuleResultsListProps> = ({ rules }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['ALL', ...Array.from(new Set(rules.map((r) => r.ruleCategory || 'GENERAL')))];

  const filteredRules = rules.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && (r.ruleCategory || 'GENERAL') !== filterCategory) return false;
    if (
      searchQuery &&
      !r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.details || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.ruleCategory || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const availableStatuses = ['ALL', 'CRITICAL', 'FAIL', 'WARNING', 'PASS'];
  if (rules.some((r) => r.status === 'NOT_CHECKED')) {
    availableStatuses.push('NOT_CHECKED');
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {availableStatuses.map((status) => {
            const count =
              status === 'ALL'
                ? rules.length
                : rules.filter((r) => r.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    filterStatus === status ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category & Search inputs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {categories.length > 2 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20 rules..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Rules List Cards */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          let cardBorder = 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70';
          let icon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;

          if (rule.status === 'CRITICAL') {
            cardBorder = 'border-red-900/60 bg-red-950/20 hover:bg-red-950/30';
            icon = <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />;
          } else if (rule.status === 'FAIL') {
            cardBorder = 'border-orange-900/60 bg-orange-950/20 hover:bg-orange-950/30';
            icon = <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />;
          } else if (rule.status === 'WARNING') {
            cardBorder = 'border-amber-900/60 bg-amber-950/20 hover:bg-amber-950/30';
            icon = <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={rule.id || rule.ruleCode}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${cardBorder} space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800/70 shrink-0 mt-0.5 sm:mt-0">{icon}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {rule.ruleCode}
                      </span>
                      {rule.ruleCategory && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                          {rule.ruleCategory}
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-semibold text-slate-100 mt-0.5">
                      {rule.ruleName}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {rule.scoreContribution > 0 ? (
                    <span className="text-xs font-mono font-bold text-red-400 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/50">
                      +{rule.scoreContribution} penalty pts
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50">
                      0 pts
                    </span>
                  )}
                  <StatusBadge status={rule.status} size="sm" />
                </div>
              </div>

              {rule.details && (
                <p className="text-xs text-slate-300 pl-0 sm:pl-10 leading-relaxed font-medium">
                  {rule.details}
                </p>
              )}

              {(rule.detectedValue || rule.expectedValue) && (
                <div className="sm:ml-10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {rule.detectedValue && (
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Detected / Actual Value:</span>
                      <span className="font-mono text-slate-200 font-bold break-all">
                        {rule.detectedValue}
                      </span>
                    </div>
                  )}
                  {rule.expectedValue && (
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Statutory / Expected Benchmark:</span>
                      <span className="font-mono text-emerald-400 font-bold break-all">
                        {rule.expectedValue}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredRules.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
            No rules found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};
