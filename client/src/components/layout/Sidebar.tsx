import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  UploadCloud,
  Building2,
  AlertTriangle,
  BarChart3,
  FileText,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fraudService } from '../../services/fraud.service';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user, logout, hasRole } = useAuth();
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await fraudService.getAlerts({ status: 'OPEN', limit: 1 });
        setOpenAlertsCount(res.pagination.total);
      } catch {
        // Ignore network errors in background polling
      }
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Invoices', path: '/invoices', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { label: 'Upload Invoice', path: '/invoices/upload', icon: <UploadCloud className="w-4 h-4" /> },
    { label: 'Vendors', path: '/vendors', icon: <Building2 className="w-4 h-4" /> },
    {
      label: 'Fraud Alerts',
      path: '/alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
    },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Reports', path: '/reports', icon: <FileText className="w-4 h-4" /> },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: <History className="w-4 h-4" />,
      roles: ['ADMIN', 'AUDITOR'] as const,
    },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950 border-r border-slate-850 flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
                  FRAUDSHIELD
                </h1>
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">
                  India AP Audit
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            if (item.roles && !hasRole(item.roles as any)) return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-850 bg-slate-950/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-850">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {user?.role || 'FINANCE'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
