import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  let buttonClasses = 'bg-red-600 hover:bg-red-500 text-white';
  let icon = <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />;

  if (variant === 'warning') {
    buttonClasses = 'bg-amber-600 hover:bg-amber-500 text-white';
    icon = <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />;
  } else if (variant === 'primary') {
    buttonClasses = 'bg-blue-600 hover:bg-blue-500 text-white';
    icon = <AlertTriangle className="w-6 h-6 text-blue-400 shrink-0" />;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl">{icon}</div>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-lg ${buttonClasses}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
