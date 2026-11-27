import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium backdrop-blur-md ${
              t.type === 'err'
                ? 'bg-red-50/95 text-red-700 border-red-200'
                : 'bg-white/95 text-slate-900 border-emerald-200'
            }`}
          >
            {t.type === 'err' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="truncate">{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-1 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
