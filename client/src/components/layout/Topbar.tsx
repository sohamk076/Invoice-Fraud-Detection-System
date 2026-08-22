import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { fraudService } from '../../services/fraud.service';
import { FraudAlert } from '../../types';
import { formatINR, formatDateTimeIndian } from '../../utils/formatters';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Upload,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<FraudAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const res = await fraudService.getAlerts({ status: 'OPEN', limit: 5 });
        setRecentAlerts(res.data);
        setUnreadCount(res.data.length);
      } catch (err) {
        // Silent catch for background notification poll
      }
    };

    fetchRecentAlerts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/invoices?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Global Quick Search Form */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full hidden sm:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Global search (Invoice #, Vendor, or GSTIN)..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Quick Upload Action */}
        <Link
          to="/invoices/upload"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Invoice</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Real-time Notification Center Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            title="Fraud Alert Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono font-bold text-[10px] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-scale-up space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs">Compliance Notifications</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60">
                  {unreadCount} Open Alerts
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-800/60">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(alert.invoice ? `/invoices/${alert.invoice.id}` : '/alerts');
                      }}
                      className="pt-2 first:pt-0 cursor-pointer hover:bg-slate-850/50 p-2 rounded-xl transition-colors space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[200px] flex items-center gap-1.5">
                          {alert.severity === 'CRITICAL' ? (
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          )}
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {formatDateTimeIndian(alert.createdAt).split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{alert.description}</p>
                      {alert.invoice && (
                        <div className="text-[11px] text-blue-400 font-mono">
                          {alert.invoice.invoiceNumber} • {formatINR(alert.invoice.grandTotal)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    No open alerts requiring attention
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 w-full justify-center py-1"
                >
                  <span>View All Alerts Center</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden md:inline pr-1">
              {user?.name?.split(' ')[0] || 'Account'}
            </span>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up"
              onClick={() => setShowProfileMenu(false)}
            >
              <div className="p-2.5 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                  {user?.role}
                </span>
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile & Settings</span>
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
