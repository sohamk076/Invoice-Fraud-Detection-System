import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Building,
  ShieldAlert,
  Bell,
  Sun,
  Moon,
  Monitor,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'COMPANY' | 'FRAUD_RULES' | 'PREFERENCES'>('PROFILE');

  // Form states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+91 98201 55443');
  const [profileDept, setProfileDept] = useState(user?.department || 'Forensic Audit');

  // Company state
  const [companyName, setCompanyName] = useState('Bharat Financial Enterprises Pvt Ltd');
  const [corporateGstin, setCorporateGstin] = useState('27AAACG1234F1Z5');
  const [corporatePan, setCorporatePan] = useState('AAACG1234F');
  const [companyState, setCompanyState] = useState('Maharashtra (27)');

  // Fraud threshold settings
  const [poThreshold, setPoThreshold] = useState(50000);
  const [poTolerance, setPoTolerance] = useState(5);
  const [spikeMultiplier, setSpikeMultiplier] = useState(3.0);
  const [staleDays, setStaleDays] = useState(180);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configuration preferences saved successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings & Audit Parameters"
        subtitle="Manage user credentials, corporate GST identities, and fraud scoring sensitivity thresholds"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {[
            { id: 'PROFILE', label: 'User Profile', icon: <User className="w-4 h-4" /> },
            { id: 'COMPANY', label: 'Corporate Entity & GST', icon: <Building className="w-4 h-4" /> },
            { id: 'FRAUD_RULES', label: 'Detection Thresholds', icon: <ShieldAlert className="w-4 h-4" /> },
            { id: 'PREFERENCES', label: 'Appearance & Alerts', icon: <Bell className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Panel */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* 1. Profile Tab */}
            {activeTab === 'PROFILE' && (
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Auditor Profile Information</h3>
                  <p className="text-xs text-slate-400">Update personal credentials and department assignment</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Assigned Role</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="w-full p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-blue-400 font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      value={profileDept}
                      onChange={(e) => setProfileDept(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. Company Tab */}
            {activeTab === 'COMPANY' && (
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Corporate Identity & GST Setup</h3>
                  <p className="text-xs text-slate-400">Configured purchaser information for place-of-supply cross verification</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Company Legal Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Registered State & Code</label>
                    <input
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Corporate GSTIN (15 Digits)</label>
                    <input
                      type="text"
                      value={corporateGstin}
                      onChange={(e) => setCorporateGstin(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-blue-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1">Corporate PAN</label>
                    <input
                      type="text"
                      value={corporatePan}
                      onChange={(e) => setCorporatePan(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Update Corporate Profile</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. Fraud Rules Sensitivity Tab */}
            {activeTab === 'FRAUD_RULES' && (
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Deterministic Scoring Sensitivity</h3>
                  <p className="text-xs text-slate-400">Configure financial tolerances and anomaly thresholds</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Mandatory PO Threshold (₹)</span>
                      <span className="text-slate-400">Invoices exceeding this amount require a registered PO</span>
                    </div>
                    <input
                      type="number"
                      value={poThreshold}
                      onChange={(e) => setPoThreshold(Number(e.target.value))}
                      className="w-32 p-2 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white"
                    />
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Purchase Order Overrun Tolerance (%)</span>
                      <span className="text-slate-400">Maximum allowed billing percentage above authorized PO value</span>
                    </div>
                    <input
                      type="number"
                      value={poTolerance}
                      onChange={(e) => setPoTolerance(Number(e.target.value))}
                      className="w-32 p-2 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white"
                    />
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Historical Vendor Spike Multiplier</span>
                      <span className="text-slate-400">Triggers ANO-01 if invoice exceeds mean by this factor</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={spikeMultiplier}
                      onChange={(e) => setSpikeMultiplier(Number(e.target.value))}
                      className="w-32 p-2 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white"
                    />
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">Stale Invoice Lag (Days)</span>
                      <span className="text-slate-400">Flag for manual review (5 pts warning) if older than this limit</span>
                    </div>
                    <input
                      type="number"
                      value={staleDays}
                      onChange={(e) => setStaleDays(Number(e.target.value))}
                      className="w-32 p-2 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Apply Sensitivity Parameters</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. Preferences Tab */}
            {activeTab === 'PREFERENCES' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Appearance & Theme Customization</h3>
                  <p className="text-xs text-slate-400">Choose your preferred visual presentation style for the audit portal</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Interface Theme Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Option 1: Light Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('light');
                          toast.success('Switched to Light Fintech Theme.');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all relative ${
                          theme === 'light'
                            ? 'bg-blue-600/10 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                            <Sun className="w-5 h-5" />
                          </div>
                          {theme === 'light' && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 mb-0.5">Light Mode</h4>
                        <p className="text-[11px] text-slate-400">
                          Crisp white fintech theme with high contrast readability.
                        </p>
                      </button>

                      {/* Option 2: Dark Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('dark');
                          toast.success('Switched to Dark Forensic Theme.');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all relative ${
                          theme === 'dark'
                            ? 'bg-blue-600/10 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Moon className="w-5 h-5" />
                          </div>
                          {theme === 'dark' && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 mb-0.5">Dark Mode</h4>
                        <p className="text-[11px] text-slate-400">
                          Deep navy corporate forensic audit command center.
                        </p>
                      </button>

                      {/* Option 3: System Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('system');
                          toast.success(`System preference mode enabled (Current: ${resolvedTheme}).`);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all relative ${
                          theme === 'system'
                            ? 'bg-blue-600/10 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${theme === 'system' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Monitor className="w-5 h-5" />
                          </div>
                          {theme === 'system' && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 mb-0.5">System Default</h4>
                        <p className="text-[11px] text-slate-400">
                          Automatically follows your OS theme setting.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block">Critical Fraud Email Notifications</span>
                      <span className="text-slate-400">Notify forensic audit team instantly when score $\ge 75$</span>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
