'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']): string => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    if (type !== 'loading') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    hideToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    loading: (msg: string) => addToast(msg, 'loading'),
  };
}
