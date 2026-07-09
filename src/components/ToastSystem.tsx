import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastSystemProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/90', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-500/40', glow: 'shadow-red-500/20' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-950/90', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
  warning: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-950/90', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' }
};

export const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg ${config.bg} ${config.border} ${config.glow} min-w-[320px]`}
            >
              <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
              <span className="text-sm text-slate-100 font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => onRemove(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};
