import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Lock, Mail, MessageSquare, Send, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { LiveAmbientBackdrop } from './LiveAmbientBackdrop';

const SERVICE_HIGHLIGHTS = [
  {
    icon: Send,
    title: 'TG Accounts',
    subtitle: 'Server 1 · Ready-made',
    detail: 'Verified Telegram accounts across regions with instant credential delivery.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Numbers',
    subtitle: 'Server 2 · Fresh OTP',
    detail: 'Clean numbers ready for immediate WhatsApp activation and live OTP polling.',
  },
  {
    icon: ShieldCheck,
    title: 'All App OTP',
    subtitle: 'Server 3 · 100+ apps',
    detail: 'Fast verification numbers for Instagram, Gmail, Facebook, and global platforms.',
  },
  {
    icon: ShoppingBag,
    title: 'Digital & SMM Shop',
    subtitle: 'Instant fulfillment',
    detail: 'Subscriptions, creative tools, and social media growth services from one wallet.',
  },
];

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const StoreAuth: React.FC = () => {
  const { storePage, navigateStore, loginUser, registerUser, loginWithGoogle } = useStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regErr, setRegErr] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async (target: 'login' | 'register') => {
    setLoginErr('');
    setRegErr('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (!res.ok && res.error) {
      if (target === 'login') setLoginErr(res.error);
      else setRegErr(res.error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    setLoginLoading(true);
    const res = await loginUser(loginEmail, loginPass);
    setLoginLoading(false);
    if (!res.ok && res.error) setLoginErr(res.error);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErr('');
    setRegLoading(true);
    const res = await registerUser(regName, regEmail, regPass);
    setRegLoading(false);
    if (!res.ok && res.error) setRegErr(res.error);
  };

  return (
    <div className="relative min-h-screen text-slate-900 flex flex-col">
      <LiveAmbientBackdrop variant="ambient" className="fixed inset-0 -z-10" />

      <header className="sticky top-0 z-30 glass-header">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigateStore('landing')}
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-600/25 group-hover:scale-[1.04] transition-transform">
              <Send className="w-4 h-4 -translate-x-[0.5px] translate-y-[0.5px]" />
            </span>
            <span>
              AadityaTg<span className="text-emerald-600">.Store</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigateStore('landing')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => navigateStore('login')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateStore(storePage === 'register' ? 'login' : 'register')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {storePage === 'register' ? 'Sign In' : 'Get Started'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {storePage === 'landing' && (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl mx-auto w-full px-5 py-12 lg:py-20"
            >
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center">
                  <div className="text-xs font-medium text-emerald-700 tracking-wide mb-3">
                    Instant OTP · Telegram accounts · Digital &amp; SMM services
                  </div>
                  <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] [text-wrap:balance]">
                    Accounts, OTP verification, and digital services in one place.
                  </h1>
                  <p className="text-slate-600 text-base sm:text-lg mt-5 leading-relaxed max-w-xl">
                    Purchase ready-made Telegram accounts, fresh WhatsApp numbers, multi-app OTP activations,
                    and SMM packages directly from a unified wallet.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigateStore('register')}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-all active:scale-[0.98] shadow-sm"
                    >
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateStore('login')}
                      className="min-h-[48px] px-6 py-3 rounded-xl glass-card hover:bg-white/90 text-slate-900 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200/70 grid grid-cols-3 gap-6">
                    <div>
                      <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">100+</div>
                      <div className="text-xs text-slate-500 mt-0.5">Supported apps</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">150+</div>
                      <div className="text-xs text-slate-500 mt-0.5">Global countries</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold text-emerald-700 tabular-nums">₹10</div>
                      <div className="text-xs text-slate-500 mt-0.5">Minimum deposit</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_20px_44px_-16px_rgba(4,20,16,0.5)] border border-white/15">
                    <LiveAmbientBackdrop variant="hero" className="absolute inset-0 w-full h-full" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-medium text-emerald-200/90">
                          AadityaTg.Store · Live Marketplace Feed
                        </div>
                        <div className="font-display text-xl sm:text-2xl font-bold tracking-tight mt-1">
                          Instant global inventory &amp; OTP delivery
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-100/80 mt-1.5">
                          Real-time stock across Pushing, Premium &amp; Autoreg TG accounts plus 100+ app OTP routes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateStore('register')}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/95 hover:bg-white text-emerald-900 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Start Now
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {SERVICE_HIGHLIGHTS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="group glass-card glass-card-interactive rounded-2xl p-6 flex flex-col justify-between"
                        >
                          <div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-50/90 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-medium text-slate-500 mb-1">{item.subtitle}</div>
                            <h2 className="font-display text-lg font-bold text-slate-900">{item.title}</h2>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.detail}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateStore('register')}
                            className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 self-start transition-colors cursor-pointer"
                          >
                            Get started
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {storePage === 'login' && (
            <motion.section
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md mx-auto w-full px-5 py-10"
            >
              <button
                type="button"
                onClick={() => navigateStore('landing')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to overview
              </button>

              <div className="glass-card rounded-3xl p-6 sm:p-8">
                <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
                <p className="text-sm text-slate-500 mt-1">Sign in to access your wallet and orders.</p>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled={googleLoading || loginLoading}
                    onClick={() => handleGoogleAuth('login')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-300 text-slate-800 font-semibold text-sm inline-flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                  >
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                    <span>{googleLoading ? 'Connecting Google…' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative my-5 flex items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="mx-3 text-xs font-medium text-slate-400">or sign in with email</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginErr && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {loginErr}
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email / Gmail address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        autoComplete="email"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-pass" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-pass"
                        type="password"
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98]"
                  >
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-600">
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => navigateStore('register')}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {storePage === 'register' && (
            <motion.section
              key="register"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md mx-auto w-full px-5 py-10"
            >
              <button
                type="button"
                onClick={() => navigateStore('landing')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to overview
              </button>

              <div className="glass-card rounded-3xl p-6 sm:p-8">
                <h1 className="font-display text-2xl font-bold text-slate-900">Create account</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Join AadityaTg.Store to access OTP numbers, accounts, and digital services.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled={googleLoading || regLoading}
                    onClick={() => handleGoogleAuth('register')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-300 text-slate-800 font-semibold text-sm inline-flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
                  >
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                    <span>{googleLoading ? 'Connecting Google…' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative my-5 flex items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="mx-3 text-xs font-medium text-slate-400">or register with email</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {regErr && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {regErr}
                    </div>
                  )}

                  <div>
                    <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Your name"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email / Gmail address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-pass" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-pass"
                        type="password"
                        required
                        minLength={6}
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98]"
                  >
                    {regLoading ? 'Creating account…' : 'Register'}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-600">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => navigateStore('login')}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
