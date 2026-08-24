'use client';

import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'loading';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    loading: <Loader2 className="w-5 h-5 text-indigo-400 shrink-0 animate-spin" />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    loading: 'bg-indigo-500/10 border-indigo-500/30',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${bgColors[type]} animate-in slide-in-from-top-2 duration-300`}
    >
      {icons[type]}
      <span className="text-sm text-white/90 font-medium max-w-xs">{message}</span>
      {type !== 'loading' && (
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors ml-2">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
