import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { analyticsService } from '../services/analytics.service';
import { vendorService } from '../services/vendor.service';
import { DashboardStats, MonthlyTrend, VendorRiskRanking, Vendor } from '../types';
import { formatINR, formatCompactINR, formatDateIndian } from '../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Building2,
  PieChart as PieIcon,
  Percent,
  IndianRupee,
  ChevronRight,
  Filter,
  Copy,
  Calculator,
  FileCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [vendorMatrix, setVendorMatrix] = useState<VendorRiskRanking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter States
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [statsData, trendsData, matrixData, vendorsData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getFraudTrends(),
          analyticsService.getVendorRiskMatrix(),
          vendorService.getVendors({ limit: 50 }).catch(() => ({ data: [] })),
        ]);
        setStats(statsData);
        setTrends(trendsData);
        setVendorMatrix(matrixData);
        setVendors(vendorsData.data || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading || !stats) {
    return <LoadingSpinner fullHeight label="Generating forensic financial analytics & risk models..." />;
  }

  const pieData = [
    { name: 'Low Risk (0-24)', value: stats.riskDistribution.low, color: '#10b981' },
    { name: 'Medium Risk (25-49)', value: stats.riskDistribution.medium, color: '#f59e0b' },
    { name: 'High Risk (50-74)', value: stats.riskDistribution.high, color: '#f97316' },
    { name: 'Critical Risk (75-100)', value: stats.riskDistribution.critical, color: '#ef4444' },
  ];

  const statusData = stats.statusDistribution
    ? [
        { name: 'Verified', count: stats.statusDistribution.verified, fill: '#10b981' },
        { name: 'Pending', count: stats.statusDistribution.pending, fill: '#3b82f6' },
        { name: 'Suspicious', count: stats.statusDistribution.suspicious, fill: '#f59e0b' },
        { name: 'Flagged Fraud', count: stats.statusDistribution.flaggedFraud, fill: '#ef4444' },
        { name: 'Rejected', count: stats.statusDistribution.rejected, fill: '#64748b' },
      ]
    : [];

  const duplicateRate = stats.totalInvoices > 0 ? (((stats.categoryStats?.duplicateCount || 0) / stats.totalInvoices) * 100).toFixed(1) : '0';
  const taxMismatchRate = stats.totalInvoices > 0 ? (((stats.categoryStats?.taxMismatchCount || 0) / stats.totalInvoices) * 100).toFixed(1) : '0';
  const poMismatchRate = stats.totalInvoices > 0 ? (((stats.categoryStats?.poMismatchCount || 0) / stats.totalInvoices) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Fraud & Financial Analytics"
        subtitle="Forensic patterns, monthly transaction volume trends, and supplier risk ranking matrix"
        breadcrumbs={[{ label: 'Analytics' }]}
      />

      {/* Forensic Discrepancy Rate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Overall Fraud Rate</span>
            <Percent className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-extrabold text-red-400 block">{stats.fraudRate}%</span>
          <span className="text-[11px] text-slate-500 font-sans block">{stats.riskDistribution.high + stats.riskDistribution.critical} of {stats.totalInvoices} flagged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Duplicate Invoice Rate</span>
            <Copy className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-purple-400 block">{duplicateRate}%</span>
          <span className="text-[11px] text-slate-500 font-sans block">{stats.categoryStats?.duplicateCount || 0} duplicate invoices</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>GST Tax Mismatch Rate</span>
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-blue-400 block">{taxMismatchRate}%</span>
          <span className="text-[11px] text-slate-500 font-sans block">{stats.categoryStats?.taxMismatchCount || 0} tax mismatch invoices</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>PO Discrepancy Rate</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400 block">{poMismatchRate}%</span>
          <span className="text-[11px] text-slate-500 font-sans block">{stats.categoryStats?.poMismatchCount || 0} PO mismatch invoices</span>
        </div>
      </div>

      {/* Top 2 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Invoiced Value vs Amount at Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              Monthly Invoiced Value vs. Amount at Risk (₹ INR)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of total billing volume versus flagged suspicious capital
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
                <Bar dataKey="totalValue" name="Total Invoiced (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="amountAtRisk" name="Amount at Risk (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Invoice Volume by Risk Classification */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Monthly Volume by Audit Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Count of clean, suspicious, and confirmed fraudulent invoices
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
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
                <Bar dataKey="cleanInvoices" name="Clean / Low Risk" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="suspiciousInvoices" name="Suspicious (Medium)" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fraudulentInvoices" name="High / Critical Fraud" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Row: Risk Tier Donut & Status Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Invoice Risk Tier Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Portfolio split by deterministic fraud score thresholds
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
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

        {/* Invoice Status Distribution Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Invoice Status Distribution Pipeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current operational invoice lifecycle statuses
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 20, left: 50, bottom: 5 }}>
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
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 9: Vendor Risk Analytics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Supplier & Vendor Forensic Risk Ranking Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies high-risk supplier entities based on historical violations, fraud flags, and average invoice score
            </p>
          </div>
          <Link
            to="/vendors"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Suppliers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 font-sans">
                <th className="py-3 px-4">Vendor Master</th>
                <th className="py-3 px-4">State & GSTIN</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4 text-right">Invoices</th>
                <th className="py-3 px-4 text-right">Total Billed (₹)</th>
                <th className="py-3 px-4 text-right">Fraud Flags</th>
                <th className="py-3 px-4 text-right">Avg Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {vendorMatrix.map((v) => {
                const isHighRisk = v.fraudFlagCount > 0 || v.averageFraudScore >= 40;

                return (
                  <tr
                    key={v.id}
                    className={`transition-colors ${
                      isHighRisk
                        ? 'bg-red-950/20 hover:bg-red-950/30'
                        : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      <div className="flex items-center gap-2">
                        {isHighRisk && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        )}
                        <span>{v.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{v.state}</div>
                      <div className="text-[11px] text-slate-400">{v.gstin}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {v.isVerified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{v.totalInvoices}</td>
                    <td className="py-3 px-4 text-right text-slate-100 font-bold">
                      {formatINR(v.totalBilled)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.fraudFlagCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-red-400 bg-red-950 border border-red-800">
                          {v.fraudFlagCount} flags
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={v.averageFraudScore >= 40 ? 'text-red-400' : 'text-emerald-400'}>
                        {v.averageFraudScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Link
                        to={`/vendors/${v.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
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
