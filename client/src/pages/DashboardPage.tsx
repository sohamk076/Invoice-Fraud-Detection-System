import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { analyticsService } from '../services/analytics.service';
import { DashboardStats, MonthlyTrend } from '../types';
import { formatINR, formatCompactINR, formatDateIndian } from '../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  IndianRupee,
  AlertOctagon,
  Percent,
  Clock,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Building2,
  TrendingUp,
  FileCheck,
  Copy,
  Layers,
  FileText,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, trendsData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getFraudTrends(),
        ]);
        setStats(statsData);
        setTrends(trendsData);
      } catch (error) {
        console.error('Failed to load dashboard statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading || !stats) {
    return <LoadingSpinner fullHeight label="Computing real-time fraud risk metrics & analytics..." />;
  }

  // Risk Distribution Data for Pie Chart
  const pieData = [
    { name: 'Low Risk', value: stats.riskDistribution.low, color: '#10b981' },
    { name: 'Medium Risk', value: stats.riskDistribution.medium, color: '#f59e0b' },
    { name: 'High Risk', value: stats.riskDistribution.high, color: '#f97316' },
    { name: 'Critical Risk', value: stats.riskDistribution.critical, color: '#ef4444' },
  ];

  // Status Distribution Bar Data
  const statusData = stats.statusDistribution
    ? [
        { name: 'Verified', count: stats.statusDistribution.verified, fill: '#10b981' },
        { name: 'Pending', count: stats.statusDistribution.pending, fill: '#3b82f6' },
        { name: 'Suspicious', count: stats.statusDistribution.suspicious, fill: '#f59e0b' },
        { name: 'Flagged Fraud', count: stats.statusDistribution.flaggedFraud, fill: '#ef4444' },
        { name: 'Rejected', count: stats.statusDistribution.rejected, fill: '#64748b' },
      ]
    : [];

  const atRiskBreakdown = stats.amountAtRiskBreakdown || {
    highRiskAmount: stats.riskDistribution.highAmount || 0,
    criticalRiskAmount: stats.riskDistribution.criticalAmount || 0,
    duplicateAmount: stats.categoryStats?.duplicateAmount || 0,
    taxMismatchAmount: stats.categoryStats?.taxMismatchAmount || 0,
    poMismatchAmount: stats.categoryStats?.poMismatchAmount || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions */}
      <PageHeader
        title="Executive Fraud Intelligence Command Center"
        subtitle="Real-time Indian GST invoice validation, transaction anomaly detection & forensic risk overview"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/invoices/create"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Manual Entry</span>
            </Link>
            <Link
              to="/invoices/upload"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        }
      />

      {/* 10 Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* 1. Total Invoices */}
        <Link to="/invoices" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Total Invoices"
            value={stats.totalInvoices}
            subtitle="Processed in FY 24-26"
            icon={<FileSpreadsheet className="w-5 h-5 text-blue-400" />}
            variant="blue"
          />
        </Link>

        {/* 2. Total Invoiced Value */}
        <StatCard
          title="Total Invoiced Value"
          value={formatCompactINR(stats.totalInvoiceValue)}
          subtitle={formatINR(stats.totalInvoiceValue)}
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
          variant="success"
        />

        {/* 3. Total Amount at Risk */}
        <Link to="/invoices?riskLevel=CRITICAL" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Total Amount at Risk"
            value={formatCompactINR(stats.totalAmountAtRisk)}
            subtitle={`${stats.riskDistribution.high + stats.riskDistribution.critical} high risk invoices`}
            icon={<AlertOctagon className="w-5 h-5 text-red-400" />}
            variant="danger"
          />
        </Link>

        {/* 4. Fraud Risk Rate */}
        <StatCard
          title="Fraud Risk Rate"
          value={`${stats.fraudRate}%`}
          subtitle={`${stats.riskDistribution.high + stats.riskDistribution.critical} of ${stats.totalInvoices} flagged`}
          icon={<Percent className="w-5 h-5 text-orange-400" />}
          variant="warning"
        />

        {/* 5. Open Fraud Alerts */}
        <Link to="/alerts" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Open Fraud Alerts"
            value={stats.openAlerts}
            subtitle="Require investigation"
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            variant="danger"
          />
        </Link>

        {/* 6. Verified Invoices */}
        <Link to="/invoices?status=VERIFIED" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Verified Invoices"
            value={stats.verifiedInvoices}
            subtitle="Approved for payment"
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            variant="success"
          />
        </Link>

        {/* 7. Suspicious Invoices */}
        <Link to="/invoices?status=SUSPICIOUS" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Suspicious Invoices"
            value={stats.suspiciousInvoices}
            subtitle="Under manual review"
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            variant="warning"
          />
        </Link>

        {/* 8. Critical Risk Invoices */}
        <Link to="/invoices?riskLevel=CRITICAL" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Critical Risk (75-100)"
            value={stats.riskDistribution.critical}
            subtitle="Strong fraud indicators"
            icon={<AlertOctagon className="w-5 h-5 text-red-400" />}
            variant="danger"
          />
        </Link>

        {/* 9. Duplicate Invoices */}
        <StatCard
          title="Duplicate Invoices"
          value={stats.duplicateInvoices || stats.categoryStats?.duplicateCount || 0}
          subtitle={`₹${formatCompactINR(stats.categoryStats?.duplicateAmount || 0)} duplicate capital`}
          icon={<Copy className="w-5 h-5 text-purple-400" />}
          variant="default"
        />

        {/* 10. Pending Reviews */}
        <Link to="/invoices?status=PENDING" className="block transform hover:-translate-y-0.5 transition-transform">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            subtitle="Awaiting compliance signoff"
            icon={<Clock className="w-5 h-5 text-blue-400" />}
            variant="blue"
          />
        </Link>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <span className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-[11px]">
          <Layers className="w-4 h-4 text-blue-400" />
          Executive Quick Actions:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/invoices/upload"
            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800/60 text-blue-300 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Invoice</span>
          </Link>
          <Link
            to="/invoices/create"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Add Invoice Manually</span>
          </Link>
          <Link
            to="/invoices?status=SUSPICIOUS"
            className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/50 text-amber-300 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>View Suspicious Invoices</span>
          </Link>
          <Link
            to="/alerts?severity=CRITICAL"
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-300 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>View Critical Alerts</span>
          </Link>
          <Link
            to="/reports"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>View Reports & Exports</span>
          </Link>
        </div>
      </div>

      {/* Section 5: Prominent Amount at Risk Breakdown */}
      <div className="bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-900 border border-red-900/40 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Capital Exposure & Amount at Risk Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total flagged exposure across HIGH and CRITICAL risk invoices ({stats.riskDistribution.high + stats.riskDistribution.critical} invoices)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Flagged Capital</span>
            <span className="text-2xl font-extrabold font-mono text-red-400">
              {formatINR(stats.totalAmountAtRisk)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-sans text-[11px]">Critical Risk Capital (75-100)</span>
            <span className="text-base font-bold text-red-400 block">
              {formatINR(atRiskBreakdown.criticalRiskAmount)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{stats.riskDistribution.critical} critical invoices</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-sans text-[11px]">High Risk Capital (50-74)</span>
            <span className="text-base font-bold text-orange-400 block">
              {formatINR(atRiskBreakdown.highRiskAmount)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{stats.riskDistribution.high} high risk invoices</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-sans text-[11px]">Duplicate Invoices</span>
            <span className="text-base font-bold text-purple-400 block">
              {formatINR(atRiskBreakdown.duplicateAmount)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{stats.categoryStats?.duplicateCount || 0} duplicate invoices</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-sans text-[11px]">GST / Tax Mismatch</span>
            <span className="text-base font-bold text-blue-400 block">
              {formatINR(atRiskBreakdown.taxMismatchAmount)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{stats.categoryStats?.taxMismatchCount || 0} tax mismatch invoices</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-sans text-[11px]">PO Mismatch / Overruns</span>
            <span className="text-base font-bold text-amber-400 block">
              {formatINR(atRiskBreakdown.poMismatchAmount)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">{stats.categoryStats?.poMismatchCount || 0} PO mismatch invoices</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Monthly Invoiced Volume vs. Capital at Risk
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial trajectory across all monitored quarters (₹ INR)
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => formatCompactINR(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [formatINR(val), '']}
                />
                <Area
                  type="monotone"
                  dataKey="totalValue"
                  name="Total Invoiced Value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="amountAtRisk"
                  name="Amount at Risk"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRisk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Invoice Risk Tier Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Portfolio split by deterministic fraud score
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Risk Distribution Interactive Table & Status Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                Portfolio Risk Classification Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any risk tier to filter and inspect underlying invoices
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{stats.totalInvoices} Invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Invoice Count</th>
                  <th className="py-2.5 px-3 text-right">₹ Amount Exposure</th>
                  <th className="py-2.5 px-3 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr
                  onClick={() => navigate('/invoices?riskLevel=LOW')}
                  className="hover:bg-slate-850/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-sans font-semibold text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    LOW (0–24)
                  </td>
                  <td className="py-3 px-3 text-right text-slate-100 font-bold">{stats.riskDistribution.low}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">{formatINR(stats.riskDistribution.lowAmount || 0)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {stats.totalInvoices > 0 ? ((stats.riskDistribution.low / stats.totalInvoices) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr
                  onClick={() => navigate('/invoices?riskLevel=MEDIUM')}
                  className="hover:bg-slate-850/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-sans font-semibold text-amber-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    MEDIUM (25–49)
                  </td>
                  <td className="py-3 px-3 text-right text-slate-100 font-bold">{stats.riskDistribution.medium}</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-bold">{formatINR(stats.riskDistribution.mediumAmount || 0)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {stats.totalInvoices > 0 ? ((stats.riskDistribution.medium / stats.totalInvoices) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr
                  onClick={() => navigate('/invoices?riskLevel=HIGH')}
                  className="hover:bg-slate-850/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-sans font-semibold text-orange-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    HIGH (50–74)
                  </td>
                  <td className="py-3 px-3 text-right text-slate-100 font-bold">{stats.riskDistribution.high}</td>
                  <td className="py-3 px-3 text-right text-orange-400 font-bold">{formatINR(stats.riskDistribution.highAmount || 0)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {stats.totalInvoices > 0 ? ((stats.riskDistribution.high / stats.totalInvoices) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr
                  onClick={() => navigate('/invoices?riskLevel=CRITICAL')}
                  className="hover:bg-slate-850/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-sans font-semibold text-red-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    CRITICAL (75–100)
                  </td>
                  <td className="py-3 px-3 text-right text-red-400 font-bold">{stats.riskDistribution.critical}</td>
                  <td className="py-3 px-3 text-right text-red-400 font-bold">{formatINR(stats.riskDistribution.criticalAmount || 0)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {stats.totalInvoices > 0 ? ((stats.riskDistribution.critical / stats.totalInvoices) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Audit Status Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current audit workflow distribution
              </p>
            </div>
            <Link to="/invoices" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Invoice Count" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Suspicious Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              Highest Risk Invoices Requiring Investigation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by accumulated deterministic rule violation penalty score (0–100)
            </p>
          </div>
          <Link
            to="/invoices?riskLevel=CRITICAL"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Risky Invoices</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Vendor & GSTIN</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Triggered Rules</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats.recentSuspiciousInvoices.map((inv) => {
                const triggered = (inv.detection as any)?.ruleResults || [];

                return (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{inv.vendor?.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{inv.vendorGstin}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatDateIndian(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-red-400">
                        {inv.fraudScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <RiskBadge level={inv.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {triggered.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {triggered.slice(0, 3).map((r: any) => (
                            <span
                              key={r.ruleCode}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                r.status === 'CRITICAL'
                                  ? 'bg-red-950 text-red-400 border border-red-800/60'
                                  : 'bg-orange-950 text-orange-400 border border-orange-800/60'
                              }`}
                              title={r.ruleName}
                            >
                              {r.ruleCode}
                            </span>
                          ))}
                          {triggered.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{triggered.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs truncate max-w-xs block">
                          {inv.detection?.summaryExplanation || 'Discrepancy detected'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 border border-blue-800/60 text-blue-300 font-semibold rounded-xl transition-colors text-xs inline-flex items-center gap-1"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
