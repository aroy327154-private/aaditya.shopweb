import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, Shield, User } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { LiveAmbientBackdrop } from '../store/LiveAmbientBackdrop';

export const AdminAuth: React.FC = () => {
  const { adminSetupRequired, claimAdmin, loginAdmin, setMode } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (adminSetupRequired) {
      if (password.length < 6) {
        setError('Admin password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setSubmitting(true);
      const res = await claimAdmin(username.trim() || 'admin', password);
      setSubmitting(false);
      if (!res.ok && res.error) setError(res.error);
      return;
    }

    setSubmitting(true);
    const res = await loginAdmin(username, password);
    setSubmitting(false);
    if (!res.ok && res.error) setError(res.error);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04110e] text-white flex flex-col justify-center px-4 py-10">
      <LiveAmbientBackdrop variant="hero" />

      <div className="relative z-10 max-w-sm w-full mx-auto">
        <button
          type="button"
          onClick={() => setMode('store')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-100/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Storefront
        </button>

        <div className="rounded-3xl bg-white/94 backdrop-blur-2xl border border-white/80 p-6 sm:p-8 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.65)] text-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-[0_10px_24px_-8px_rgba(5,150,105,0.7)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {adminSetupRequired ? 'Set Up Primary Admin' : 'Admin Console'}
              </h1>
              <p className="text-xs text-slate-500">AadityaTg.Store · Secure Access</p>
            </div>
          </div>

          {adminSetupRequired && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              First-time setup: create your primary administrator login, or set <code className="font-mono">ADMIN_PASSCODE</code> in deployment environment secrets.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="adm-user" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adm-user"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adm-pass" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adm-pass"
                  type="password"
                  required
                  minLength={adminSetupRequired ? 6 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={adminSetupRequired ? 'Minimum 6 characters' : 'Enter password'}
                  autoComplete={adminSetupRequired ? 'new-password' : 'current-password'}
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {adminSetupRequired && (
              <div>
                <label htmlFor="adm-pass-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="adm-pass-confirm"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-slate-900 to-emerald-950 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md"
            >
              {submitting
                ? 'Please wait...'
                : adminSetupRequired
                  ? 'Create Primary Admin'
                  : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
