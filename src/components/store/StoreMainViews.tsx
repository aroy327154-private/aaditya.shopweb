import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  Copy,
  Crown,
  Gift,
  Globe,
  Headphones,
  KeyRound,
  Layers,
  Loader2,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Square,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { formatMoney, formatMoneyCompact } from '../../lib/format';
import {
  AppOtpServiceOption,
  CountryOption,
  ServerFilterState,
  SmmService,
  TgAccountCategory,
  TgAccountOption,
  TgEmailFilter,
  TgOriginFilter,
  TgPremiumFilter,
  TgSortOrder,
  TgSpamFilter,
  WorldCountryMeta,
} from '../../types';
import { CountryFlag } from './CountryFlag';
import { LiveAmbientBackdrop } from './LiveAmbientBackdrop';

function getTierLabel(deposited: number): string {
  if (deposited >= 5000) return 'Gold Tier';
  if (deposited >= 1000) return 'Silver Tier';
  return 'Bronze Tier';
}

export const HomeView: React.FC = () => {
  const { currentUser, userState, navigateStore, setCurrentServer, setSelectedOrderId } = useStore();

  const userOrders = userState?.orders || [];
  const recentOrders = userOrders.slice(0, 5);
  const latestBroadcast = userState?.broadcasts?.[0];
  const displayName = currentUser?.name || currentUser?.email.split('@')[0] || 'User';

  const openServer = (srv: 1 | 2 | 3) => {
    setCurrentServer(srv);
    navigateStore('countries');
  };

  return (
    <div className="space-y-6">
      {latestBroadcast && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-emerald-900">Announcement · {latestBroadcast.date}</div>
            <div className="text-sm text-emerald-800 mt-0.5">{latestBroadcast.message}</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Hello, {displayName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {getTierLabel(currentUser?.deposited || 0)} · ID #{currentUser?.id}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateStore('support')}
          className="min-h-[44px] px-4 py-2 rounded-xl glass-card hover:bg-white/90 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          Support
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 relative overflow-hidden rounded-3xl text-white p-6 sm:p-7 flex flex-col justify-between shadow-[0_22px_48px_-16px_rgba(4,20,16,0.55)] border border-white/15">
          <LiveAmbientBackdrop variant="hero" className="absolute inset-0 w-full h-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-emerald-100/90 text-sm">
              <span className="font-medium">Wallet Balance</span>
              <span className="text-xs font-medium text-emerald-100/90">{getTierLabel(currentUser?.deposited || 0)}</span>
            </div>
            <div className="font-display text-4xl font-extrabold mt-2.5 tabular-nums tracking-tight">
              {formatMoney(currentUser?.balance)}
            </div>
            <div className="text-xs text-emerald-100/80 mt-2 tabular-nums">
              Lifetime deposited: {formatMoney(currentUser?.deposited)}
            </div>
          </div>

          <div className="relative z-10 mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateStore('deposit')}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-white/95 text-emerald-900 hover:bg-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
            <button
              type="button"
              onClick={() => navigateStore('store')}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-white/14 hover:bg-white/24 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Browse Store
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => openServer(1)}
            className="group glass-card glass-card-interactive rounded-2xl p-4 sm:p-5 text-left active:scale-[0.98] flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50/90 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                <Send className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs text-emerald-700 font-medium">Server 1 · Accounts</div>
              <div className="font-display font-bold text-base text-slate-900 mt-0.5">TG Accounts</div>
              <div className="text-xs text-slate-500 mt-1">Ready-made accounts</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openServer(2)}
            className="group glass-card glass-card-interactive rounded-2xl p-4 sm:p-5 text-left active:scale-[0.98] flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50/90 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                <MessageSquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs text-teal-700 font-medium">Server 2 · Fresh</div>
              <div className="font-display font-bold text-base text-slate-900 mt-0.5">WhatsApp</div>
              <div className="text-xs text-slate-500 mt-1">Instant OTP numbers</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openServer(3)}
            className="group glass-card glass-card-interactive rounded-2xl p-4 sm:p-5 text-left active:scale-[0.98] flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50/90 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs text-indigo-700 font-medium">Server 3 · 100+ apps</div>
              <div className="font-display font-bold text-base text-slate-900 mt-0.5">App OTP</div>
              <div className="text-xs text-slate-500 mt-1">Global app verification</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateStore('digital')}
            className="group glass-card glass-card-interactive rounded-2xl p-4 sm:p-5 text-left active:scale-[0.98] flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50/90 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs text-amber-700 font-medium">Instant delivery</div>
              <div className="font-display font-bold text-base text-slate-900 mt-0.5">Digital Shop</div>
              <div className="text-xs text-slate-500 mt-1">Tools, plans &amp; files</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => navigateStore('smm')}
          className="min-h-[60px] glass-card glass-card-interactive rounded-2xl px-4 py-3.5 flex items-center justify-center sm:justify-start gap-3 active:scale-[0.98] cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-emerald-50/90 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">SMM</div>
            <div className="hidden sm:block text-xs text-slate-500">Social growth</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateStore('redeem')}
          className="min-h-[60px] glass-card glass-card-interactive rounded-2xl px-4 py-3.5 flex items-center justify-center sm:justify-start gap-3 active:scale-[0.98] cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-emerald-50/90 text-emerald-700 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">Redeem</div>
            <div className="hidden sm:block text-xs text-slate-500">Gift &amp; promo codes</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateStore('orders')}
          className="min-h-[60px] glass-card glass-card-interactive rounded-2xl px-4 py-3.5 flex items-center justify-center sm:justify-start gap-3 active:scale-[0.98] cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-emerald-50/90 text-emerald-700 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">Orders</div>
            <div className="hidden sm:block text-xs text-slate-500">{userOrders.length} total</div>
          </div>
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-slate-900">Recent Orders</h2>
          <button
            type="button"
            onClick={() => navigateStore('orders')}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            See all
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-200/60">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500">No orders placed yet.</p>
              <button
                type="button"
                onClick={() => navigateStore('store')}
                className="mt-3 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Explore store services
              </button>
            </div>
          ) : (
            recentOrders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSelectedOrderId(o.id);
                  navigateStore('order-result');
                }}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {o.country || o.name || o.kind}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                    {o.phone || o.id} · {o.date}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold text-sm text-slate-900 tabular-nums">
                    {formatMoneyCompact(o.price)}
                  </div>
                  <div
                    className={`text-xs font-medium mt-0.5 ${
                      o.status === 'DONE' || o.status === 'DELIVERED'
                        ? 'text-emerald-700'
                        : o.status === 'CANCELLED'
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }`}
                  >
                    {o.status}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export const StoreView: React.FC = () => {
  const { navigateStore, setCurrentServer, userState } = useStore();
  const activeDigital = userState?.digital.length || 0;
  const smmCount = userState?.smm.services.length || 0;
  const smmCatsCount = userState?.smm.cats.length || 0;

  const openServer = (srv: 1 | 2 | 3) => {
    setCurrentServer(srv);
    navigateStore('countries');
  };

  const statusFor = (no: 1 | 2 | 3) => userState?.serverStatus.find((s) => s.no === no);

  const services = [
    {
      title: 'Server 1 · TG Accounts',
      desc: 'Ready-made Telegram accounts across multiple regions with instant delivery.',
      meta: statusFor(1)?.configured ? 'Instant delivery ready' : 'Stock updating soon',
      icon: Send,
      tone: 'bg-emerald-50 text-emerald-700',
      onClick: () => openServer(1),
    },
    {
      title: 'Server 2 · WhatsApp Numbers',
      desc: 'Fresh phone numbers dedicated for WhatsApp activation and OTP polling.',
      meta: statusFor(2)?.configured ? 'Instant OTP ready' : 'Currently updating',
      icon: MessageSquare,
      tone: 'bg-teal-50 text-teal-700',
      onClick: () => openServer(2),
    },
    {
      title: 'Server 3 · All App OTP',
      desc: 'Single-use verification numbers supporting Instagram, Gmail, Facebook & 100+ apps.',
      meta: statusFor(3)?.configured ? '100+ apps ready' : 'Currently updating',
      icon: ShieldCheck,
      tone: 'bg-indigo-50 text-indigo-700',
      onClick: () => openServer(3),
    },
    {
      title: 'Digital Shop',
      desc: 'Premium subscriptions, creative tools, and digital credentials delivered instantly.',
      meta: `${activeDigital} active products`,
      icon: ShoppingBag,
      tone: 'bg-amber-50 text-amber-700',
      onClick: () => navigateStore('digital'),
    },
    {
      title: 'SMM Services',
      desc: 'Boost Telegram channels, Instagram profiles, and YouTube videos at wholesale rates.',
      meta: `${smmCount} services across ${smmCatsCount} categories`,
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-700',
      onClick: () => navigateStore('smm'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Store</h1>
        <p className="text-sm text-slate-500 mt-1">Select a server or digital catalog to continue.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              type="button"
              onClick={s.onClick}
              className="group glass-card glass-card-interactive rounded-2xl p-6 text-left flex flex-col justify-between active:scale-[0.98] cursor-pointer"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.tone}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-lg text-slate-900">{s.title}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{s.meta}</span>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TG_CATEGORY_META: Record<
  TgAccountCategory,
  { title: string; shortLabel: string; subtitle: string; summary: string }
> = {
  all: {
    title: 'All TG Accounts',
    shortLabel: 'All Accounts',
    subtitle: 'Every verified live Telegram account available right now',
    summary: 'All Origins & Types',
  },
  pushing: {
    title: 'Pushing Account',
    shortLabel: 'Pushing',
    subtitle: 'Pushing accounts only — all live pushing accounts in stock',
    summary: 'Pushing Only',
  },
  premium: {
    title: 'Premium Account',
    shortLabel: 'Premium',
    subtitle: 'All Telegram accounts with active Telegram Premium in stock',
    summary: 'Telegram Premium Only',
  },
  autoreg: {
    title: 'Autoreg Account',
    shortLabel: 'Autoreg',
    subtitle: 'Auto-registered Telegram accounts only — live verified stock',
    summary: 'Autoreg Only',
  },
};

function countActiveFilters(f: ServerFilterState): number {
  let count = 0;
  if (f.spam !== 'any') count += 1;
  if (f.origin !== 'any') count += 1;
  if (f.premium !== 'any') count += 1;
  if (f.email !== 'any') count += 1;
  if (f.sort !== 'low') count += 1;
  return count;
}

function formatFilterSummary(f: ServerFilterState): string {
  const parts: string[] = [];
  if (f.spam === 'free') parts.push('Spam Free');
  else if (f.spam === 'blocked') parts.push('Spam Blocked');
  else if (f.spam === 'temp') parts.push('Temp Spam');
  if (f.origin === 'pushing') parts.push('Origin: Pushing');
  else if (f.origin === 'autoreg') parts.push('Origin: Autoreg');
  else if (f.origin === 'resale') parts.push('Origin: Resale');
  else if (f.origin === 'stealer') parts.push('Origin: Stealer');
  else if (f.origin === 'brute') parts.push('Origin: Brute');
  else if (f.origin === 'personal') parts.push('Origin: Personal');
  else if (f.origin === 'self_registration') parts.push('Origin: Self Reg');
  else if (f.origin === 'mixed') parts.push('Origin: Mixed');
  else if (f.origin === 'fresh') parts.push('Origin: Fresh');
  if (f.premium === 'premium') parts.push('Premium Only');
  else if (f.premium === 'non_premium') parts.push('Non Premium');
  if (f.email === 'required') parts.push('Email: Required');
  if (f.sort === 'high') parts.push('Price: High → Low');
  return parts.length > 0 ? parts.join(' · ') : 'All filters: Any';
}

interface FiltersDrawerProps {
  open: boolean;
  filters: ServerFilterState;
  onChange: (next: ServerFilterState) => void;
  onReset: () => void;
  onApplyToCountries?: () => void;
  onClose: () => void;
}

const ServerFiltersDrawer: React.FC<FiltersDrawerProps> = ({
  open,
  filters,
  onChange,
  onReset,
  onApplyToCountries,
  onClose,
}) => {
  if (!open) return null;

  const spamOptions: { value: TgSpamFilter; label: string }[] = [
    { value: 'free', label: 'Spam Free' },
    { value: 'blocked', label: 'Spam Blocked' },
    { value: 'temp', label: 'Temp Spam' },
    { value: 'any', label: 'Any' },
  ];

  const originOptions: { value: TgOriginFilter; label: string }[] = [
    { value: 'pushing', label: 'Pushing' },
    { value: 'autoreg', label: 'Autoreg' },
    { value: 'resale', label: 'Resale' },
    { value: 'stealer', label: 'Stealer' },
    { value: 'brute', label: 'Brute' },
    { value: 'personal', label: 'Personal' },
    { value: 'self_registration', label: 'Self Reg' },
    { value: 'any', label: 'Any' },
  ];

  const premiumOptions: { value: TgPremiumFilter; label: string }[] = [
    { value: 'premium', label: 'Premium Only' },
    { value: 'non_premium', label: 'Non Premium' },
    { value: 'any', label: 'Any' },
  ];

  const emailOptions: { value: TgEmailFilter; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'required', label: 'Required' },
  ];

  const sortOptions: { value: TgSortOrder; label: string }[] = [
    { value: 'low', label: 'Price: Low → High' },
    { value: 'high', label: 'Price: High → Low' },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-sm text-slate-900">TG Account Filters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter accounts by spam status, origin, Telegram Premium, email &amp; price order
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 pt-1 border-t border-slate-100">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Spam</div>
          <div className="flex flex-wrap gap-1.5">
            {spamOptions.map((opt) => {
              const active = filters.spam === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, spam: opt.value })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Origin</div>
          <div className="flex flex-wrap gap-1.5">
            {originOptions.map((opt) => {
              const active = filters.origin === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, origin: opt.value })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Premium</div>
          <div className="flex flex-wrap gap-1.5">
            {premiumOptions.map((opt) => {
              const active = filters.premium === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, premium: opt.value })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Email</div>
          <div className="flex flex-wrap gap-1.5">
            {emailOptions.map((opt) => {
              const active = filters.email === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, email: opt.value })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Price Sort</div>
          <div className="flex flex-wrap gap-1.5">
            {sortOptions.map((opt) => {
              const active = filters.sort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, sort: opt.value })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {onApplyToCountries && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onApplyToCountries}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            Show Matching Accounts
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const CountriesView: React.FC = () => {
  const {
    currentServer,
    selectedAppCode,
    setSelectedAppCode,
    selectedAppName,
    setSelectedAppName,
    appOtpStage,
    setAppOtpStage,
    tgStage,
    setTgStage,
    selectedTgCategory,
    setSelectedTgCategory,
    selectTgCategory,
    serverFilters,
    setServerFilters,
    resetServerFilters,
    navigateStore,
    selectedCountry,
    setSelectedCountry,
    setSelectedTgAccount,
    fetchServerApps,
    fetchServerCountries,
    fetchTgAccounts,
    fetchWorldCountries,
  } = useStore();

  const [query, setQuery] = useState('');
  const [accountQuery, setAccountQuery] = useState('');
  const [appQuery, setAppQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [autoLoadingAll, setAutoLoadingAll] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [accountsError, setAccountsError] = useState('');
  const [appsError, setAppsError] = useState('');
  const [configured, setConfigured] = useState(true);
  const [accountsConfigured, setAccountsConfigured] = useState(true);
  const [appsConfigured, setAppsConfigured] = useState(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [worldCountries, setWorldCountries] = useState<WorldCountryMeta[]>([]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryPickerQuery, setCountryPickerQuery] = useState('');
  const [tgAccounts, setTgAccounts] = useState<TgAccountOption[]>([]);
  const [totalApiItems, setTotalApiItems] = useState<number | null>(null);
  const [accountsPage, setAccountsPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [apps, setApps] = useState<AppOtpServiceOption[]>([]);

  const tgAccountsRef = useRef<TgAccountOption[]>([]);
  const accountsReqIdRef = useRef(0);
  const appsReqIdRef = useRef(0);
  const countriesReqIdRef = useRef(0);
  const accountsPageRef = useRef(1);
  const hasNextPageRef = useRef(false);
  const accountsLoadingRef = useRef(false);
  const emptyPageStreakRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const autoLoadStopRef = useRef(false);
  const nextCursorRef = useRef<{
    nextPage: number | null;
    nextPmin?: number;
    nextPmax?: number;
    usePriceCursor: boolean;
  }>({ nextPage: null, usePriceCursor: false });
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const countryPickerRef = useRef<HTMLDivElement | null>(null);

  const isSelectingTgCategory = currentServer === 1 && tgStage === 'categories';
  const isSelectingTgAccount = currentServer === 1 && tgStage === 'accounts';
  const isSelectingApp = currentServer === 3 && appOtpStage === 'apps';
  const activeFilterCount = countActiveFilters(serverFilters);

  useEffect(() => {
    tgAccountsRef.current = tgAccounts;
  }, [tgAccounts]);

  // Close country picker dropdown on outside click
  useEffect(() => {
    if (!countryPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setCountryPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [countryPickerOpen]);

  // Load world countries list once when Server 1 is active
  useEffect(() => {
    if (currentServer !== 1 || worldCountries.length > 0) return;
    let active = true;
    void fetchWorldCountries().then((list) => {
      if (active && list.length > 0) setWorldCountries(list);
    });
    return () => {
      active = false;
    };
  }, [currentServer, worldCountries.length, fetchWorldCountries]);

  const loadApps = async () => {
    const reqId = ++appsReqIdRef.current;
    setAppsLoading(true);
    setAppsError('');
    const res = await fetchServerApps();
    if (appsReqIdRef.current !== reqId) return;
    setApps(res.apps);
    setAppsConfigured(res.configured);
    if (res.error) setAppsError(res.error);
    setAppsLoading(false);
  };

  const loadCountries = async () => {
    const reqId = ++countriesReqIdRef.current;
    setLoading(true);
    setErrorMsg('');
    const serviceParam = currentServer === 2 ? 'wa' : currentServer === 3 ? selectedAppCode : undefined;
    const res = await fetchServerCountries(
      currentServer,
      serviceParam,
      currentServer === 1 ? serverFilters : undefined,
    );
    if (countriesReqIdRef.current !== reqId) return;
    setCountries(res.countries);
    setConfigured(res.configured);
    if (res.error) setErrorMsg(res.error);
    setLoading(false);
  };

  const loadAccountsInitial = useCallback(async () => {
    const reqId = ++accountsReqIdRef.current;
    autoLoadStopRef.current = true;
    setAutoLoadingAll(false);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    accountsLoadingRef.current = true;
    setAccountsLoading(true);
    setAccountsError('');
    setTgAccounts([]);
    tgAccountsRef.current = [];
    setTotalApiItems(null);
    accountsPageRef.current = 1;
    setAccountsPage(1);
    hasNextPageRef.current = false;
    setHasNextPage(false);
    emptyPageStreakRef.current = 0;
    nextCursorRef.current = { nextPage: null, usePriceCursor: false };

    const res = await fetchTgAccounts({
      countryCode: selectedCountry?.code,
      countryIso: selectedCountry?.iso,
      filters: serverFilters,
      page: 1,
    });

    if (accountsReqIdRef.current !== reqId) return;

    setTgAccounts(res.accounts);
    tgAccountsRef.current = res.accounts;
    setAccountsConfigured(res.configured);
    setTotalApiItems(res.totalItems);
    const resolvedPage = res.page || 1;
    accountsPageRef.current = resolvedPage;
    setAccountsPage(resolvedPage);
    hasNextPageRef.current = Boolean(res.hasNextPage);
    setHasNextPage(Boolean(res.hasNextPage));
    emptyPageStreakRef.current = 0;
    nextCursorRef.current = {
      nextPage: res.nextPage,
      nextPmin: res.nextPmin,
      nextPmax: res.nextPmax,
      usePriceCursor: false,
    };
    if (res.error) setAccountsError(res.error);
    accountsLoadingRef.current = false;
    setAccountsLoading(false);
  }, [fetchTgAccounts, selectedCountry?.code, selectedCountry?.iso, serverFilters]);

  const loadMoreAccounts = useCallback(async (): Promise<boolean> => {
    if (loadingMoreRef.current || accountsLoadingRef.current || !hasNextPageRef.current) return false;
    const reqId = accountsReqIdRef.current;
    const cursor = nextCursorRef.current;
    if (!cursor.nextPage && !cursor.nextPmin && !cursor.nextPmax) {
      hasNextPageRef.current = false;
      setHasNextPage(false);
      return false;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const currentPage = accountsPageRef.current;
    const isHighSort = serverFilters.sort === 'high';
    const requestOpts = cursor.usePriceCursor
      ? {
          countryCode: selectedCountry?.code,
          countryIso: selectedCountry?.iso,
          filters: serverFilters,
          page: cursor.nextPage || currentPage + 1,
          pmin: !isHighSort ? cursor.nextPmin : undefined,
          pmax: isHighSort ? cursor.nextPmax : undefined,
        }
      : {
          countryCode: selectedCountry?.code,
          countryIso: selectedCountry?.iso,
          filters: serverFilters,
          page: cursor.nextPage || currentPage + 1,
        };

    let res = await fetchTgAccounts(requestOpts);
    if (accountsReqIdRef.current !== reqId) {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      return false;
    }

    const existingKeys = new Set(tgAccountsRef.current.map((a) => `${a.source}-${a.id}`));
    let fresh = res.accounts.filter((a) => !existingKeys.has(`${a.source}-${a.id}`));

    // Fallback to price cursor if page-based pagination returns duplicate page
    if (
      !res.error &&
      fresh.length === 0 &&
      !cursor.usePriceCursor &&
      ((!isHighSort && cursor.nextPmin) || (isHighSort && cursor.nextPmax))
    ) {
      const retryRes = await fetchTgAccounts({
        countryCode: selectedCountry?.code,
        countryIso: selectedCountry?.iso,
        filters: serverFilters,
        page: cursor.nextPage || currentPage + 1,
        pmin: !isHighSort ? cursor.nextPmin : undefined,
        pmax: isHighSort ? cursor.nextPmax : undefined,
      });
      if (accountsReqIdRef.current !== reqId) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
        return false;
      }
      const retryFresh = retryRes.accounts.filter((a) => !existingKeys.has(`${a.source}-${a.id}`));
      if (retryFresh.length > 0) {
        res = retryRes;
        fresh = retryFresh;
        nextCursorRef.current.usePriceCursor = true;
      }
    }

    if (res.error) {
      setAccountsError(res.error);
      loadingMoreRef.current = false;
      setLoadingMore(false);
      return false;
    }

    if (fresh.length > 0) {
      emptyPageStreakRef.current = 0;
      const merged = [...tgAccountsRef.current, ...fresh];
      tgAccountsRef.current = merged;
      setTgAccounts(merged);
    } else {
      emptyPageStreakRef.current += 1;
    }

    if (typeof res.totalItems === 'number') {
      setTotalApiItems(res.totalItems);
    }
    const nextResolvedPage = res.page || currentPage + 1;
    accountsPageRef.current = nextResolvedPage;
    setAccountsPage(nextResolvedPage);

    const canContinue = Boolean(res.hasNextPage && (fresh.length > 0 || emptyPageStreakRef.current < 2));
    hasNextPageRef.current = canContinue;
    setHasNextPage(canContinue);
    nextCursorRef.current = {
      nextPage: res.nextPage ?? (canContinue ? nextResolvedPage + 1 : null),
      nextPmin: res.nextPmin ?? cursor.nextPmin,
      nextPmax: res.nextPmax ?? cursor.nextPmax,
      usePriceCursor: nextCursorRef.current.usePriceCursor,
    };

    loadingMoreRef.current = false;
    setLoadingMore(false);
    return canContinue;
  }, [fetchTgAccounts, selectedCountry?.code, selectedCountry?.iso, serverFilters]);

  const startLoadAllAccounts = useCallback(async () => {
    if (autoLoadingAll) {
      autoLoadStopRef.current = true;
      setAutoLoadingAll(false);
      return;
    }
    const reqId = accountsReqIdRef.current;
    autoLoadStopRef.current = false;
    setAutoLoadingAll(true);

    while (!autoLoadStopRef.current && accountsReqIdRef.current === reqId) {
      const more = await loadMoreAccounts();
      if (!more || autoLoadStopRef.current || accountsReqIdRef.current !== reqId) break;
      await new Promise((r) => window.setTimeout(r, 950));
    }

    if (accountsReqIdRef.current === reqId) {
      setAutoLoadingAll(false);
    }
  }, [autoLoadingAll, loadMoreAccounts]);

  // Auto-load next page when user scrolls near the bottom sentinel
  useEffect(() => {
    if (!isSelectingTgAccount || !hasNextPage || accountsLoading || autoLoadingAll) return;
    const node = loadMoreSentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loadingMoreRef.current) {
          void loadMoreAccounts();
        }
      },
      { rootMargin: '280px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isSelectingTgAccount, hasNextPage, accountsLoading, autoLoadingAll, loadMoreAccounts]);

  useEffect(() => {
    if (currentServer !== 1) {
      setShowFilters(false);
    }
  }, [currentServer]);

  useEffect(() => {
    if (isSelectingTgCategory) {
      autoLoadStopRef.current = true;
      setAutoLoadingAll(false);
      setLoading(false);
      return;
    }
    if (isSelectingTgAccount) {
      void loadAccountsInitial();
      return;
    }
    if (isSelectingApp) {
      void loadApps();
    } else {
      void loadCountries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentServer,
    selectedAppCode,
    appOtpStage,
    tgStage,
    selectedCountry?.code,
    selectedCountry?.iso,
    serverFilters.category,
    serverFilters.spam,
    serverFilters.origin,
    serverFilters.premium,
    serverFilters.email,
    serverFilters.sort,
  ]);

  const switchCategoryInPlace = useCallback(
    (cat: TgAccountCategory, keepCountry: boolean) => {
      setSelectedTgCategory(cat);
      setSelectedTgAccount(null);
      if (!keepCountry) setSelectedCountry(null);
      if (cat === 'all') {
        setServerFilters((prev) => ({
          ...prev,
          category: 'all',
          origin: 'any',
          premium: 'any',
        }));
      } else if (cat === 'pushing') {
        setServerFilters((prev) => ({
          ...prev,
          category: 'pushing',
          origin: 'pushing',
          premium: 'any',
        }));
      } else if (cat === 'premium') {
        setServerFilters((prev) => ({
          ...prev,
          category: 'premium',
          origin: 'any',
          premium: 'premium',
        }));
      } else if (cat === 'autoreg') {
        setServerFilters((prev) => ({
          ...prev,
          category: 'autoreg',
          origin: 'autoreg',
          premium: 'any',
        }));
      }
    },
    [setSelectedCountry, setSelectedTgAccount, setSelectedTgCategory, setServerFilters],
  );

  const openAccountForBuy = useCallback(
    (acct: TgAccountOption) => {
      setSelectedCountry({
        code: acct.countryIso || acct.countryCode,
        iso: acct.countryIso,
        name: acct.countryName,
        flag: acct.flag,
        price: acct.price,
        stock: 1,
        source: acct.source,
      });
      setSelectedTgAccount(acct);
      navigateStore('buy');
    },
    [navigateStore, setSelectedCountry, setSelectedTgAccount],
  );

  const tgTitle = selectedTgCategory
    ? selectedTgCategory === 'all'
      ? 'All TG Accounts'
      : `${TG_CATEGORY_META[selectedTgCategory].title}s`
    : 'TG Accounts';

  const titles: Record<1 | 2 | 3, string> = {
    1: isSelectingTgCategory ? 'TG Accounts' : tgTitle,
    2: 'WhatsApp Numbers',
    3: isSelectingApp ? 'All App OTP' : `${selectedAppName || selectedAppCode.toUpperCase()} OTP`,
  };

  const filteredApps = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    return apps.filter(
      (a) => !q || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
    );
  }, [apps, appQuery]);

  const popularApps = useMemo(() => {
    const popularSet = ['tg', 'wa', 'ig', 'fb', 'go', 'tw', 'ot', 'lf', 'vi', 'ub', 'am', 'ds'];
    const byCode = new Map(apps.map((a) => [a.code.toLowerCase(), a]));
    return popularSet
      .map((code) => byCode.get(code))
      .filter((a): a is AppOtpServiceOption => Boolean(a));
  }, [apps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.iso || '').toLowerCase().includes(q),
    );
  }, [countries, query]);

  const extraWorldCountries = useMemo(() => {
    if (currentServer !== 1) return [];
    const liveIsos = new Set<string>();
    for (const c of countries) {
      if (c.iso) liveIsos.add(c.iso.toUpperCase());
      if (c.code) liveIsos.add(c.code.toUpperCase());
    }
    const q = query.trim().toLowerCase();
    return worldCountries.filter((c) => {
      if (liveIsos.has(c.iso.toUpperCase())) return false;
      return !q || c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q);
    });
  }, [currentServer, countries, worldCountries, query]);

  const filteredTgAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    return tgAccounts.filter(
      (a) =>
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.countryName.toLowerCase().includes(q) ||
        (a.countryIso || '').toLowerCase().includes(q) ||
        a.origin.toLowerCase().includes(q) ||
        (a.resaleOrigin || '').toLowerCase().includes(q) ||
        a.spamStatus.toLowerCase().includes(q) ||
        (a.dcId || '').toLowerCase().includes(q) ||
        (a.uploadedAt || '').toLowerCase().includes(q) ||
        (a.lastSeenAt || '').toLowerCase().includes(q) ||
        (a.isPremium ? 'premium' : 'normal').includes(q),
    );
  }, [tgAccounts, accountQuery]);

  const pickerCountries = useMemo(() => {
    const loadedCounts = new Map<string, number>();
    for (const a of tgAccounts) {
      const iso = (a.countryIso || a.countryCode || '').toUpperCase();
      if (iso) loadedCounts.set(iso, (loadedCounts.get(iso) || 0) + 1);
    }

    const q = countryPickerQuery.trim().toLowerCase();
    const list = worldCountries.map((c) => ({
      ...c,
      loadedCount: loadedCounts.get(c.iso.toUpperCase()) || 0,
    }));

    const matching = list.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q),
    );

    if (!q) {
      // Bubble countries already seen in loaded accounts to the top for convenience
      matching.sort((a, b) => {
        if (a.loadedCount > 0 && b.loadedCount === 0) return -1;
        if (b.loadedCount > 0 && a.loadedCount === 0) return 1;
        if (a.loadedCount !== b.loadedCount) return b.loadedCount - a.loadedCount;
        return 0;
      });
    }
    return matching;
  }, [worldCountries, tgAccounts, countryPickerQuery]);

  const sortToggleBtn = (
    <button
      type="button"
      onClick={() =>
        setServerFilters((prev) => ({
          ...prev,
          sort: prev.sort === 'high' ? 'low' : 'high',
        }))
      }
      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
    >
      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
      <span>{serverFilters.sort === 'high' ? 'Price: High → Low' : 'Price: Low → High'}</span>
    </button>
  );

  const filtersToggleBtn = (
    <button
      type="button"
      onClick={() => setShowFilters((v) => !v)}
      className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
        showFilters || activeFilterCount > 0
          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      <span>{activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : 'Filters'}</span>
    </button>
  );

  const categoryQuickTabs: { id: TgAccountCategory; label: string }[] = [
    { id: 'all', label: 'All Accounts' },
    { id: 'pushing', label: 'Pushing Account' },
    { id: 'premium', label: 'Premium Account' },
    { id: 'autoreg', label: 'Autoreg Account' },
  ];

  // Server 1 Stage 1: TG Account Categories (All, Pushing, Premium, Autoreg)
  if (isSelectingTgCategory) {
    const categories: {
      id: TgAccountCategory;
      title: string;
      desc: string;
      meta: string;
      icon: React.ComponentType<{ className?: string }>;
      tone: string;
    }[] = [
      {
        id: 'all',
        title: 'All Accounts',
        desc: 'Browse every live Telegram account in stock across all origins, types, and countries.',
        meta: 'Every Live Account',
        icon: Layers,
        tone: 'bg-slate-100 text-slate-800',
      },
      {
        id: 'pushing',
        title: 'Pushing Account',
        desc: 'Pushing accounts only — shows all live pushing Telegram accounts currently available.',
        meta: 'Pushing Only',
        icon: Send,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        id: 'premium',
        title: 'Premium Account',
        desc: 'Premium accounts only — shows all Telegram accounts with an active Premium subscription.',
        meta: 'Premium Only',
        icon: Crown,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        id: 'autoreg',
        title: 'Autoreg Account',
        desc: 'Autoreg accounts only — shows all verified auto-registered Telegram accounts in stock.',
        meta: 'Autoreg Only',
        icon: Zap,
        tone: 'bg-indigo-50 text-indigo-700',
      },
    ];

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateStore('store')}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Back to store"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">TG Accounts</h1>
              <p className="text-sm text-slate-500">
                Choose a category filter to browse all live accounts in stock
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">{filtersToggleBtn}</div>
        </div>

        <ServerFiltersDrawer
          open={showFilters}
          filters={serverFilters}
          onChange={setServerFilters}
          onReset={resetServerFilters}
          onApplyToCountries={() => {
            setSelectedTgCategory('all');
            setSelectedCountry(null);
            setShowFilters(false);
            setTgStage('accounts');
          }}
          onClose={() => setShowFilters(false)}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setQuery('');
                  setAccountQuery('');
                  selectTgCategory(cat.id);
                }}
                className="group glass-card glass-card-interactive rounded-2xl p-6 text-left flex flex-col justify-between active:scale-[0.98] cursor-pointer"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.tone}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-slate-900">{cat.title}</h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{cat.meta}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Server 3 Stage 1: All App OTP app selector
  if (isSelectingApp) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateStore('store')}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Back to store"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">All App OTP</h1>
              <p className="text-sm text-slate-500">Step 1 · Choose an app to see available countries</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadApps()}
              disabled={appsLoading}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${appsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={appQuery}
            onChange={(e) => setAppQuery(e.target.value)}
            placeholder="Search app name (Telegram, Instagram, Gmail...)"
            className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {appsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-[74px] animate-pulse" />
            ))}
          </div>
        ) : appsError ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-2">
            <div className="font-semibold text-sm text-red-700">Service Temporarily Unavailable</div>
            <p className="text-sm text-slate-600">{appsError}</p>
          </div>
        ) : !appsConfigured || filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center space-y-2">
            <div className="font-semibold text-sm text-slate-900">
              {!appsConfigured ? 'App OTP service is updating' : 'No apps matched'}
            </div>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {!appsConfigured
                ? 'This service is temporarily updating stock. Please check back shortly or contact support.'
                : `No apps matched "${appQuery || 'your search'}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {!appQuery.trim() && popularApps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-slate-800">Popular Apps</h2>
                  <span className="text-xs text-slate-500">Quick pick</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {popularApps.map((app) => (
                    <button
                      key={`pop-${app.code}`}
                      type="button"
                      onClick={() => {
                        setSelectedAppCode(app.code);
                        setSelectedAppName(app.name);
                        setQuery('');
                        setAppOtpStage('countries');
                      }}
                      className="bg-white rounded-2xl border border-indigo-200/80 hover:border-emerald-400 p-4 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-display font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                          {app.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-900 truncate">{app.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            {app.stock > 0 ? `${app.stock.toLocaleString()} available` : 'Select to check countries'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {app.minPrice !== null && (
                          <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                            from {formatMoneyCompact(app.minPrice)}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!appQuery.trim() && popularApps.length > 0 && (
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-slate-800">All Apps</h2>
                  <span className="text-xs text-slate-500 tabular-nums">{filteredApps.length} services</span>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredApps.map((app) => (
                  <button
                    key={app.code}
                    type="button"
                    onClick={() => {
                      setSelectedAppCode(app.code);
                      setSelectedAppName(app.name);
                      setQuery('');
                      setAppOtpStage('countries');
                    }}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-4 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-display font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                        {app.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{app.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          {app.stock > 0 ? `${app.stock.toLocaleString()} available` : 'Select to check countries'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.minPrice !== null && (
                        <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                          from {formatMoneyCompact(app.minPrice)}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Server 1 Live Accounts Browser (All Countries OR specific country, full API pagination)
  if (isSelectingTgAccount) {
    const activeCat: TgAccountCategory = selectedTgCategory || 'all';
    const loadedCount = tgAccounts.length;
    const shownCount = filteredTgAccounts.length;
    const countSubtitle = accountsLoading
      ? 'Loading live accounts…'
      : totalApiItems !== null && totalApiItems > loadedCount
        ? `Showing ${shownCount.toLocaleString()} of ${totalApiItems.toLocaleString()} live accounts`
        : `Showing ${shownCount.toLocaleString()} live account${shownCount === 1 ? '' : 's'}`;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                autoLoadStopRef.current = true;
                setAutoLoadingAll(false);
                setTgStage('categories');
              }}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Back to categories"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              {selectedCountry ? (
                <CountryFlag
                  iso={selectedCountry.iso}
                  flag={selectedCountry.flag}
                  name={selectedCountry.name}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {selectedCountry ? `${tgTitle} · ${selectedCountry.name}` : tgTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  {countSubtitle} · {formatFilterSummary(serverFilters)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {filtersToggleBtn}
            {sortToggleBtn}
            <button
              type="button"
              onClick={() => {
                autoLoadStopRef.current = true;
                setAutoLoadingAll(false);
                setTgStage('countries');
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              By Country
            </button>
            <button
              type="button"
              onClick={() => void loadAccountsInitial()}
              disabled={accountsLoading}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${accountsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Category Quick-Switch Filter Bar */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-200/65 max-w-full overflow-x-auto no-scrollbar">
          {categoryQuickTabs.map((tab) => {
            const active = activeCat === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchCategoryInPlace(tab.id, true)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <ServerFiltersDrawer
          open={showFilters}
          filters={serverFilters}
          onChange={setServerFilters}
          onReset={resetServerFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Search + Country Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={accountQuery}
              onChange={(e) => setAccountQuery(e.target.value)}
              placeholder="Search loaded accounts by country, ID, origin, spam, DC..."
              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Searchable World Country Filter */}
          <div className="relative sm:w-64" ref={countryPickerRef}>
            <button
              type="button"
              onClick={() => setCountryPickerOpen((v) => !v)}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-sm font-medium text-slate-800 flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2 min-w-0 truncate">
                {selectedCountry ? (
                  <>
                    <CountryFlag
                      iso={selectedCountry.iso}
                      flag={selectedCountry.flag}
                      name={selectedCountry.name}
                      size="sm"
                    />
                    <span className="truncate">{selectedCountry.name}</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">All Countries</span>
                  </>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {selectedCountry && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCountry(null);
                      setCountryPickerOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setSelectedCountry(null);
                        setCountryPickerOpen(false);
                      }
                    }}
                    className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    aria-label="Clear country filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {countryPickerOpen && (
              <div className="absolute right-0 sm:left-0 mt-2 w-full sm:w-72 bg-white rounded-2xl border border-slate-200 shadow-lg z-30 overflow-hidden">
                <div className="p-2.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={countryPickerQuery}
                      onChange={(e) => setCountryPickerQuery(e.target.value)}
                      placeholder="Filter country (India, USA, Russia...)"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry(null);
                      setCountryPickerOpen(false);
                      setCountryPickerQuery('');
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between gap-2 hover:bg-emerald-50/60 transition-colors ${
                      !selectedCountry ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      All Countries
                    </span>
                    {!selectedCountry && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  {pickerCountries.map((c) => {
                    const isSelected =
                      selectedCountry?.iso?.toUpperCase() === c.iso.toUpperCase() ||
                      selectedCountry?.code?.toUpperCase() === c.iso.toUpperCase();
                    return (
                      <button
                        key={c.iso}
                        type="button"
                        onClick={() => {
                          setSelectedCountry({
                            code: c.iso,
                            iso: c.iso,
                            name: c.name,
                            flag: c.flag,
                            price: 0,
                            stock: c.loadedCount || 0,
                            source: 'api',
                          });
                          setCountryPickerOpen(false);
                          setCountryPickerQuery('');
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0 truncate">
                          <CountryFlag iso={c.iso} flag={c.flag} name={c.name} size="sm" />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {c.loadedCount > 0 ? `${c.loadedCount} loaded` : c.iso}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {hasNextPage && !accountsLoading && (
            <button
              type="button"
              onClick={() => void startLoadAllAccounts()}
              className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                autoLoadingAll
                  ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {autoLoadingAll ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Loading ({loadedCount.toLocaleString()})
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  Load All Accounts
                </>
              )}
            </button>
          )}
        </div>

        {accountsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 h-[196px] animate-pulse" />
            ))}
          </div>
        ) : accountsError && tgAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-2">
            <div className="font-semibold text-sm text-red-700">Service Temporarily Unavailable</div>
            <p className="text-sm text-slate-600">{accountsError}</p>
            <button
              type="button"
              onClick={() => void loadAccountsInitial()}
              className="mt-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : !accountsConfigured || filteredTgAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center space-y-3">
            <div className="font-semibold text-sm text-slate-900">No matching accounts found</div>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {selectedCountry
                ? `No ${TG_CATEGORY_META[activeCat].shortLabel.toLowerCase()} accounts in ${selectedCountry.name} matched your active filters.`
                : `No ${TG_CATEGORY_META[activeCat].shortLabel.toLowerCase()} accounts matched your active filters right now.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {selectedCountry && (
                <button
                  type="button"
                  onClick={() => setSelectedCountry(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Show All Countries
                </button>
              )}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetServerFilters}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Reset Filters
                </button>
              )}
              {activeCat !== 'all' && (
                <button
                  type="button"
                  onClick={() => switchCategoryInPlace('all', false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Browse All Accounts
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTgAccounts.map((acct) => {
                const spamTone =
                  acct.spamStatus === 'Spam Free'
                    ? 'text-emerald-700'
                    : acct.spamStatus === 'Spam Blocked'
                      ? 'text-red-600'
                      : acct.spamStatus === 'Not Checked'
                        ? 'text-slate-600'
                        : 'text-amber-600';
                const detailBits: string[] = [];
                if (acct.dcId) detailBits.push(acct.dcId);
                if (typeof acct.chatsCount === 'number') detailBits.push(`${acct.chatsCount} chats`);
                if (typeof acct.channelsCount === 'number') detailBits.push(`${acct.channelsCount} channels`);

                return (
                  <button
                    key={`${acct.source}-${acct.id}`}
                    type="button"
                    onClick={() => openAccountForBuy(acct)}
                    className="group glass-card glass-card-interactive rounded-2xl p-5 text-left flex flex-col justify-between gap-4 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <CountryFlag
                              iso={acct.countryIso}
                              flag={acct.flag}
                              name={acct.countryName}
                              size="sm"
                            />
                            <span className="truncate">{acct.countryName}</span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                            {acct.title}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-base text-emerald-700 tabular-nums shrink-0">
                          {formatMoneyCompact(acct.price)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <div className="text-slate-400">Origin</div>
                          <div className="font-semibold text-slate-800 mt-0.5 truncate">{acct.origin}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Spam Status</div>
                          <div className={`font-semibold mt-0.5 truncate ${spamTone}`}>{acct.spamStatus}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Premium</div>
                          <div
                            className={`font-semibold mt-0.5 truncate ${
                              acct.isPremium ? 'text-amber-600' : 'text-slate-700'
                            }`}
                          >
                            {acct.isPremium ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">
                            {acct.isPremium ? 'Premium Ends' : '2FA Password'}
                          </div>
                          <div className="font-semibold text-slate-800 mt-0.5 truncate tabular-nums">
                            {acct.isPremium ? acct.premiumEndsAt || 'Active' : acct.twofa}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
                      <span className="truncate">
                        {detailBits.length > 0 ? detailBits.join(' · ') : `2FA: ${acct.twofa}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap shrink-0">
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {accountsError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-center justify-between gap-3">
                <span>{accountsError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAccountsError('');
                    void loadMoreAccounts();
                  }}
                  className="font-semibold text-amber-900 underline shrink-0"
                >
                  Retry Page
                </button>
              </div>
            )}

            {/* Infinite scroll sentinel & manual pagination controls */}
            <div ref={loadMoreSentinelRef} className="h-1" />

            <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 tabular-nums">
                Loaded <span className="font-semibold text-slate-900">{loadedCount.toLocaleString()}</span>
                {totalApiItems !== null && totalApiItems >= loadedCount ? (
                  <>
                    {' '}of <span className="font-semibold text-slate-900">{totalApiItems.toLocaleString()}</span>
                  </>
                ) : null}{' '}
                accounts · Page {accountsPage}
                {!hasNextPage ? ' · All available accounts loaded' : ''}
              </div>

              {hasNextPage && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadMoreAccounts()}
                    disabled={loadingMore || autoLoadingAll}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading next page…
                      </>
                    ) : (
                      <>
                        Load More Accounts
                        {totalApiItems !== null && totalApiItems > loadedCount
                          ? ` (${(totalApiItems - loadedCount).toLocaleString()} left)`
                          : ''}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void startLoadAllAccounts()}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      autoLoadingAll
                        ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {autoLoadingAll ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Stop Loading All
                      </>
                    ) : (
                      'Load All'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentServer === 1) {
                setTgStage('accounts');
              } else if (currentServer === 3) {
                setAppOtpStage('apps');
              } else {
                navigateStore('store');
              }
            }}
            className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
            aria-label={
              currentServer === 1
                ? 'Back to accounts'
                : currentServer === 3
                  ? 'Back to apps'
                  : 'Back to store'
            }
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{titles[currentServer]}</h1>
            <p className="text-sm text-slate-500">
              {currentServer === 1
                ? `${formatFilterSummary(serverFilters)} · Browse by country`
                : currentServer === 3
                  ? 'Step 2 · Choose a country for instant OTP'
                  : `Server ${currentServer} · Live availability`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {currentServer === 1 && filtersToggleBtn}
          {currentServer === 1 && sortToggleBtn}
          {currentServer === 1 && (
            <button
              type="button"
              onClick={() => {
                setSelectedCountry(null);
                setTgStage('accounts');
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              View All Accounts
            </button>
          )}
          {currentServer === 3 && (
            <button
              type="button"
              onClick={() => setAppOtpStage('apps')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Change App
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadCountries()}
            disabled={loading}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {currentServer === 1 && (
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-200/65 max-w-full overflow-x-auto no-scrollbar">
          {categoryQuickTabs.map((tab) => {
            const active = (selectedTgCategory || 'all') === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchCategoryInPlace(tab.id, false)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {currentServer === 1 && (
        <ServerFiltersDrawer
          open={showFilters}
          filters={serverFilters}
          onChange={setServerFilters}
          onReset={resetServerFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any country (India, USA, Russia, UK...)"
          className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl glass-input border border-white/80 ring-1 ring-slate-200/70 text-sm focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card rounded-2xl p-4 h-[74px] animate-pulse" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="glass-card rounded-2xl border-red-200 p-6 text-center space-y-2">
          <div className="font-semibold text-sm text-red-700">Service Temporarily Unavailable</div>
          <p className="text-sm text-slate-600">{errorMsg}</p>
        </div>
      ) : !configured || (filtered.length === 0 && extraWorldCountries.length === 0) ? (
        <div className="glass-card rounded-2xl py-14 px-6 text-center space-y-2">
          <div className="font-semibold text-sm text-slate-900">
            {!configured ? `Server ${currentServer} is updating stock` : 'No countries available'}
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {!configured
              ? 'This service is temporarily updating stock. Please check back shortly or contact support.'
              : `No countries matched "${query || (currentServer === 1 ? formatFilterSummary(serverFilters) : 'your search')}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {filtered.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-sm text-slate-800">
                  {currentServer === 1 ? 'Live Stock Countries' : 'All Available Countries'}
                </h2>
                <span className="text-xs font-medium text-emerald-700 tabular-nums">
                  {filtered.length.toLocaleString()} {filtered.length === 1 ? 'country' : 'countries'}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map((c) => (
                  <button
                    key={`${c.source || 'api'}-${c.code}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c);
                      if (currentServer === 1) {
                        setSelectedTgAccount(null);
                        setAccountQuery('');
                        setShowFilters(false);
                        setTgStage('accounts');
                      } else {
                        navigateStore('buy');
                      }
                    }}
                    className="glass-card glass-card-interactive rounded-2xl p-4 text-left flex items-center justify-between gap-4 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <CountryFlag iso={c.iso} flag={c.flag} name={c.name} />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{c.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          {c.stock.toLocaleString()} available
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-base text-emerald-700 tabular-nums shrink-0">
                      {currentServer === 1 ? `from ${formatMoneyCompact(c.price)}` : formatMoneyCompact(c.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentServer === 1 && extraWorldCountries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-sm text-slate-800">
                    All Other Countries · Live Lookup
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap any country below to browse its available accounts
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0">
                  {extraWorldCountries.length} more
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {extraWorldCountries.map((wc) => (
                  <button
                    key={`world-${wc.iso}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry({
                        code: wc.iso,
                        iso: wc.iso,
                        name: wc.name,
                        flag: wc.flag,
                        price: 0,
                        stock: 0,
                        source: 'api',
                      });
                      setSelectedTgAccount(null);
                      setAccountQuery('');
                      setShowFilters(false);
                      setTgStage('accounts');
                    }}
                    className="glass-card glass-card-interactive rounded-2xl p-3.5 text-left flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CountryFlag iso={wc.iso} flag={wc.flag} name={wc.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{wc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Check live stock</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BuyConfirmView: React.FC = () => {
  const {
    currentServer,
    selectedAppCode,
    selectedAppName,
    selectedTgCategory,
    serverFilters,
    selectedCountry,
    selectedTgAccount,
    currentUser,
    userState,
    setSelectedOrderId,
    navigateStore,
    placeCountryOrder,
  } = useStore();
  const [buying, setBuying] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    setAgreedTerms(false);
  }, [selectedCountry?.code, selectedTgAccount?.id, currentServer]);

  if (!selectedCountry) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-500">No country selected.</p>
        <button
          type="button"
          onClick={() => navigateStore('countries')}
          className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
        >
          Choose Country
        </button>
      </div>
    );
  }

  const tgLabel = selectedTgCategory
    ? `TG Account · ${TG_CATEGORY_META[selectedTgCategory].title}`
    : 'TG Account';

  const serviceName = {
    1: tgLabel,
    2: 'WhatsApp OTP',
    3: `App OTP (${selectedAppName || selectedAppCode.toUpperCase()})`,
  }[currentServer];

  const activeLockedOrder = (userState?.orders || []).find(
    (o) =>
      (o.kind === 'TG' || o.kind === 'WhatsApp' || o.kind === 'AppOTP') &&
      (o.status === 'WAIT_CODE' || o.status === 'WAIT_RETRY'),
  );

  const effectiveAccount = currentServer === 1 ? selectedTgAccount : null;
  const effectivePrice = effectiveAccount ? effectiveAccount.price : selectedCountry.price;
  const hasFunds = (currentUser?.balance || 0) >= effectivePrice;
  const requiresTerms = currentServer === 1;

  const handleBuy = async () => {
    if (buying || activeLockedOrder || (requiresTerms && !agreedTerms)) return;
    setBuying(true);
    const serviceCode = currentServer === 2 ? 'wa' : currentServer === 3 ? selectedAppCode : undefined;
    const order = await placeCountryOrder(
      currentServer,
      selectedCountry,
      serviceCode,
      currentServer === 1 ? serverFilters : undefined,
      effectiveAccount,
    );
    setBuying(false);
    if (order) navigateStore('order-result');
  };

  const accountSpecRows: Array<{ label: string; value: string; tone?: string }> = [];
  if (effectiveAccount) {
    accountSpecRows.push({ label: 'Origin', value: effectiveAccount.origin });
    if (effectiveAccount.resaleOrigin) {
      accountSpecRows.push({ label: 'Resale Origin', value: effectiveAccount.resaleOrigin });
    }
    accountSpecRows.push({
      label: 'Spam Status',
      value: effectiveAccount.spamStatus,
      tone:
        effectiveAccount.spamStatus === 'Spam Free'
          ? 'text-emerald-700'
          : effectiveAccount.spamStatus === 'Spam Blocked'
            ? 'text-red-600'
            : effectiveAccount.spamStatus === 'Not Checked'
              ? 'text-slate-600'
              : 'text-amber-600',
    });
    accountSpecRows.push({
      label: 'Telegram Premium',
      value: effectiveAccount.isPremium ? 'Yes' : 'No',
      tone: effectiveAccount.isPremium ? 'text-amber-600' : 'text-slate-900',
    });
    if (effectiveAccount.isPremium) {
      accountSpecRows.push({
        label: 'Premium Ends Date',
        value: effectiveAccount.premiumEndsAt || 'Active',
        tone: 'text-amber-700',
      });
    }
    accountSpecRows.push({ label: '2FA Password', value: effectiveAccount.twofa || 'None' });
    if (typeof effectiveAccount.emailLinked === 'boolean') {
      accountSpecRows.push({
        label: 'Email Linked',
        value: effectiveAccount.emailLinked ? 'Yes' : 'No',
      });
    }
    if (effectiveAccount.dcId) {
      accountSpecRows.push({ label: 'Data Center', value: effectiveAccount.dcId });
    }
    if (typeof effectiveAccount.channelsCount === 'number') {
      accountSpecRows.push({
        label: 'Channels',
        value: effectiveAccount.channelsCount.toLocaleString(),
      });
    }
    if (typeof effectiveAccount.chatsCount === 'number') {
      accountSpecRows.push({
        label: 'Chats / Groups',
        value: effectiveAccount.chatsCount.toLocaleString(),
      });
    }
    if (typeof effectiveAccount.conversationsCount === 'number') {
      accountSpecRows.push({
        label: 'Conversations',
        value: effectiveAccount.conversationsCount.toLocaleString(),
      });
    }
    if (typeof effectiveAccount.contactsCount === 'number') {
      accountSpecRows.push({
        label: 'Contacts',
        value: effectiveAccount.contactsCount.toLocaleString(),
      });
    }
    if (typeof effectiveAccount.adminCount === 'number') {
      const adminLabel =
        effectiveAccount.adminSubsCount && effectiveAccount.adminSubsCount > 0
          ? `${effectiveAccount.adminCount} (${effectiveAccount.adminSubsCount.toLocaleString()} subs)`
          : effectiveAccount.adminCount.toLocaleString();
      accountSpecRows.push({ label: 'Admin Channels', value: adminLabel });
    }
    if (typeof effectiveAccount.starsCount === 'number') {
      accountSpecRows.push({
        label: 'Telegram Stars',
        value: effectiveAccount.starsCount.toLocaleString(),
      });
    }
    if (typeof effectiveAccount.giftsCount === 'number' || typeof effectiveAccount.nftGiftsCount === 'number') {
      const g = effectiveAccount.giftsCount ?? 0;
      const nft = effectiveAccount.nftGiftsCount ?? 0;
      accountSpecRows.push({
        label: 'Gifts / NFT Gifts',
        value: `${g.toLocaleString()} / ${nft.toLocaleString()}`,
      });
    }
    if (effectiveAccount.uploadedAt) {
      accountSpecRows.push({ label: 'Uploaded', value: effectiveAccount.uploadedAt });
    }
    if (effectiveAccount.lastSeenAt) {
      accountSpecRows.push({ label: 'Last Active', value: effectiveAccount.lastSeenAt });
    }
    if (effectiveAccount.sessionCreatedAt) {
      accountSpecRows.push({ label: 'Session Created', value: effectiveAccount.sessionCreatedAt });
    }
    if (effectiveAccount.year) {
      accountSpecRows.push({ label: 'Account Year', value: effectiveAccount.year });
    }
    if (effectiveAccount.categoryLabel) {
      accountSpecRows.push({ label: 'Tier / Note', value: effectiveAccount.categoryLabel });
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('countries')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label={effectiveAccount ? 'Back to accounts' : 'Back to countries'}
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {effectiveAccount ? 'Account Details & Purchase' : 'Confirm Purchase'}
          </h1>
          {effectiveAccount && (
            <p className="text-xs text-slate-500 truncate max-w-sm">{effectiveAccount.title}</p>
          )}
        </div>
      </div>

      {effectiveAccount && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-slate-900">
                Telegram Account Specifications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{effectiveAccount.title}</p>
            </div>
            <span className="font-mono font-bold text-lg text-emerald-700 tabular-nums shrink-0">
              {formatMoneyCompact(effectiveAccount.price)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accountSpecRows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <span className="text-xs text-slate-500">{row.label}</span>
                <span className={`text-xs font-semibold tabular-nums text-right ${row.tone || 'text-slate-900'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center text-sm py-1">
          <span className="text-slate-500">Service</span>
          <span className="font-semibold text-slate-900">{serviceName}</span>
        </div>
        {currentServer === 1 && countActiveFilters(serverFilters) > 0 && (
          <div className="flex justify-between items-center text-sm py-1 border-t border-slate-100 pt-3">
            <span className="text-slate-500">Filters</span>
            <span className="font-medium text-slate-700 text-right">{formatFilterSummary(serverFilters)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm py-1 border-t border-slate-100 pt-3">
          <span className="text-slate-500">Country</span>
          <span className="font-semibold text-slate-900 inline-flex items-center gap-2">
            <CountryFlag iso={selectedCountry.iso} flag={selectedCountry.flag} name={selectedCountry.name} size="sm" />
            <span>{selectedCountry.name}</span>
          </span>
        </div>
        {currentServer === 2 && (
          <div className="flex justify-between items-center text-sm py-1 border-t border-slate-100 pt-3">
            <span className="text-slate-500">Retry Code</span>
            <span className={`font-semibold ${selectedCountry.retry ? 'text-emerald-700' : 'text-slate-600'}`}>
              {selectedCountry.retry ? 'Supported (Yes)' : 'Single Use (No)'}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm py-1 border-t border-slate-100 pt-3">
          <span className="text-slate-500">Price</span>
          <span className="font-mono font-bold text-xl text-emerald-700 tabular-nums">
            {formatMoneyCompact(effectivePrice)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm py-1 border-t border-slate-100 pt-3">
          <span className="text-slate-500">Your Balance</span>
          <span className={`font-mono font-semibold tabular-nums ${hasFunds ? 'text-slate-900' : 'text-red-600'}`}>
            {formatMoney(currentUser?.balance)}
          </span>
        </div>

        {requiresTerms && (
          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 space-y-2.5 text-xs text-amber-950">
            <div className="font-semibold text-amber-900">Purchase Terms &amp; Account Notice</div>
            <ul className="space-y-1 text-amber-900/90 leading-relaxed list-disc pl-4">
              <li>Verify the Origin, Spam status, and 2FA details shown above before confirming.</li>
              <li>Immediately secure your account after login (terminate other sessions &amp; set your own 2FA).</li>
              <li>All TG Account deliveries are final — no refunds once number or session credentials are issued.</li>
            </ul>
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-900">I agree to the terms and want to purchase</span>
            </label>
          </div>
        )}

        {activeLockedOrder && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-950">
                <div className="font-semibold text-amber-900">
                  Active Order In Progress ({activeLockedOrder.id})
                </div>
                <p className="text-amber-900/90 leading-relaxed">
                  You already have an active {activeLockedOrder.kind} order waiting for OTP. Please wait for the OTP to arrive (it completes automatically) or cancel it before placing another TG Account, WhatsApp, or App OTP order.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(activeLockedOrder.id);
                navigateStore('order-result');
              }}
              className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              Open Active Order
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100">
          {hasFunds ? (
            <button
              type="button"
              disabled={buying || Boolean(activeLockedOrder) || (requiresTerms && !agreedTerms)}
              onClick={handleBuy}
              className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.98]"
            >
              {activeLockedOrder
                ? 'Complete Active Order First'
                : buying
                  ? 'Processing order…'
                  : 'Confirm & Buy Now'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateStore('deposit')}
              className="w-full min-h-[48px] py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all active:scale-[0.98]"
            >
              Insufficient Balance · Add Funds
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center leading-relaxed">
        Numbers and account credentials are delivered automatically and saved in your Orders.
      </p>
    </div>
  );
};

export const OrderResultView: React.FC = () => {
  const {
    userState,
    selectedOrderId,
    navigateStore,
    pollOrderOtp,
    retryOrderOtp,
    cancelOrder,
    fetchTgOrderCode,
    fetchTgOrderSession,
    resetTgOrderSessions,
    confirmAction,
    showToast,
  } = useStore();
  const [polling, setPolling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [tgCodeLoading, setTgCodeLoading] = useState(false);
  const [tgSessionLoading, setTgSessionLoading] = useState(false);
  const [tgResetLoading, setTgResetLoading] = useState(false);
  const [tgSessionData, setTgSessionData] = useState<{ stringSession: string; dcId?: string } | null>(null);

  const order = userState?.orders.find((o) => o.id === selectedOrderId);

  useEffect(() => {
    setTgSessionData(null);
  }, [order?.id]);

  // Automatic live OTP polling every 5 seconds while waiting for SMS (Server 2 & 3)
  useEffect(() => {
    if (!order || (order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY')) return;
    const timer = window.setInterval(() => {
      pollOrderOtp(order.id, true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order?.id, order?.status, pollOrderOtp]);

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-500">Order not found.</p>
        <button
          type="button"
          onClick={() => navigateStore('orders')}
          className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const copyVal = (val: string, label: string) => {
    navigator.clipboard?.writeText(val);
    showToast(`${label} copied`);
  };

  const handleManualPoll = async () => {
    setPolling(true);
    try {
      await pollOrderOtp(order.id, false);
    } finally {
      setPolling(false);
    }
  };

  const handleRetrySms = async () => {
    setRetrying(true);
    try {
      await retryOrderOtp(order.id);
    } finally {
      setRetrying(false);
    }
  };

  const handleGetTgCode = async () => {
    setTgCodeLoading(true);
    try {
      await fetchTgOrderCode(order.id);
    } finally {
      setTgCodeLoading(false);
    }
  };

  const handleGetTgSession = async () => {
    setTgSessionLoading(true);
    try {
      const res = await fetchTgOrderSession(order.id);
      if (res) setTgSessionData(res);
    } finally {
      setTgSessionLoading(false);
    }
  };

  const handleResetTgSessions = () => {
    confirmAction({
      title: 'Terminate other sessions?',
      message:
        'This resets all other active Telegram authorizations except the account session. Make sure you have your login code or session ready.',
      confirmLabel: 'Terminate Sessions',
      danger: true,
      onConfirm: async () => {
        setTgResetLoading(true);
        try {
          await resetTgOrderSessions(order.id);
        } finally {
          setTgResetLoading(false);
        }
      },
    });
  };

  const isWaitingOtp = order.status === 'WAIT_CODE' || order.status === 'WAIT_RETRY';

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('orders')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back to orders"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Order Details</h1>
          <p className="text-xs font-mono text-slate-500">{order.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Service / Item</span>
          <span className="font-semibold text-slate-900">{order.country || order.name || order.kind}</span>
        </div>

        {order.phone && (
          <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-500">{order.kind === 'SMM' ? 'Target Link' : 'Phone / Delivery'}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-900">{order.phone}</span>
              <button
                type="button"
                onClick={() => copyVal(order.phone || '', 'Phone')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                aria-label="Copy number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {order.credentials && (
          <div className="flex justify-between items-start gap-3 text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-500 shrink-0">Credentials</span>
            <span className="font-mono text-xs text-slate-900 text-right break-all">{order.credentials}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
          <span className="text-slate-500">Amount Paid</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">{formatMoneyCompact(order.price)}</span>
        </div>

        <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
          <span className="text-slate-500">Status</span>
          <span
            className={`font-semibold ${
              order.status === 'DONE' || order.status === 'DELIVERED'
                ? 'text-emerald-700'
                : order.status === 'CANCELLED'
                  ? 'text-red-600'
                  : 'text-amber-600'
            }`}
          >
            {order.status === 'WAIT_RETRY' ? 'WAIT_RETRY · Retry Available' : order.status}
          </span>
        </div>

        {order.code && (
          <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-500">OTP / Code</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xl text-emerald-700 tracking-wider tabular-nums">
                {order.code}
              </span>
              <button
                type="button"
                onClick={() => copyVal(order.code || '', 'OTP Code')}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                aria-label="Copy OTP"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
          <span className="text-slate-500">Timestamp</span>
          <span className="font-mono text-xs text-slate-600">{order.date}</span>
        </div>
      </div>

      {order.kind === 'TG' && order.canFetchTgActions && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-sm text-slate-900">Telegram Account Controls</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Request your Telegram login code, export session string, or reset other active authorizations.
              </p>
            </div>
            {order.otherSessionsTerminated && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
                <Check className="w-3.5 h-3.5" />
                Secured
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={tgCodeLoading}
              onClick={handleGetTgCode}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tgCodeLoading ? 'animate-spin' : ''}`} />
              {tgCodeLoading ? 'Fetching Code…' : 'Get Login Code'}
            </button>
            <button
              type="button"
              disabled={tgSessionLoading}
              onClick={handleGetTgSession}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all active:scale-[0.98]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {tgSessionLoading ? 'Loading Session…' : 'Session String'}
            </button>
          </div>
          <button
            type="button"
            disabled={tgResetLoading}
            onClick={handleResetTgSessions}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60 text-red-600 font-semibold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {tgResetLoading
              ? 'Terminating Other Sessions…'
              : order.otherSessionsTerminated
                ? 'Terminate Other Sessions Again'
                : 'Terminate Other Sessions'}
          </button>

          {tgSessionData && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Telethon Session String {tgSessionData.dcId ? `(${tgSessionData.dcId})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => copyVal(tgSessionData.stringSession, 'Session String')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-700 break-all select-all bg-white border border-slate-200 rounded-lg p-2.5">
                {tgSessionData.stringSession}
              </div>
            </div>
          )}
        </div>
      )}

      {isWaitingOtp && (
        <div className="space-y-3">
          {order.status === 'WAIT_RETRY' ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 text-center">
              If this code does not work, tap <strong>Retry SMS</strong> to request a fresh verification code.
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              Auto-checking for incoming SMS every 5 seconds…
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {order.status === 'WAIT_RETRY' && (
              <button
                type="button"
                disabled={retrying}
                onClick={handleRetrySms}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all active:scale-[0.98]"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Requesting…' : 'Retry SMS'}
              </button>
            )}
            <button
              type="button"
              disabled={polling}
              onClick={handleManualPoll}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
              {polling ? 'Checking OTP…' : order.status === 'WAIT_RETRY' ? 'Check Again' : 'Check OTP Now'}
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={() =>
                confirmAction({
                  title: 'Cancel order & refund?',
                  message: `Cancelling order ${order.id} will refund ₹${order.price} back to your wallet if confirmed.`,
                  confirmLabel: 'Cancel & Refund',
                  danger: true,
                  onConfirm: async () => {
                    if (cancelling) return;
                    setCancelling(true);
                    try {
                      await cancelOrder(order.id);
                    } finally {
                      setCancelling(false);
                    }
                  },
                })
              }
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60 text-red-600 font-semibold text-sm whitespace-nowrap transition-all active:scale-[0.98]"
            >
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DigitalShopView: React.FC = () => {
  const { userState, navigateStore, buyDigitalProduct, confirmAction } = useStore();
  const activeProducts = userState?.digital || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('store')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back to store"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Digital Shop</h1>
          <p className="text-sm text-slate-500">Instant digital delivery products</p>
        </div>
      </div>

      {activeProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-14 text-center text-sm text-slate-500">
          No digital products are currently active.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="font-display font-bold text-base text-slate-900">{p.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="font-mono font-bold text-lg text-emerald-700 tabular-nums">
                  {formatMoneyCompact(p.price)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    confirmAction({
                      title: `Purchase ${p.name}?`,
                      message: `${formatMoneyCompact(p.price)} will be deducted from your wallet for instant delivery.`,
                      confirmLabel: 'Buy Now',
                      onConfirm: async () => {
                        const ok = await buyDigitalProduct(p.id);
                        if (ok) navigateStore('order-result');
                      },
                    })
                  }
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SmmServicesView: React.FC = () => {
  const { userState, currentUser, navigateStore, placeSmmOrder } = useStore();
  const cats = userState?.smm.cats || [];
  const services = userState?.smm.services || [];

  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [orderingSvc, setOrderingSvc] = useState<SmmService | null>(null);
  const [targetLink, setTargetLink] = useState('');
  const [qty, setQty] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const visibleServices = useMemo(
    () => (selectedCat === 0 ? services : services.filter((s) => s.cat === selectedCat)),
    [services, selectedCat],
  );

  const computedTotal = orderingSvc ? Number(((qty / 1000) * orderingSvc.rate).toFixed(2)) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('store')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back to store"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">SMM Services</h1>
          <p className="text-sm text-slate-500">Automated social media growth services</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCat(0)}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
            selectedCat === 0
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCat(c.id)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
              selectedCat === c.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {visibleServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center text-sm text-slate-500">
          No SMM services available right now. Please check back soon.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServices.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono text-slate-400">Service #{s.id}</div>
                <h2 className="font-display font-bold text-base text-slate-900 mt-1">{s.name}</h2>
                {s.desc && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.desc}</p>}
                <div className="text-xs text-slate-500 mt-3 tabular-nums">
                  Min {s.min.toLocaleString()} · Max {s.max.toLocaleString()}
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-base text-emerald-700 tabular-nums">
                    {formatMoneyCompact(s.rate)}
                  </span>
                  <span className="text-xs text-slate-400"> / 1k</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOrderingSvc(s);
                    setTargetLink('');
                    setQty(s.min);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors"
                >
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {orderingSvc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setOrderingSvc(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">Service #{orderingSvc.id}</div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{orderingSvc.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderingSvc(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Link or Username
                </label>
                <input
                  type="text"
                  value={targetLink}
                  onChange={(e) => setTargetLink(e.target.value)}
                  placeholder="https://t.me/channel or @username"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Quantity ({orderingSvc.min} – {orderingSvc.max})
                </label>
                <input
                  type="number"
                  min={orderingSvc.min}
                  max={orderingSvc.max}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 0)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Total Cost (Balance: {formatMoneyCompact(currentUser?.balance)})</span>
                <span className="font-mono font-bold text-lg text-emerald-700 tabular-nums">
                  {formatMoney(computedTotal)}
                </span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  const ok = await placeSmmOrder(orderingSvc, targetLink, qty);
                  setSubmitting(false);
                  if (ok) {
                    setOrderingSvc(null);
                    navigateStore('orders');
                  }
                }}
                className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Placing Order…' : 'Place SMM Order'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
