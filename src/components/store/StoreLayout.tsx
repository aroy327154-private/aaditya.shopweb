import React from 'react';
import { motion } from 'motion/react';
import { Home, ShoppingBag, Wallet, ClipboardList, User, ArrowLeft, Plus, Send } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { StorePage } from '../../types';
import { formatMoney } from '../../lib/format';
import { LiveAmbientBackdrop } from './LiveAmbientBackdrop';

interface StoreLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS: {
  key: 'home' | 'store' | 'wallet' | 'orders' | 'profile';
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'store', label: 'Store', icon: ShoppingBag },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'orders', label: 'Orders', icon: ClipboardList },
  { key: 'profile', label: 'Account', icon: User },
];

const ACTIVE_MAP: Record<StorePage, 'home' | 'store' | 'wallet' | 'orders' | 'profile'> = {
  landing: 'home',
  login: 'home',
  register: 'home',
  home: 'home',
  store: 'store',
  countries: 'store',
  buy: 'store',
  digital: 'store',
  smm: 'store',
  wallet: 'wallet',
  deposit: 'wallet',
  redeem: 'home',
  orders: 'orders',
  'order-result': 'orders',
  profile: 'profile',
  support: 'profile',
  'new-ticket': 'profile',
  'ticket-chat': 'profile',
};

export const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
  const { storePage, navigateStore, currentUser, isViewAs, exitViewAs } = useStore();
  const activeTab = ACTIVE_MAP[storePage] || 'home';

  return (
    <div className="relative min-h-screen text-slate-900 pb-28 md:pb-12 flex flex-col">
      <LiveAmbientBackdrop variant="ambient" className="fixed inset-0 -z-10" />

      {isViewAs && currentUser && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs py-2 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <span className="truncate">
              Viewing storefront as <strong className="font-semibold">{currentUser.name}</strong> ({currentUser.email})
            </span>
            <button
              type="button"
              onClick={exitViewAs}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 glass-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigateStore('home')}
            className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-600/25 group-hover:scale-[1.04] transition-transform">
              <Send className="w-4 h-4 -translate-x-[0.5px] translate-y-[0.5px]" />
            </span>
            <span>
              AadityaTg<span className="text-emerald-600">.Store</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigateStore(item.key)}
                  className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      className="absolute left-0 right-0 -bottom-[1px] h-[2.5px] rounded-full bg-emerald-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateStore('wallet')}
              className="md:hidden text-sm font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap shrink-0 active:scale-[0.97] transition-transform"
            >
              {formatMoney(currentUser?.balance)}
            </button>
            <button
              type="button"
              onClick={() => navigateStore('deposit')}
              className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/25 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>

      {/* Floating Liquid-Glass Mobile Bottom Dock */}
      <div className="md:hidden fixed dock-safe-bottom inset-x-3.5 sm:inset-x-6 z-40 pointer-events-none flex justify-center">
        <nav
          aria-label="Mobile navigation"
          className="pointer-events-auto w-full max-w-[430px] h-[74px] px-2 rounded-[26px] glass-dock ring-1 ring-slate-200/60 grid grid-cols-5 items-center gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigateStore(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative h-[58px] rounded-[20px] flex flex-col items-center justify-center gap-1 transition-colors select-none cursor-pointer active:scale-[0.94] ${
                  isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-dock-active-pill"
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                    className="absolute inset-0 rounded-[20px] bg-emerald-500/12 ring-1 ring-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  />
                )}
                <Icon
                  className={`relative z-10 w-[23px] h-[23px] transition-transform duration-200 ${
                    isActive ? '-translate-y-[1px] scale-105 text-emerald-600' : ''
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.85}
                />
                <span
                  className={`relative z-10 text-[11.5px] leading-none tracking-tight whitespace-nowrap ${
                    isActive ? 'font-bold text-emerald-800' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
