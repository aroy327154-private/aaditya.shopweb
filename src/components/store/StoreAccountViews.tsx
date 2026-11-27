import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Download,
  Gift,
  KeyRound,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  User as UserIcon,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { formatMoney, formatMoneyCompact } from '../../lib/format';
import { SupportTicket, TicketMessage } from '../../types';
import { LiveAmbientBackdrop } from './LiveAmbientBackdrop';

export const DepositView: React.FC = () => {
  const { userState, navigateStore, submitDeposit, showToast } = useStore();
  const [method, setMethod] = useState<'upi' | 'fampay' | 'bharatpe' | 'usdt'>('upi');
  const [amount, setAmount] = useState<string>('500');
  const [utr, setUtr] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<string>('');

  const p = userState?.payments;
  const usdtRate = userState?.settings.usdtRate || 92;

  const enabledMethods = useMemo(() => {
    const all = [
      {
        id: 'upi' as const,
        title: 'UPI Manual',
        sub: 'Any UPI app · Submit UTR',
        icon: WalletIcon,
        enabled: Boolean(p?.manualEnabled),
        customQr: p?.manualQr || '',
        qrPayload: p?.manualUpi
          ? `upi://pay?pa=${encodeURIComponent(p.manualUpi)}&pn=${encodeURIComponent(p.manualName || 'AadityaTg.Store')}&am=${encodeURIComponent(String(parseFloat(amount) || 0))}&cu=INR`
          : '',
      },
      {
        id: 'fampay' as const,
        title: 'Fampay UPI',
        sub: 'Submit UTR for verification',
        icon: Zap,
        enabled: Boolean(p?.fampayEnabled),
        customQr: p?.fampayQr || '',
        qrPayload: p?.fampayUpi
          ? `upi://pay?pa=${encodeURIComponent(p.fampayUpi)}&pn=${encodeURIComponent(p.fampayName || 'AadityaTg.Store')}&am=${encodeURIComponent(String(parseFloat(amount) || 0))}&cu=INR`
          : '',
      },
      {
        id: 'bharatpe' as const,
        title: 'BharatPe UPI',
        sub: 'Submit UTR for verification',
        icon: Smartphone,
        enabled: Boolean(p?.bharatpeEnabled),
        customQr: p?.bharatpeQr || '',
        qrPayload: p?.bharatpeUpi
          ? `upi://pay?pa=${encodeURIComponent(p.bharatpeUpi)}&pn=${encodeURIComponent('AadityaTg.Store')}&am=${encodeURIComponent(String(parseFloat(amount) || 0))}&cu=INR`
          : '',
      },
      {
        id: 'usdt' as const,
        title: 'USDT (TRC20)',
        sub: `Rate ₹${usdtRate} / USDT`,
        icon: CreditCard,
        enabled: Boolean(p?.usdtEnabled),
        customQr: p?.usdtQr || '',
        qrPayload: p?.usdtAddr || '',
      },
    ];
    return all.filter((m) => m.enabled);
  }, [p, usdtRate, amount]);

  useEffect(() => {
    if (enabledMethods.length > 0 && !enabledMethods.some((m) => m.id === method)) {
      setMethod(enabledMethods[0].id);
    }
  }, [enabledMethods, method]);

  const activeMethod = enabledMethods.find((m) => m.id === method) || enabledMethods[0];

  useEffect(() => {
    let active = true;
    if (!activeMethod || activeMethod.customQr || !activeMethod.qrPayload) {
      setGeneratedQr('');
      return () => {
        active = false;
      };
    }
    QRCode.toDataURL(activeMethod.qrPayload, {
      width: 240,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setGeneratedQr(url);
      })
      .catch(() => {
        if (active) setGeneratedQr('');
      });
    return () => {
      active = false;
    };
  }, [activeMethod]);

  const activeQrSrc = activeMethod?.customQr || generatedQr;

  const copyDetail = (val: string, label: string) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    showToast(`${label} copied`);
  };

  const handleDownloadQr = () => {
    if (!activeQrSrc || !activeMethod) return;
    const link = document.createElement('a');
    link.href = activeQrSrc;
    link.download = `${activeMethod.id}-payment-qr.png`;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethod) return;
    const num = parseFloat(amount) || 0;
    setSubmitting(true);
    const ok = await submitDeposit(activeMethod.title, num, utr);
    setSubmitting(false);
    if (ok) navigateStore('wallet');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('wallet')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back to wallet"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Add Funds</h1>
          <p className="text-sm text-slate-500">Scan QR or copy payment ID and submit your UTR / TXID</p>
        </div>
      </div>

      {enabledMethods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="font-display text-lg font-bold text-slate-900">
            No payment methods are active right now
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Deposits are temporarily paused by the store admin. You can redeem a gift code or reach out to support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigateStore('redeem')}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              Redeem Code
            </button>
            <button
              type="button"
              onClick={() => navigateStore('support')}
              className="min-h-[42px] px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              Contact Support
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-5">
          <div className="md:col-span-5 space-y-2.5">
            {enabledMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = activeMethod?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`w-full rounded-2xl border p-4 text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{m.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-7 glass-card rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['100', '500', '1000', '2000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                      amount === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min ₹10)"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {activeQrSrc && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center text-center gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <img
                    src={activeQrSrc}
                    alt={`${activeMethod?.title} QR Code`}
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="flex items-center justify-between w-full gap-2 text-xs text-slate-500">
                  <span>
                    {activeMethod?.customQr ? 'Scan QR code to pay' : 'Auto-generated QR for selected amount'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save QR
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              {activeMethod?.id === 'upi' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">UPI ID</span>
                    <button
                      type="button"
                      onClick={() => copyDetail(p?.manualUpi || '', 'UPI ID')}
                      className="font-mono font-semibold text-slate-900 inline-flex items-center gap-1.5 hover:text-emerald-700"
                    >
                      {p?.manualUpi || 'Not configured in Admin'}
                      {p?.manualUpi && <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Beneficiary</span>
                    <span className="font-medium text-slate-900">{p?.manualName || '—'}</span>
                  </div>
                </>
              )}

              {activeMethod?.id === 'fampay' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Fampay UPI</span>
                    <button
                      type="button"
                      onClick={() => copyDetail(p?.fampayUpi || '', 'Fampay UPI')}
                      className="font-mono font-semibold text-slate-900 inline-flex items-center gap-1.5 hover:text-emerald-700"
                    >
                      {p?.fampayUpi || 'Not configured in Admin'}
                      {p?.fampayUpi && <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Display Name</span>
                    <span className="font-medium text-slate-900">{p?.fampayName || '—'}</span>
                  </div>
                </>
              )}

              {activeMethod?.id === 'bharatpe' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">BharatPe UPI</span>
                    <button
                      type="button"
                      onClick={() => copyDetail(p?.bharatpeUpi || '', 'BharatPe UPI')}
                      className="font-mono font-semibold text-slate-900 inline-flex items-center gap-1.5 hover:text-emerald-700"
                    >
                      {p?.bharatpeUpi || 'Not configured'}
                      {p?.bharatpeUpi && <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Merchant ID: {p?.bharatpeMid || '—'}</p>
                </>
              )}

              {activeMethod?.id === 'usdt' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Address ({p?.usdtNet || 'TRC20'})</span>
                    <button
                      type="button"
                      onClick={() => copyDetail(p?.usdtAddr || '', 'USDT Address')}
                      className="font-mono text-xs font-semibold text-slate-900 truncate inline-flex items-center gap-1.5 hover:text-emerald-700"
                    >
                      {p?.usdtAddr || 'Not set'}
                      {p?.usdtAddr && <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Estimated USDT</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {((parseFloat(amount) || 0) / usdtRate).toFixed(2)} USDT
                    </span>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {activeMethod?.id === 'usdt' ? 'Transaction Hash (TXID)' : 'UTR / 12-Digit Reference Number'}
              </label>
              <input
                type="text"
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder={activeMethod?.id === 'usdt' ? '0x...' : 'Enter UTR number'}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {userState?.imapAutoVerifyEnabled && activeMethod?.id !== 'usdt' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800">
                Instant Gmail verification is active — enter your exact UTR after paying for automatic wallet credit.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98]"
            >
              {submitting
                ? userState?.imapAutoVerifyEnabled
                  ? 'Verifying Payment…'
                  : 'Submitting…'
                : userState?.imapAutoVerifyEnabled
                  ? 'Submit & Verify Payment'
                  : 'Submit Payment for Verification'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const WalletView: React.FC = () => {
  const { currentUser, userState, navigateStore, verifyDepositViaImap } = useStore();
  const [filter, setFilter] = useState<'all' | 'recharge' | 'purchase' | 'redeem'>('all');
  const [checkingDepId, setCheckingDepId] = useState<number | null>(null);

  const items = useMemo(() => {
    const rows: {
      id: string;
      depositId?: number;
      isRedeem?: boolean;
      kind: 'recharge' | 'purchase' | 'redeem';
      label: string;
      amount: number;
      status: string;
      date: string;
    }[] = [];

    (userState?.deposits || []).forEach((d) => {
      rows.push({
        id: `dep-${d.id}`,
        depositId: d.id,
        isRedeem: d.isRedeem,
        kind: d.isRedeem ? 'redeem' : 'recharge',
        label: d.method,
        amount: d.amount,
        status: d.status,
        date: d.date,
      });
    });

    (userState?.orders || []).forEach((o) => {
      rows.push({
        id: `ord-${o.id}`,
        kind: 'purchase',
        label: o.country || o.name || o.kind,
        amount: -o.price,
        status: o.status,
        date: o.date,
      });
    });

    rows.sort((a, b) => b.date.localeCompare(a.date));
    return filter === 'all' ? rows : rows.filter((r) => r.kind === filter);
  }, [userState?.deposits, userState?.orders, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Wallet</h1>
        <p className="text-sm text-slate-500 mt-0.5">Balance and complete transaction ledger</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_22px_48px_-16px_rgba(4,20,16,0.52)] border border-white/15">
        <LiveAmbientBackdrop variant="hero" className="absolute inset-0 w-full h-full" />
        <div className="relative z-10">
          <div className="text-emerald-100/90 text-sm font-medium">Available Balance</div>
          <div className="font-display text-3xl sm:text-4xl font-extrabold mt-1.5 tabular-nums tracking-tight">
            {formatMoney(currentUser?.balance)}
          </div>
          <div className="text-xs text-emerald-100/80 mt-2 tabular-nums">
            Lifetime deposited: {formatMoney(currentUser?.deposited)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateStore('deposit')}
          className="relative z-10 min-h-[46px] px-6 py-2.5 rounded-xl bg-white/95 text-emerald-900 hover:bg-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Funds
        </button>
      </div>

      <div className="space-y-3.5">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs max-w-full overflow-x-auto no-scrollbar">
          {(
            [
              ['all', 'All'],
              ['recharge', 'Recharges'],
              ['purchase', 'Purchases'],
              ['redeem', 'Redeem'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                filter === key
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-200/60">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No transactions yet</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    {item.date} · {item.status}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {userState?.imapAutoVerifyEnabled &&
                    item.kind === 'recharge' &&
                    !item.isRedeem &&
                    item.status === 'pending' &&
                    item.depositId && (
                      <button
                        type="button"
                        disabled={checkingDepId === item.depositId}
                        onClick={async () => {
                          setCheckingDepId(item.depositId!);
                          await verifyDepositViaImap(item.depositId!);
                          setCheckingDepId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${checkingDepId === item.depositId ? 'animate-spin' : ''}`}
                        />
                        {checkingDepId === item.depositId ? 'Checking…' : 'Verify Now'}
                      </button>
                    )}
                  <div
                    className={`font-mono font-bold text-sm tabular-nums ${
                      item.amount > 0 ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {item.amount > 0 ? '+' : '-'}
                    {formatMoney(Math.abs(item.amount))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const OrdersView: React.FC = () => {
  const { userState, navigateStore, setSelectedOrderId } = useStore();
  const [filter, setFilter] = useState<'all' | 'TG' | 'WhatsApp' | 'AppOTP' | 'Digital' | 'SMM'>('all');

  const orders = useMemo(() => {
    const mine = userState?.orders || [];
    return filter === 'all' ? mine : mine.filter((o) => o.kind === filter);
  }, [userState?.orders, filter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">All purchases and live OTP activations</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-200/65 max-w-full overflow-x-auto no-scrollbar">
        {(
          [
            ['all', 'All'],
            ['TG', 'TG'],
            ['WhatsApp', 'WhatsApp'],
            ['AppOTP', 'App OTP'],
            ['Digital', 'Digital'],
            ['SMM', 'SMM'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              filter === key
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] overflow-hidden divide-y divide-slate-100">
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No orders in this category</div>
        ) : (
          orders.map((o) => (
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
                  {o.id} · {o.phone || '—'} · {o.date}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                  {formatMoneyCompact(o.price)}
                </div>
                <div
                  className={`text-xs font-semibold mt-0.5 ${
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
    </div>
  );
};

