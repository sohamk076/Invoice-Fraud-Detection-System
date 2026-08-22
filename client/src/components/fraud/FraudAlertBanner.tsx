import React, { useState } from 'react';
import { FraudAlert, AlertStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { fraudService } from '../../services/fraud.service';
import { formatDateTimeIndian } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  AlertOctagon,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Edit3,
} from 'lucide-react';

interface FraudAlertBannerProps {
  alerts?: FraudAlert[];
  invoiceId: string;
  onAlertUpdated?: () => void;
}

export const FraudAlertBanner: React.FC<FraudAlertBannerProps> = ({
  alerts = [],
  invoiceId,
  onAlertUpdated,
}) => {
  const { hasRole, user } = useAuth();
  const toast = useToast();
  const isAuditorOrAdmin = hasRole(['ADMIN', 'AUDITOR']);

  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [targetStatus, setTargetStatus] = useState<AlertStatus>('IN_REVIEW');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const handleOpenActionModal = (alert: FraudAlert, status: AlertStatus) => {
    setSelectedAlert(alert);
    setTargetStatus(status);
    setResolutionNotes(alert.resolutionNotes || '');
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      setIsUpdating(true);
      await fraudService.updateAlert(selectedAlert.id, {
        status: targetStatus,
        resolutionNotes,
        assignedToId: selectedAlert.assignedToId || user?.id,
      });

      toast.success(`Fraud alert status updated to "${targetStatus}".`);
      setSelectedAlert(null);
      if (onAlertUpdated) onAlertUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update fraud alert.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'CRITICAL';
        const isResolved = alert.status === 'RESOLVED' || alert.status === 'DISMISSED';

        const borderColor = isCritical
          ? 'border-red-800/80 bg-red-950/30 text-red-200'
          : 'border-orange-800/80 bg-orange-950/30 text-orange-200';

        const iconColor = isCritical ? 'text-red-400' : 'text-orange-400';

        return (
          <div
            key={alert.id}
            className={`p-5 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${borderColor}`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 shrink-0 mt-0.5">
                {isCritical ? (
                  <AlertOctagon className={`w-5 h-5 ${iconColor} animate-pulse`} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-slate-300">
                    {alert.alertType}
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-tight">{alert.title}</h4>
                  <StatusBadge status={alert.status} size="sm" />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                  {alert.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Raised: {formatDateTimeIndian(alert.createdAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-500" />
                    Assigned: <strong className="text-slate-200">{alert.assignedTo?.name || 'Unassigned / System Queue'}</strong>
                  </span>
                  {alert.resolutionNotes && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300 italic">
                        Notes: "{alert.resolutionNotes}"
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Auditor Quick Actions */}
            {isAuditorOrAdmin && !isResolved && (
              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto pt-2 md:pt-0">
                {alert.status === 'OPEN' && (
                  <button
                    onClick={() => handleOpenActionModal(alert, 'IN_REVIEW')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Review Alert</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenActionModal(alert, 'RESOLVED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Resolve</span>
                </button>

                <button
                  onClick={() => handleOpenActionModal(alert, 'DISMISSED')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3 text-slate-400" />
                  <span>Dismiss</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Alert Status Action Modal */}
      <Modal
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title={`Update Fraud Alert: Set to "${targetStatus}"`}
      >
        <form onSubmit={handleSubmitStatus} className="space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            Updating status for alert <strong className="text-white">"{selectedAlert?.title}"</strong> to <strong className="text-blue-400">{targetStatus}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Auditor Resolution Notes / Forensic Action Taken *
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              rows={3}
              placeholder="e.g. Reviewed vendor GST compliance report, confirmed discrepancy is corrected, or verified false alarm."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              {isUpdating ? 'Saving Alert Status...' : 'Confirm Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
