import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../store/StoreContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useStore();

  return (
    <AnimatePresence>
      {confirmState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={closeConfirm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h3 id="confirm-title" className="text-lg font-bold text-slate-900">
              {confirmState.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{confirmState.message}</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                  closeConfirm();
                }}
                className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-white text-sm font-semibold active:scale-[0.98] transition-all ${
                  confirmState.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
