import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, ExternalLink, RefreshCw, Send, Shield, Wrench } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { LiveAmbientBackdrop } from './LiveAmbientBackdrop';

export const MaintenanceView: React.FC = () => {
  const { maintenance, refreshMaintenance, setMode } = useStore();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await refreshMaintenance();
    setChecking(false);
  };

  return (
    <div className="relative min-h-screen text-white flex flex-col justify-between overflow-hidden">
      <LiveAmbientBackdrop variant="hero" className="fixed inset-0 w-full h-full -z-10" />

      <header className="relative z-10 px-5 sm:px-8 h-16 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white">
          <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-emerald-300 flex items-center justify-center shadow-sm">
            <Send className="w-4 h-4 -translate-x-[0.5px] translate-y-[0.5px]" />
          </span>
          <span>
            AadityaTg<span className="text-emerald-300">.Store</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMode('admin')}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-100 transition-all cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-300" />
          Admin Login
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.28)] p-7 sm:p-10 text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-400/15 border border-emerald-300/30 text-emerald-300 flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.28)]">
            <Wrench className="w-8 h-8" />
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
              Scheduled Upgrade
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {maintenance.title || 'Store Under Maintenance'}
            </h1>
            <p className="text-sm sm:text-base text-emerald-50/80 leading-relaxed max-w-md mx-auto">
              {maintenance.message ||
                'AadityaTg.Store is currently undergoing maintenance to improve speed and stock reliability. Please check back shortly.'}
            </p>
          </div>

          {maintenance.eta && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-medium text-emerald-100">
              <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Estimated return: {maintenance.eta}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={checking}
              onClick={() => void handleCheck()}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 disabled:opacity-60 font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : 'Check Status'}
            </button>

            {maintenance.support && /^https?:\/\//i.test(maintenance.support) && (
              <a
                href={maintenance.support}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-white/12 hover:bg-white/22 backdrop-blur-md border border-white/20 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Telegram Support</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {maintenance.supportCh && /^https?:\/\//i.test(maintenance.supportCh) && (
            <div className="pt-2 border-t border-white/10">
              <a
                href={maintenance.supportCh}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-200/85 hover:text-emerald-200 inline-flex items-center gap-1.5 transition-colors"
              >
                Join our official updates channel
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 py-5 px-5 text-center text-xs text-emerald-100/55">
        AadityaTg.Store · All balances and orders are safely preserved during maintenance.
      </footer>
    </div>
  );
};
