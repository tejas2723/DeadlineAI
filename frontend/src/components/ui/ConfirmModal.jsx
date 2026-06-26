import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {string} props.title - Title header
 * @param {string} props.message - Descriptive body text
 * @param {Function} props.onConfirm - Confirmation click handler
 * @param {Function} props.onCancel - Cancellation click handler
 * @param {boolean} [props.dangerous=false] - If true, displays dangerous indicators (red actions)
 */
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, dangerous = false }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 p-6 animate-fade-in flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              dangerous ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none active:scale-95 ${
              dangerous
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
