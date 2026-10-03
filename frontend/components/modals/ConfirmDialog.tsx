'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDangerous = true,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDangerous ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition disabled:opacity-50 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