export const RedeemView: React.FC = () => {
  const { navigateStore, redeemGiftCode } = useStore();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await redeemGiftCode(code);
    setSubmitting(false);
    if (ok) {
      setCode('');
      navigateStore('wallet');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('home')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back home"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Redeem Code</h1>
          <p className="text-sm text-slate-500">Enter a gift or promo code to credit your wallet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <label htmlFor="redeem-input" className="block text-sm font-medium text-slate-700 mb-1.5">
            Promo Code
          </label>
          <input
            id="redeem-input"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm tracking-widest uppercase focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          {submitting ? 'Verifying…' : 'Redeem Code'}
        </button>
      </form>
    </div>
  );
};

export const SupportView: React.FC = () => {
  const {
    currentUser,
    userState,
    navigateStore,
    openTicketChat,
    supportAdminOnline,
    liveWsConnected,
    showToast,
  } = useStore();
  const tickets = userState?.tickets || [];
  const supportUrl = userState?.settings.support;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Support</h1>
          <p className="text-sm text-slate-500 mt-0.5">Open any ticket for live chat with our support team</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span
            className={`w-2 h-2 rounded-full ${
              supportAdminOnline
                ? 'bg-emerald-500'
                : liveWsConnected
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
            }`}
          />
          <span>
            {supportAdminOnline
              ? 'Admin Online · Live Chat'
              : liveWsConnected
                ? 'Live Chat Ready'
                : 'Connecting…'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">Your User ID (attach when contacting support)</div>
          <div className="font-mono font-bold text-lg text-slate-900 mt-0.5">#{currentUser?.id}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(String(currentUser?.id || ''));
            showToast('User ID copied');
          }}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Copy className="w-4 h-4" />
          Copy ID
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigateStore('new-ticket')}
          className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4" />
          New Live Support Chat
        </button>
        {supportUrl && (
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-[48px] px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm inline-flex items-center justify-center whitespace-nowrap shrink-0"
          >
            Telegram Support
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {tickets.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-2">
            <div className="text-sm font-medium text-slate-700">No support chats yet</div>
            <p className="text-xs text-slate-500">
              Start a new ticket to open a live chat directly with an admin.
            </p>
          </div>
        ) : (
          tickets.map((t) => {
            const messages = t.messages || [];
            const lastMsg = messages[messages.length - 1];
            const unread = t.unreadByUser || 0;
            const previewText = lastMsg
              ? `${lastMsg.sender === 'admin' ? 'Support: ' : 'You: '}${lastMsg.text}`
              : t.adminReply || t.message;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openTicketChat(t.id)}
                className="w-full text-left px-5 py-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 truncate">{t.subject}</span>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tabular-nums">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 truncate">{previewText}</div>
                  <div className="text-xs text-slate-400">
                    #{t.id} · {t.cat} · {messages.length || 1} msg{(messages.length || 1) === 1 ? '' : 's'} ·{' '}
                    {t.lastMessageAt || t.date}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`text-xs font-semibold capitalize ${
                      t.status === 'open' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap">
                    Open Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export const TicketChatView: React.FC = () => {
  const {
    userState,
    selectedTicketId,
    navigateStore,
    sendTicketMessage,
    reopenSupportTicket,
    markTicketRead,
    sendTicketTyping,
    ticketTypingState,
    supportAdminOnline,
    liveWsConnected,
    isViewAs,
  } = useStore();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const tickets = userState?.tickets || [];
  const ticket =
    tickets.find((t) => t.id === selectedTicketId) ||
    (tickets.length > 0 ? tickets[0] : undefined);

  const messages = useMemo(() => {
    if (!ticket) return [];
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
      return ticket.messages;
    }
    const fallback: TicketMessage[] = [
      {
        id: `legacy_${ticket.id}_u`,
        sender: 'user',
        senderName: userState?.user.name || 'You',
        text: ticket.message,
        createdAt: ticket.date,
      },
    ];
    if (ticket.adminReply) {
      fallback.push({
        id: `legacy_${ticket.id}_a`,
        sender: 'admin' as const,
        senderName: 'Support Team',
        text: ticket.adminReply,
        createdAt: ticket.repliedAt || ticket.date,
      });
    }
    return fallback;
  }, [ticket, userState?.user.name]);

  useEffect(() => {
    if (!ticket) return;
    if ((ticket.unreadByUser || 0) > 0) {
      markTicketRead(ticket.id, false);
    }
  }, [ticket?.id, ticket?.unreadByUser, markTicketRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, ticketTypingState[ticket?.id || 0]?.until]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
      }
      if (ticket && isTypingRef.current) {
        sendTicketTyping(ticket.id, false);
        isTypingRef.current = false;
      }
    };
  }, [ticket?.id, sendTicketTyping]);

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigateStore('support')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="font-semibold text-slate-900">Ticket not found</div>
          <button
            type="button"
            onClick={() => navigateStore('new-ticket')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  const typingInfo = ticketTypingState[ticket.id];
  const adminTyping = typingInfo?.by === 'admin';

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (isViewAs || ticket.status !== 'open') return;
    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true;
      sendTicketTyping(ticket.id, true);
    }
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTicketTyping(ticket.id, false);
      }
    }, 2200);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = draft.trim();
    if (!clean || sending || isViewAs) return;
    setSending(true);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTicketTyping(ticket.id, false);
    }
    const ok = await sendTicketMessage(ticket.id, clean);
    if (ok) setDraft('');
    setSending(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100dvh-11.5rem)] md:h-[calc(100dvh-9.5rem)] min-h-[460px]">
        {/* Chat Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigateStore('support')}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Back to support"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                {ticket.subject}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span className="font-mono">#{ticket.id}</span>
                <span>·</span>
                <span className="capitalize">{ticket.cat}</span>
                <span>·</span>
                <span
                  className={`font-semibold capitalize ${
                    ticket.status === 'open' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                supportAdminOnline
                  ? 'bg-emerald-500'
                  : liveWsConnected
                    ? 'bg-amber-400'
                    : 'bg-slate-300'
              }`}
            />
            <span className="hidden sm:inline">
              {supportAdminOnline ? 'Admin Online' : liveWsConnected ? 'Live Chat' : 'Reconnecting'}
            </span>
          </div>
        </div>

        {/* Scrollable Message History */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-slate-50/70">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                  }`}
                >
                  {!isUser && (
                    <div className="text-[11px] font-semibold text-emerald-700">
                      Support Team
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>
                  <div
                    className={`text-[10px] font-mono text-right ${
                      isUser ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {m.createdAt}
                  </div>
                </div>
              </div>
            );
          })}

          {adminTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-slate-500 italic">
                Support Team is typing…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Bottom Composer */}
        {ticket.status === 'closed' ? (
          <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600">
              This ticket is closed. Reopen it to send more messages.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={reopening || isViewAs}
                onClick={async () => {
                  setReopening(true);
                  await reopenSupportTicket(ticket.id);
                  setReopening(false);
                }}
                className="min-h-[38px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap"
              >
                {reopening ? 'Reopening…' : 'Reopen Chat'}
              </button>
              <button
                type="button"
                onClick={() => navigateStore('new-ticket')}
                className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap"
              >
                New Ticket
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-end gap-2.5 shrink-0"
          >
            <textarea
              rows={1}
              value={draft}
              disabled={isViewAs}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={isViewAs ? 'Read-only preview mode' : 'Type a message to Support…'}
              className="flex-1 min-h-[44px] max-h-28 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none resize-none"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim() || isViewAs}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const NewTicketView: React.FC = () => {
  const { navigateStore, createSupportTicket, openTicketChat } = useStore();
  const [cat, setCat] = useState<SupportTicket['cat']>('payment');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const created = await createSupportTicket(cat, message);
    setSubmitting(false);
    if (created) {
      openTicketChat(created.id);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateStore('support')}
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shrink-0"
          aria-label="Back to support"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="font-display text-2xl font-bold text-slate-900">Start Support Chat</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['payment', 'Payment'],
                ['order', 'Order'],
                ['account', 'Account'],
                ['other', 'Other'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCat(key)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  cat === key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ticket-msg" className="block text-sm font-medium text-slate-700 mb-1.5">
            First message
          </label>
          <textarea
            id="ticket-msg"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue (include order ID or UTR number if applicable)..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <MessageSquare className="w-4 h-4" />
          {submitting ? 'Opening Chat…' : 'Start Live Chat'}
        </button>
      </form>
    </div>
  );
};

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    logoutUser,
    navigateStore,
    isViewAs,
    exitViewAs,
    updateProfile,
    changeUserPassword,
    showToast,
  } = useStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const tier =
    currentUser.deposited >= 5000 ? 'Gold Tier' : currentUser.deposited >= 1000 ? 'Silver Tier' : 'Bronze Tier';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewAs) {
      showToast('Exit Admin preview to edit this user profile', 'err');
      return;
    }
    setSavingProfile(true);
    await updateProfile(name, username, email);
    setSavingProfile(false);
  };

  const hasExistingPassword = currentUser.hasPassword !== false;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewAs) {
      showToast('Exit Admin preview to change user password', 'err');
      return;
    }
    if (hasExistingPassword && !oldPassword) {
      showToast('Please enter your old password', 'err');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'err');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'err');
      return;
    }
    setSavingPassword(true);
    const ok = await changeUserPassword(oldPassword, newPassword, confirmPassword);
    setSavingPassword(false);
    if (ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile details, Gmail, and password</p>
      </div>

      {/* Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-display text-2xl font-bold shrink-0">
            {(currentUser.name || currentUser.email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-xl text-slate-900 truncate">{currentUser.name}</div>
            <div className="text-sm text-slate-500 truncate">{currentUser.email}</div>
            <div className="text-xs font-semibold text-emerald-700 mt-1">
              {tier} · ID #{currentUser.id} · Joined {currentUser.joined}
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-xs text-slate-500">Wallet Balance</div>
          <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {formatMoney(currentUser.balance)}
          </div>
        </div>
      </div>

      {/* Two-Column Edit Profile & Change Password */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Edit Name & Gmail */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">Profile &amp; Gmail</h2>
              <p className="text-xs text-slate-500">Update your display name, username, or email</p>
            </div>
          </div>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-slate-600 mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-username" className="block text-xs font-medium text-slate-600 mb-1">
              Username
            </label>
            <input
              id="prof-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-email" className="block text-xs font-medium text-slate-600 mb-1">
              Gmail / Email Address
            </label>
            <input
              id="prof-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full min-h-[46px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        {/* Change Password (Old + New + Confirm, or Set Password for Google users) */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                {hasExistingPassword ? 'Change Password' : 'Set Account Password'}
              </h2>
              <p className="text-xs text-slate-500">
                {hasExistingPassword
                  ? 'Verify your old password before setting a new one'
                  : 'Optional: set a password to also sign in with email'}
              </p>
            </div>
          </div>

          {hasExistingPassword && (
            <div>
              <label htmlFor="old-pass" className="block text-xs font-medium text-slate-600 mb-1">
                Old Password
              </label>
              <input
                id="old-pass"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-pass" className="block text-xs font-medium text-slate-600 mb-1">
              New Password
            </label>
            <input
              id="new-pass"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirm-pass" className="block text-xs font-medium text-slate-600 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-pass"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full min-h-[46px] py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98]"
          >
            {savingPassword ? 'Updating Password…' : hasExistingPassword ? 'Update Password' : 'Set Password'}
          </button>
        </form>
      </div>

      <div className={`grid gap-3 ${isViewAs ? 'sm:grid-cols-2' : ''}`}>
        <button
          type="button"
          onClick={() => navigateStore('support')}
          className="min-h-[48px] px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
        >
          Help &amp; Support
        </button>
        {isViewAs && (
          <button
            type="button"
            onClick={exitViewAs}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            Exit Admin Preview
          </button>
        )}
      </div>

      {!isViewAs && (
        <button
          type="button"
          onClick={logoutUser}
          className="w-full min-h-[48px] py-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      )}
    </div>
  );
};
