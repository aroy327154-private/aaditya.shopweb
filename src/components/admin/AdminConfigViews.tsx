import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CloudUpload,
  Copy,
  Database,
  Download,
  ExternalLink,
  GitBranch,
  KeyRound,
  Mail,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { formatMoneyCompact } from '../../lib/format';
import { AdminPermissionKey, SmmService } from '../../types';

const PERM_LIST: { key: AdminPermissionKey; label: string }[] = [
  { key: 'p_add_stock', label: 'Add Stock' },
  { key: 'p_manage_stock', label: 'Manage Stock' },
  { key: 'p_stats', label: 'Stats & Broadcast' },
  { key: 'p_bal', label: 'Balance & Users' },
  { key: 'p_settings', label: 'Settings' },
];

function compressQrImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxSide = 512;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

const PaymentToggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={`Toggle ${label}`}
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2 cursor-pointer select-none"
  >
    <span
      className={`text-xs font-semibold ${checked ? 'text-emerald-700' : 'text-slate-400'}`}
    >
      {checked ? 'Active' : 'Off'}
    </span>
    <span
      className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
        checked ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
    </span>
  </button>
);

const QrUploadControl: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const { showToast } = useStore();
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressQrImage(file);
      onChange(dataUrl);
      showToast(`${label} QR ready — click Save to apply`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load QR image', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-slate-500" />
          Payment QR Code
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Remove QR
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt={`${label} QR`}
            className="w-20 h-20 rounded-xl border border-slate-200 bg-white object-contain p-1 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-[11px] text-slate-400 text-center px-1 shrink-0">
            <QrCode className="w-5 h-5 mb-1 text-slate-300" />
            Auto QR
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <label className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{busy ? 'Loading…' : 'Upload QR Image'}</span>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <input
            value={value.startsWith('data:image/') ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              value.startsWith('data:image/')
                ? 'Uploaded image ready (or paste https:// URL)'
                : 'Or paste QR image URL (https://...)'
            }
            className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
};

export const AdminPaymentsView: React.FC = () => {
  const { adminData, savePaymentSettings, saveImapSettings, testImapSettings, syncImapDeposits } = useStore();
  const [p, setP] = useState(adminData!.payments);
  const [imapEmail, setImapEmail] = useState(adminData!.imap?.email || '');
  const [imapPass, setImapPass] = useState('');
  const [imapHost, setImapHost] = useState(adminData!.imap?.host || 'imap.gmail.com');
  const [imapPort, setImapPort] = useState(String(adminData!.imap?.port || 993));
  const [imapFilter, setImapFilter] = useState(adminData!.imap?.senderFilter ?? 'fampay,famapp');
  const [imapEnabled, setImapEnabled] = useState(Boolean(adminData!.imap?.enabled));
  const [imapAutoOnSubmit, setImapAutoOnSubmit] = useState(
    adminData!.imap?.autoApproveOnSubmit !== false,
  );
  const [imapInterval, setImapInterval] = useState(String(adminData!.imap?.pollIntervalSec || 30));
  const [testingImap, setTestingImap] = useState(false);
  const [syncingImap, setSyncingImap] = useState(false);

  useEffect(() => {
    if (adminData?.payments) setP(adminData.payments);
  }, [adminData?.payments]);

  useEffect(() => {
    if (adminData?.imap) {
      setImapEmail(adminData.imap.email || '');
      setImapHost(adminData.imap.host || 'imap.gmail.com');
      setImapPort(String(adminData.imap.port || 993));
      setImapFilter(adminData.imap.senderFilter ?? 'fampay,famapp');
      setImapEnabled(Boolean(adminData.imap.enabled));
      setImapAutoOnSubmit(adminData.imap.autoApproveOnSubmit !== false);
      setImapInterval(String(adminData.imap.pollIntervalSec || 30));
    }
  }, [adminData?.imap]);

  if (!adminData) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Payment Methods</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Turn gateways on or off, set custom QR codes, and configure minimum &amp; maximum deposit limits for every payment method.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* UPI Manual */}
        <div className="admin-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-slate-900">UPI Manual</h2>
            <PaymentToggle
              label="UPI Manual"
              checked={p.manualEnabled}
              onChange={(next) => {
                setP((prev) => ({ ...prev, manualEnabled: next }));
                void savePaymentSettings({ manualEnabled: next }, 'UPI Manual');
              }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">UPI ID</label>
            <input
              value={p.manualUpi}
              onChange={(e) => setP({ ...p, manualUpi: e.target.value })}
              placeholder="yourupi@bank"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Beneficiary Name</label>
            <input
              value={p.manualName}
              onChange={(e) => setP({ ...p, manualName: e.target.value })}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-500">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.manualMin ?? 10}
                onChange={(e) => setP({ ...p, manualMin: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.manualMax ?? 50000}
                onChange={(e) => setP({ ...p, manualMax: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <QrUploadControl
            label="UPI Manual"
            value={p.manualQr || ''}
            onChange={(val) => setP({ ...p, manualQr: val })}
          />
          <button
            type="button"
            onClick={() =>
              void savePaymentSettings(
                {
                  manualUpi: p.manualUpi,
                  manualName: p.manualName,
                  manualEnabled: p.manualEnabled,
                  manualQr: p.manualQr || '',
                  manualMin: Number(p.manualMin) || 10,
                  manualMax: Number(p.manualMax) || 50000,
                },
                'UPI Manual',
              )
            }
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save UPI Manual
          </button>
        </div>

        {/* Fampay */}
        <div className="admin-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-slate-900">Fampay</h2>
            <PaymentToggle
              label="Fampay"
              checked={p.fampayEnabled}
              onChange={(next) => {
                setP((prev) => ({ ...prev, fampayEnabled: next }));
                void savePaymentSettings({ fampayEnabled: next }, 'Fampay');
              }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Fampay UPI</label>
            <input
              value={p.fampayUpi}
              onChange={(e) => setP({ ...p, fampayUpi: e.target.value })}
              placeholder="name@fam"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Display Name</label>
            <input
              value={p.fampayName}
              onChange={(e) => setP({ ...p, fampayName: e.target.value })}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-500">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.fampayMin ?? 10}
                onChange={(e) => setP({ ...p, fampayMin: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.fampayMax ?? 50000}
                onChange={(e) => setP({ ...p, fampayMax: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <QrUploadControl
            label="Fampay"
            value={p.fampayQr || ''}
            onChange={(val) => setP({ ...p, fampayQr: val })}
          />
          <button
            type="button"
            onClick={() =>
              void savePaymentSettings(
                {
                  fampayUpi: p.fampayUpi,
                  fampayName: p.fampayName,
                  fampayEnabled: p.fampayEnabled,
                  fampayQr: p.fampayQr || '',
                  fampayMin: Number(p.fampayMin) || 10,
                  fampayMax: Number(p.fampayMax) || 50000,
                },
                'Fampay',
              )
            }
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save Fampay
          </button>
        </div>

        {/* BharatPe */}
        <div className="admin-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-slate-900">BharatPe</h2>
            <PaymentToggle
              label="BharatPe"
              checked={p.bharatpeEnabled}
              onChange={(next) => {
                setP((prev) => ({ ...prev, bharatpeEnabled: next }));
                void savePaymentSettings({ bharatpeEnabled: next }, 'BharatPe');
              }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">BharatPe UPI</label>
            <input
              value={p.bharatpeUpi}
              onChange={(e) => setP({ ...p, bharatpeUpi: e.target.value })}
              placeholder="merchant@bharatpe"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Merchant ID</label>
            <input
              value={p.bharatpeMid}
              onChange={(e) => setP({ ...p, bharatpeMid: e.target.value })}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-500">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.bharatpeMin ?? 10}
                onChange={(e) => setP({ ...p, bharatpeMin: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.bharatpeMax ?? 50000}
                onChange={(e) => setP({ ...p, bharatpeMax: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <QrUploadControl
            label="BharatPe"
            value={p.bharatpeQr || ''}
            onChange={(val) => setP({ ...p, bharatpeQr: val })}
          />
          <button
            type="button"
            onClick={() =>
              void savePaymentSettings(
                {
                  bharatpeUpi: p.bharatpeUpi,
                  bharatpeMid: p.bharatpeMid,
                  bharatpeEnabled: p.bharatpeEnabled,
                  bharatpeQr: p.bharatpeQr || '',
                  bharatpeMin: Number(p.bharatpeMin) || 10,
                  bharatpeMax: Number(p.bharatpeMax) || 50000,
                },
                'BharatPe',
              )
            }
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save BharatPe
          </button>
        </div>

        {/* USDT */}
        <div className="admin-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-slate-900">USDT (Crypto)</h2>
            <PaymentToggle
              label="USDT"
              checked={p.usdtEnabled}
              onChange={(next) => {
                setP((prev) => ({ ...prev, usdtEnabled: next }));
                void savePaymentSettings({ usdtEnabled: next }, 'USDT');
              }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Wallet Address</label>
            <input
              value={p.usdtAddr}
              onChange={(e) => setP({ ...p, usdtAddr: e.target.value })}
              placeholder="TRC20 / BEP20 address"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Network</label>
            <input
              value={p.usdtNet}
              onChange={(e) => setP({ ...p, usdtNet: e.target.value })}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-500">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.usdtMin ?? 100}
                onChange={(e) => setP({ ...p, usdtMin: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={p.usdtMax ?? 500000}
                onChange={(e) => setP({ ...p, usdtMax: Math.max(1, Number(e.target.value) || 1) })}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <QrUploadControl
            label="USDT"
            value={p.usdtQr || ''}
            onChange={(val) => setP({ ...p, usdtQr: val })}
          />
          <button
            type="button"
            onClick={() =>
              void savePaymentSettings(
                {
                  usdtAddr: p.usdtAddr,
                  usdtNet: p.usdtNet,
                  usdtEnabled: p.usdtEnabled,
                  usdtQr: p.usdtQr || '',
                  usdtMin: Number(p.usdtMin) || 100,
                  usdtMax: Number(p.usdtMax) || 500000,
                },
                'USDT',
              )
            }
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save USDT
          </button>
        </div>
      </div>

      {/* Gmail IMAP Auto-Verification for FamPay / UPI */}
      <div className="admin-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                FamPay &amp; UPI Gmail IMAP Auto-Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reads incoming FamPay / UPI alert emails in Gmail and automatically approves deposits when exact UTR &amp; ₹ amount match.
              </p>
            </div>
          </div>
          <PaymentToggle
            label="Gmail IMAP Auto-Verification"
            checked={imapEnabled}
            onChange={(next) => {
              setImapEnabled(next);
              void saveImapSettings({ enabled: next });
            }}
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="text-xs text-slate-500">Gmail Address (Alert Inbox)</label>
            <input
              type="email"
              value={imapEmail}
              onChange={(e) => setImapEmail(e.target.value)}
              placeholder="youralerts@gmail.com"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">
              Google App Password{' '}
              <span className="font-mono text-slate-400">({adminData.imap?.passMask || 'Not set'})</span>
            </label>
            <input
              type="password"
              value={imapPass}
              onChange={(e) => setImapPass(e.target.value)}
              placeholder={
                adminData.imap?.passConfigured
                  ? 'Leave blank to keep saved password'
                  : '16-char Google App Password'
              }
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Sender / Email Keyword Filter</label>
            <input
              value={imapFilter}
              onChange={(e) => setImapFilter(e.target.value)}
              placeholder="fampay,famapp (blank = all alerts)"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">IMAP Host</label>
            <input
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              placeholder="imap.gmail.com"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">IMAP Port (SSL)</label>
            <input
              type="number"
              value={imapPort}
              onChange={(e) => setImapPort(e.target.value)}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Background Check Interval (sec)</label>
            <input
              type="number"
              min={15}
              max={300}
              value={imapInterval}
              onChange={(e) => setImapInterval(e.target.value)}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={imapAutoOnSubmit}
            onChange={(e) => setImapAutoOnSubmit(e.target.checked)}
          />
          Verify immediately when user submits UTR (and retry automatically in background if email arrives late)
        </label>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-600 leading-relaxed">
          Setup: Enable <strong>2-Step Verification</strong> on your Gmail account, create a 16-character{' '}
          <strong>Google App Password</strong> (myaccount.google.com/apppasswords), and enable IMAP in Gmail settings.
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={async () => {
              await saveImapSettings({
                enabled: imapEnabled,
                host: imapHost.trim() || 'imap.gmail.com',
                port: parseInt(imapPort, 10) || 993,
                email: imapEmail.trim(),
                ...(imapPass.trim() ? { appPassword: imapPass.trim() } : {}),
                senderFilter: imapFilter.trim(),
                autoApproveOnSubmit: imapAutoOnSubmit,
                pollIntervalSec: Math.max(15, parseInt(imapInterval, 10) || 20),
              });
              setImapPass('');
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Save IMAP Settings
          </button>
          <button
            type="button"
            disabled={testingImap}
            onClick={async () => {
              setTestingImap(true);
              await testImapSettings({
                host: imapHost.trim() || 'imap.gmail.com',
                port: parseInt(imapPort, 10) || 993,
                email: imapEmail.trim(),
                ...(imapPass.trim() ? { appPassword: imapPass.trim() } : {}),
              });
              setTestingImap(false);
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs font-semibold"
          >
            {testingImap ? 'Testing IMAP…' : 'Test Gmail Connection'}
          </button>
          <button
            type="button"
            disabled={syncingImap}
            onClick={async () => {
              setSyncingImap(true);
              await syncImapDeposits();
              setSyncingImap(false);
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingImap ? 'animate-spin' : ''}`} />
            {syncingImap ? 'Checking Inbox…' : 'Sync Pending Deposits'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminBroadcastView: React.FC = () => {
  const { adminData, sendBroadcast, deleteBroadcast } = useStore();
  const [msg, setMsg] = useState('');

  if (!adminData) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    await sendBroadcast(msg);
    setMsg('');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Broadcast</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Publish announcements to all {adminData.users.length} users (shown on their Home screen)
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Announcement Message</label>
          <textarea
            rows={5}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Write your broadcast update..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-slate-900 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send to {adminData.users.length} Users
        </button>
      </form>

      {adminData.broadcasts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <div className="px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500">Recent Broadcasts</div>
          {adminData.broadcasts.map((b) => (
            <div key={b.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-900">{b.message}</div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {b.date} · {b.recipients} recipients
                </div>
              </div>
              <button
                type="button"
                onClick={() => void deleteBroadcast(b.id)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 shrink-0"
                aria-label="Delete broadcast"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminApiKeysView: React.FC = () => {
  const { adminData, createApiKey, toggleApiKey, removeApiKey, showToast } = useStore();
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState('');
  const [days, setDays] = useState('30');
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);

  if (!adminData) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = await createApiKey(parseInt(owner, 10) || 100001, parseInt(days, 10) || 30);
    if (key) {
      setLastCreatedKey(key);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-sm text-slate-500 mt-0.5">Reseller API access keys</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {lastCreatedKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-emerald-900">New API key generated (shown once)</div>
            <div className="font-mono text-xs text-emerald-800 break-all mt-0.5">{lastCreatedKey}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(lastCreatedKey);
              showToast('API key copied');
            }}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Key
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Owner ID</th>
              <th className="py-3 px-4">Key Prefix</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Expires</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adminData.apikeys.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No API keys created yet
                </td>
              </tr>
            ) : (
              adminData.apikeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">#{k.id}</td>
                  <td className="py-3 px-4 font-mono text-xs tabular-nums">{k.owner}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">{k.prefix}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold capitalize ${
                        k.status === 'active' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{k.expires}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleApiKey(k.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {k.status === 'active' ? 'Suspend' : 'Resume'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeApiKey(k.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Create API Key</h2>
              <input
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Owner User ID (e.g. 100001)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <input
                required
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="Valid days"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Generate
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminManageAdminsView: React.FC = () => {
  const { adminData, addAdminAccount, toggleAdminPermission, changeAdminPassword, removeAdminAccount, showToast } =
    useStore();
  const [openAdd, setOpenAdd] = useState(false);
  const [pwTarget, setPwTarget] = useState<{ id: number; username: string } | null>(null);
  const [newPw, setNewPw] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState<Record<AdminPermissionKey, boolean>>({
    p_add_stock: true,
    p_manage_stock: true,
    p_stats: true,
    p_bal: false,
    p_settings: false,
  });

  if (!adminData) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'err');
      return;
    }
    const ok = await addAdminAccount(username, password, perms);
    if (ok) {
      setUsername('');
      setPassword('');
      setOpenAdd(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Manage Admins</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sub-admins and granular role permissions</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenAdd(true)}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Permissions</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adminData.admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-slate-400">
                  No sub-admins created yet
                </td>
              </tr>
            ) : (
              adminData.admins.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{a.username}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      {PERM_LIST.map((p) => (
                        <label key={p.key} className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={a[p.key]}
                            onChange={() => void toggleAdminPermission(a.id, p.key)}
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPwTarget({ id: a.id, username: a.username });
                          setNewPw('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        Password
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeAdminAccount(a.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Sub-Admin Modal */}
      <AnimatePresence>
        {openAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setOpenAdd(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAdd}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Add Sub-Admin</h2>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <input
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-slate-500">Permissions</div>
                {PERM_LIST.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={perms[p.key]}
                      onChange={(e) => setPerms({ ...perms, [p.key]: e.target.checked })}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenAdd(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Add
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {pwTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPwTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Change Password · {pwTarget.username}
              </h2>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPwTarget(null)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (newPw.length < 6) {
                      showToast('Password must be at least 6 characters', 'err');
                      return;
                    }
                    await changeAdminPassword(pwTarget.id, newPw);
                    setPwTarget(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminServerApisView: React.FC = () => {
  const { adminData, saveServerConfig, testServerConfig, removeServerConfig, confirmAction } = useStore();
  const [drafts, setDrafts] = useState(() =>
    (adminData?.servers || []).map((s) => ({
      no: s.no,
      url: s.url,
      key: '',
      margin: String(s.margin),
      lowbal: String(s.lowbal),
    })),
  );
  const [testingNo, setTestingNo] = useState<number | null>(null);

  useEffect(() => {
    if (!adminData?.servers) return;
    setDrafts((prev) =>
      adminData.servers.map((s) => {
        const existing = prev.find((x) => x.no === s.no);
        return {
          no: s.no,
          url: s.url,
          key: existing?.key || '',
          margin: String(s.margin),
          lowbal: String(s.lowbal),
        };
      }),
    );
  }, [adminData?.servers]);

  if (!adminData) return null;

  const updateDraft = (no: 1 | 2 | 3, field: 'url' | 'key' | 'margin' | 'lowbal', value: string) => {
    setDrafts((prev) => prev.map((d) => (d.no === no ? { ...d, [field]: value } : d)));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Server APIs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure provider URL, API key, profit margin %, and low-balance threshold per server. All live country lists, purchases, and OTP polling run directly through the server.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {adminData.servers.map((srv) => {
          const d = drafts.find((x) => x.no === srv.no) || {
            no: srv.no,
            url: srv.url,
            key: '',
            margin: String(srv.margin),
            lowbal: String(srv.lowbal),
          };
          const s2Configured = adminData.servers.find((x) => x.no === 2)?.keyConfigured || false;
          const configured = Boolean(srv.url && (srv.keyConfigured || (srv.no === 3 && s2Configured)));

          return (
            <div key={srv.no} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-base text-slate-900">{srv.label}</h2>
                <span className={`text-xs font-semibold ${configured ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {configured ? 'Configured' : 'Key needed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{srv.about}</p>

              <div>
                <label className="text-xs text-slate-500">API URL</label>
                <input
                  value={d.url}
                  onChange={(e) => updateDraft(srv.no, 'url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  API Key <span className="font-mono text-slate-400">({srv.keyMask})</span>
                </label>
                <input
                  type="password"
                  value={d.key}
                  onChange={(e) => updateDraft(srv.no, 'key', e.target.value)}
                  placeholder={srv.keyConfigured ? 'Leave blank to keep saved key' : 'Enter provider API key'}
                  className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Profit Margin %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={d.margin}
                    onChange={(e) => updateDraft(srv.no, 'margin', e.target.value)}
                    className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Low Balance Alert</label>
                  <input
                    type="number"
                    value={d.lowbal}
                    onChange={(e) => updateDraft(srv.no, 'lowbal', e.target.value)}
                    className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await saveServerConfig(srv.no, {
                      url: d.url.trim(),
                      ...(d.key.trim() ? { key: d.key.trim() } : {}),
                      margin: parseFloat(d.margin) || 0,
                      lowbal: parseFloat(d.lowbal) || 0,
                    });
                    updateDraft(srv.no, 'key', '');
                  }}
                  className="flex-1 min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={testingNo === srv.no}
                  onClick={async () => {
                    setTestingNo(srv.no);
                    await testServerConfig(srv.no, {
                      url: d.url.trim(),
                      ...(d.key.trim() ? { key: d.key.trim() } : {}),
                    });
                    setTestingNo(null);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs font-semibold"
                >
                  {testingNo === srv.no ? 'Testing...' : 'Test Live API'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirmAction({
                      title: `Clear ${srv.label}?`,
                      message: 'This removes the saved API URL and API key for this server.',
                      confirmLabel: 'Remove API',
                      danger: true,
                      onConfirm: () => {
                        void removeServerConfig(srv.no);
                        updateDraft(srv.no, 'url', '');
                        updateDraft(srv.no, 'key', '');
                      },
                    })
                  }
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminSmmView: React.FC = () => {
  const {
    adminData,
    saveSmmApi,
    testSmmApi,
    addSmmCategory,
    removeSmmCategory,
    addSmmService,
    bulkAddSmmServices,
    updateSmmService,
    removeSmmService,
    confirmAction,
    showToast,
  } = useStore();

  const [apiUrl, setApiUrl] = useState(adminData?.smm.url || '');
  const [apiKey, setApiKey] = useState('');
  const [testingSmm, setTestingSmm] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState('');

  const [svcOpen, setSvcOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<SmmService | null>(null);

  // Add single service fields
  const [sCat, setSCat] = useState(adminData?.smm.cats[0]?.id || 1);
  const [sId, setSId] = useState('');
  const [sName, setSName] = useState('');
  const [sRate, setSRate] = useState('');
  const [sMarkup, setSMarkup] = useState('10');
  const [sMin, setSMin] = useState('10');
  const [sMax, setSMax] = useState('10000');
  const [sDesc, setSDesc] = useState('');

  // Bulk fields
  const [bulkIds, setBulkIds] = useState('');

  // Edit fields
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eRate, setERate] = useState('');
  const [eCat, setECat] = useState(1);
  const [eMin, setEMin] = useState('10');
  const [eMax, setEMax] = useState('10000');

  useEffect(() => {
    if (adminData?.smm.url) setApiUrl(adminData.smm.url);
  }, [adminData?.smm.url]);

  if (!adminData) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Social Media Service</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage SMM panel API, categories, and catalog services</p>
      </div>

      {/* API Config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-slate-900">SMM Panel v2 API</h2>
          <span className={`text-xs font-semibold ${adminData.smm.url && adminData.smm.keyConfigured ? 'text-emerald-700' : 'text-amber-600'}`}>
            {adminData.smm.url && adminData.smm.keyConfigured ? 'Configured' : 'Key needed'}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">API URL</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://smmpanel.com/api/v2"
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">
              API Key <span className="font-mono text-slate-400">({adminData.smm.keyMask})</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={adminData.smm.keyConfigured ? 'Leave blank to keep current key' : 'Enter SMM API key'}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await saveSmmApi(apiUrl.trim(), apiKey.trim() || undefined);
              setApiKey('');
            }}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Save API
          </button>
          <button
            type="button"
            disabled={testingSmm}
            onClick={async () => {
              setTestingSmm(true);
              await testSmmApi({ url: apiUrl.trim(), ...(apiKey.trim() ? { key: apiKey.trim() } : {}) });
              setTestingSmm(false);
            }}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs font-semibold"
          >
            {testingSmm ? 'Testing...' : 'Test Live API'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Categories */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900">Categories</h2>
            <button
              type="button"
              onClick={() => setCatOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              + Create
            </button>
          </div>
          <div className="space-y-2">
            {adminData.smm.cats.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-mono text-xs text-slate-400 mr-1.5">#{c.id}</span>
                  <span className="font-medium text-slate-900">{c.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    confirmAction({
                      title: `Remove "${c.name}"?`,
                      message: 'This removes the category and all SMM services assigned to it.',
                      confirmLabel: 'Remove',
                      danger: true,
                      onConfirm: () => void removeSmmCategory(c.id),
                    })
                  }
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                  aria-label="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Services Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display font-bold text-base text-slate-900">Services</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!adminData.smm.cats.length) return showToast('Create a category first', 'err');
                  setSCat(adminData.smm.cats[0].id);
                  setSvcOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                + Add Service
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!adminData.smm.cats.length) return showToast('Create a category first', 'err');
                  setSCat(adminData.smm.cats[0].id);
                  setBulkOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Bulk Import by ID
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Rate/1k</th>
                  <th className="py-2.5 px-3 text-right">Min–Max</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminData.smm.services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No SMM services added yet. Use Add Service or Bulk Import by ID.
                    </td>
                  </tr>
                ) : (
                  adminData.smm.services.map((v) => {
                    const catName = adminData.smm.cats.find((c) => c.id === v.cat)?.name || '—';
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{v.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{v.name}</td>
                        <td className="py-2.5 px-3 text-xs text-slate-600">{catName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                          {formatMoneyCompact(v.rate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-500 tabular-nums">
                          {v.min}–{v.max}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSvc(v);
                                setEName(v.name);
                                setEDesc(v.desc);
                                setERate(String(v.rate));
                                setECat(v.cat);
                                setEMin(String(v.min));
                                setEMax(String(v.max));
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeSmmService(v.id)}
                              className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {catOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setCatOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                await addSmmCategory(newCat);
                setNewCat('');
                setCatOpen(false);
              }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">New SMM Category</h2>
              <input
                required
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Category name (e.g. TikTok)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCatOpen(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Create
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Single Service Modal */}
      <AnimatePresence>
        {svcOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSvcOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                const idNum = parseInt(sId, 10);
                const rateNum = parseFloat(sRate) || 0;
                const mk = parseFloat(sMarkup) || 0;
                if (!idNum || !sName.trim()) return;
                const ok = await addSmmService({
                  id: idNum,
                  cat: sCat,
                  name: sName.trim(),
                  rate: Number((rateNum * (1 + mk / 100)).toFixed(2)),
                  min: parseInt(sMin, 10) || 10,
                  max: parseInt(sMax, 10) || 10000,
                  desc: sDesc.trim(),
                });
                if (ok) {
                  setSId('');
                  setSName('');
                  setSRate('');
                  setSDesc('');
                  setSvcOpen(false);
                }
              }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-3"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Add SMM Service</h2>
              <select
                value={sCat}
                onChange={(e) => setSCat(Number(e.target.value))}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              >
                {adminData.smm.cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  value={sId}
                  onChange={(e) => setSId(e.target.value)}
                  placeholder="Service ID"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  value={sRate}
                  onChange={(e) => setSRate(e.target.value)}
                  placeholder="API Rate / 1k"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
              <input
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                placeholder="Service Name"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={sMarkup}
                  onChange={(e) => setSMarkup(e.target.value)}
                  placeholder="Markup %"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  type="number"
                  value={sMin}
                  onChange={(e) => setSMin(e.target.value)}
                  placeholder="Min qty"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  type="number"
                  value={sMax}
                  onChange={(e) => setSMax(e.target.value)}
                  placeholder="Max qty"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <textarea
                rows={2}
                value={sDesc}
                onChange={(e) => setSDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSvcOpen(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Add Service
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {bulkOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setBulkOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                const ids = (bulkIds.match(/\d+/g) || []).map(Number);
                if (!ids.length) return showToast('Enter valid numeric IDs', 'err');
                await bulkAddSmmServices(sCat, ids, parseFloat(sMarkup) || 10);
                setBulkIds('');
                setBulkOpen(false);
              }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-3"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Bulk Import from SMM API</h2>
              <p className="text-xs text-slate-500">
                When SMM API URL and Key are saved, service names, rates, and min/max limits are synced automatically from your panel.
              </p>
              <select
                value={sCat}
                onChange={(e) => setSCat(Number(e.target.value))}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              >
                {adminData.smm.cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <textarea
                rows={3}
                value={bulkIds}
                onChange={(e) => setBulkIds(e.target.value)}
                placeholder="Service IDs separated by space, comma, or newline (e.g. 2222, 6478, 22461)"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <input
                type="number"
                value={sMarkup}
                onChange={(e) => setSMarkup(e.target.value)}
                placeholder="Markup %"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  Import IDs
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingSvc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setEditingSvc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-3"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Edit Service #{editingSvc.id}</h2>
              <input
                value={eName}
                onChange={(e) => setEName(e.target.value)}
                placeholder="Name"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <textarea
                rows={2}
                value={eDesc}
                onChange={(e) => setEDesc(e.target.value)}
                placeholder="Description"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={eRate}
                  onChange={(e) => setERate(e.target.value)}
                  placeholder="Rate / 1k"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
                <select
                  value={eCat}
                  onChange={(e) => setECat(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  {adminData.smm.cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={eMin}
                  onChange={(e) => setEMin(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
                <input
                  type="number"
                  value={eMax}
                  onChange={(e) => setEMax(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingSvc(null)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateSmmService(editingSvc.id, {
                      name: eName.trim() || editingSvc.name,
                      desc: eDesc.trim(),
                      rate: parseFloat(eRate) || 0,
                      cat: eCat,
                      min: parseInt(eMin, 10) || 10,
                      max: parseInt(eMax, 10) || 10000,
                    });
                    setEditingSvc(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminSettingsView: React.FC = () => {
  const {
    adminData,
    saveStoreSettings,
    saveGoogleAuthSettings,
    saveGithubBackupSettings,
    runGithubBackupNow,
    downloadFullBackup,
    restoreFullBackup,
    confirmAction,
    showToast,
  } = useStore();
  const [support, setSupport] = useState(adminData?.settings.support || '');
  const [supportCh, setSupportCh] = useState(adminData?.settings.supportCh || '');
  const [usdtRate, setUsdtRate] = useState(String(adminData?.settings.usdtRate || 92));

  // Maintenance Mode state
  const [maintMode, setMaintMode] = useState(Boolean(adminData?.settings.maintenanceMode));
  const [maintTitle, setMaintTitle] = useState(
    adminData?.settings.maintenanceTitle || 'We are upgrading AadityaTg.Store',
  );
  const [maintMsg, setMaintMsg] = useState(
    adminData?.settings.maintenanceMessage ||
      'Scheduled maintenance is currently in progress. All user balances and orders are 100% safe.',
  );
  const [maintEta, setMaintEta] = useState(adminData?.settings.maintenanceEta || 'Back online shortly');

  // Google Login ON/OFF & Firebase Keys state
  const [googleEnabled, setGoogleEnabled] = useState(
    adminData?.googleAuth ? Boolean(adminData.googleAuth.enabled) : true,
  );
  const [googleApiKey, setGoogleApiKey] = useState(adminData?.googleAuth?.apiKey || '');
  const [googleAuthDomain, setGoogleAuthDomain] = useState(adminData?.googleAuth?.authDomain || '');
  const [googleProjectId, setGoogleProjectId] = useState(adminData?.googleAuth?.projectId || '');
  const [googleAppId, setGoogleAppId] = useState(adminData?.googleAuth?.appId || '');
  const [savingGoogle, setSavingGoogle] = useState(false);

  // Automatic GitHub Backup state
  const [ghEnabled, setGhEnabled] = useState(Boolean(adminData?.githubBackup?.enabled));
  const [ghRepo, setGhRepo] = useState(adminData?.githubBackup?.repo || '');
  const [ghBranch, setGhBranch] = useState(adminData?.githubBackup?.branch || 'main');
  const [ghPath, setGhPath] = useState(
    adminData?.githubBackup?.filePath || 'backups/aadityatg-store-latest-backup.json',
  );
  const [ghInterval, setGhInterval] = useState(String(adminData?.githubBackup?.intervalMinutes || 120));
  const [ghToken, setGhToken] = useState('');
  const [savingGh, setSavingGh] = useState(false);
  const [runningGh, setRunningGh] = useState(false);

  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!adminData?.settings) return;
    setSupport(adminData.settings.support);
    setSupportCh(adminData.settings.supportCh);
    setUsdtRate(String(adminData.settings.usdtRate));
    setMaintMode(Boolean(adminData.settings.maintenanceMode));
    setMaintTitle(adminData.settings.maintenanceTitle || 'We are upgrading AadityaTg.Store');
    setMaintMsg(
      adminData.settings.maintenanceMessage ||
        'Scheduled maintenance is currently in progress. All user balances and orders are 100% safe.',
    );
    setMaintEta(adminData.settings.maintenanceEta || 'Back online shortly');
  }, [adminData?.settings]);

  useEffect(() => {
    if (!adminData?.googleAuth) return;
    setGoogleEnabled(Boolean(adminData.googleAuth.enabled));
    setGoogleApiKey(adminData.googleAuth.apiKey || '');
    setGoogleAuthDomain(adminData.googleAuth.authDomain || '');
    setGoogleProjectId(adminData.googleAuth.projectId || '');
    setGoogleAppId(adminData.googleAuth.appId || '');
  }, [adminData?.googleAuth]);

  useEffect(() => {
    if (!adminData?.githubBackup) return;
    setGhEnabled(Boolean(adminData.githubBackup.enabled));
    setGhRepo(adminData.githubBackup.repo || '');
    setGhBranch(adminData.githubBackup.branch || 'main');
    setGhPath(adminData.githubBackup.filePath || 'backups/aadityatg-store-latest-backup.json');
    setGhInterval(String(adminData.githubBackup.intervalMinutes || 120));
  }, [adminData?.githubBackup]);

  if (!adminData) return null;

  const gh = adminData.githubBackup;
  const safeCommitUrl =
    gh?.lastCommitUrl && /^https:\/\//i.test(gh.lastCommitUrl) ? gh.lastCommitUrl : '';

  const handleToggleMaintenance = async (next: boolean) => {
    setMaintMode(next);
    await saveStoreSettings({
      maintenanceMode: next,
      maintenanceTitle: maintTitle.trim(),
      maintenanceMessage: maintMsg.trim(),
      maintenanceEta: maintEta.trim(),
    });
  };

  const handleSaveGoogleAuth = async (overrideEnabled?: boolean) => {
    const nextEnabled = typeof overrideEnabled === 'boolean' ? overrideEnabled : googleEnabled;
    setSavingGoogle(true);
    try {
      await saveGoogleAuthSettings({
        enabled: nextEnabled,
        apiKey: googleApiKey.trim(),
        authDomain: googleAuthDomain.trim(),
        projectId: googleProjectId.trim(),
        appId: googleAppId.trim(),
      });
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleSaveGithubConfig = async () => {
    setSavingGh(true);
    try {
      const ok = await saveGithubBackupSettings({
        enabled: ghEnabled,
        repo: ghRepo.trim(),
        branch: ghBranch.trim() || 'main',
        filePath: ghPath.trim() || 'backups/aadityatg-store-latest-backup.json',
        intervalMinutes: Math.max(5, Math.min(1440, parseInt(ghInterval, 10) || 120)),
        ...(ghToken.trim() ? { token: ghToken.trim() } : {}),
      });
      if (ok) setGhToken('');
      return ok;
    } finally {
      setSavingGh(false);
    }
  };

  const handleRunGithubBackup = async () => {
    setRunningGh(true);
    try {
      // Auto-save any unsaved repo/branch/path/interval/token changes first
      const hasDraftChanges =
        ghToken.trim().length > 0 ||
        ghRepo.trim() !== (gh?.repo || '') ||
        (ghBranch.trim() || 'main') !== (gh?.branch || 'main') ||
        (ghPath.trim() || 'backups/aadityatg-store-latest-backup.json') !==
          (gh?.filePath || 'backups/aadityatg-store-latest-backup.json') ||
        (Math.max(5, Math.min(1440, parseInt(ghInterval, 10) || 120))) !== (gh?.intervalMinutes || 120);

      if (hasDraftChanges) {
        const saved = await saveGithubBackupSettings({
          enabled: ghEnabled,
          repo: ghRepo.trim(),
          branch: ghBranch.trim() || 'main',
          filePath: ghPath.trim() || 'backups/aadityatg-store-latest-backup.json',
          intervalMinutes: Math.max(5, Math.min(1440, parseInt(ghInterval, 10) || 120)),
          ...(ghToken.trim() ? { token: ghToken.trim() } : {}),
        });
        if (!saved) return;
        setGhToken('');
      }
      await runGithubBackupNow();
    } finally {
      setRunningGh(false);
    }
  };

  const handleDownloadFullBackup = async () => {
    setBackingUp(true);
    try {
      await downloadFullBackup();
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      let inner: Record<string, unknown> = parsed;
      if (
        parsed.format === 'aaditya-tg-store-full-backup-encoded' &&
        typeof parsed.payloadBase64 === 'string'
      ) {
        const binary = atob(parsed.payloadBase64);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const decodedText = new TextDecoder().decode(bytes);
        const decoded = JSON.parse(decodedText) as Record<string, unknown>;
        inner =
          decoded.db && typeof decoded.db === 'object'
            ? (decoded.db as Record<string, unknown>)
            : decoded;
      } else if (
        parsed.format === 'aaditya-tg-store-full-backup' &&
        parsed.db &&
        typeof parsed.db === 'object'
      ) {
        inner = parsed.db as Record<string, unknown>;
      }

      if (
        !Array.isArray(inner.users) ||
        !Array.isArray(inner.orders) ||
        !Array.isArray(inner.deposits)
      ) {
        showToast('Invalid backup JSON: missing users, orders, or deposits', 'err');
        return;
      }

      confirmAction({
        title: 'Restore Full Database?',
        message: `This will replace the current store database with "${file.name}" (${inner.users.length} users, ${inner.orders.length} orders, ${inner.deposits.length} deposits).`,
        confirmLabel: 'Yes, Restore DB',
        danger: true,
        onConfirm: () => {
          setRestoring(true);
          void restoreFullBackup(parsed).finally(() => setRestoring(false));
        },
      });
    } catch {
      showToast('Could not read JSON backup file', 'err');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Maintenance mode, Google login &amp; keys, automatic 2-hour GitHub backup, store links, and full database restore
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Maintenance Mode Card */}
        <div
          className={`admin-card rounded-2xl p-5 sm:p-6 space-y-4 md:col-span-2 ${
            maintMode ? 'ring-2 ring-amber-400/70 border-amber-300' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  maintMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Store Maintenance Mode
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  When turned ON, storefront visitors see a sleek maintenance screen and orders/deposits are paused while Admin Console stays open.
                </p>
              </div>
            </div>
            <PaymentToggle
              label="Maintenance Mode"
              checked={maintMode}
              onChange={(next) => void handleToggleMaintenance(next)}
            />
          </div>

          <div
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
              maintMode
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}
          >
            {maintMode ? (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Maintenance Mode is ACTIVE — storefront is locked for regular users.</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Storefront is LIVE and accepting orders &amp; deposits normally.</span>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Maintenance Headline</label>
              <input
                value={maintTitle}
                onChange={(e) => setMaintTitle(e.target.value)}
                placeholder="We are upgrading AadityaTg.Store"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Estimated Return (ETA)</label>
              <input
                value={maintEta}
                onChange={(e) => setMaintEta(e.target.value)}
                placeholder="Back online in ~30 mins"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Message to Users</label>
              <textarea
                rows={2}
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                placeholder="Explain what is being updated..."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void saveStoreSettings({
                  maintenanceMode: maintMode,
                  maintenanceTitle: maintTitle.trim(),
                  maintenanceMessage: maintMsg.trim(),
                  maintenanceEta: maintEta.trim(),
                })
              }
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Save Maintenance Settings
            </button>
          </div>
        </div>

        {/* Google Login ON/OFF & Firebase/Google Keys Card */}
        <div className="admin-card rounded-2xl p-5 sm:p-6 space-y-4 md:col-span-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  googleEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Google Login (ON / OFF &amp; Keys)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Turn Google Sign-In on or off on the login/signup page and configure your Firebase / Google Web Auth keys.
                </p>
              </div>
            </div>
            <PaymentToggle
              label="Google Login"
              checked={googleEnabled}
              onChange={(next) => {
                setGoogleEnabled(next);
                void handleSaveGoogleAuth(next);
              }}
            />
          </div>

          <div
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
              googleEnabled
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            {googleEnabled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Sign-In button is VISIBLE and enabled for users.</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Google Sign-In is OFF — users can only sign in with Email &amp; Password.</span>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Firebase / Google Web API Key</label>
              <input
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use default project config)"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Auth Domain</label>
              <input
                value={googleAuthDomain}
                onChange={(e) => setGoogleAuthDomain(e.target.value)}
                placeholder="your-project.firebaseapp.com"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Project ID (for Server Token Verification)</label>
              <input
                value={googleProjectId}
                onChange={(e) => setGoogleProjectId(e.target.value)}
                placeholder="your-firebase-project-id"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Firebase App ID</label>
              <input
                value={googleAppId}
                onChange={(e) => setGoogleAppId(e.target.value)}
                placeholder="1:1234567890:web:abcdef..."
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-600 leading-relaxed">
            Leave keys blank to use the built-in Firebase project config, or paste your own Firebase Web App keys above (make sure your custom domain is added under Firebase Console → Authentication → Authorized Domains).
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={savingGoogle}
              onClick={() => void handleSaveGoogleAuth()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              {savingGoogle ? 'Saving…' : 'Save Google Login Settings'}
            </button>
          </div>
        </div>

        {/* Automatic 2-Hour GitHub Full-DB Backup Card */}
        <div className="admin-card rounded-2xl p-5 sm:p-6 space-y-4 md:col-span-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Automatic GitHub Full-DB Backup (Replace Previous File)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically deletes the previous backup file in your GitHub repo and uploads the latest full database snapshot every 2 hours (configurable).
                </p>
              </div>
            </div>
            <PaymentToggle
              label="GitHub Auto-Backup"
              checked={ghEnabled}
              onChange={(next) => {
                setGhEnabled(next);
                void saveGithubBackupSettings({ enabled: next });
              }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">GitHub Repository (owner/repo)</label>
              <input
                value={ghRepo}
                onChange={(e) => setGhRepo(e.target.value)}
                placeholder="username/my-private-backups"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 inline-flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                Branch
              </label>
              <input
                value={ghBranch}
                onChange={(e) => setGhBranch(e.target.value)}
                placeholder="main"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Interval (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={ghInterval}
                onChange={(e) => setGhInterval(e.target.value)}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Backup File Path (.json)</label>
              <input
                value={ghPath}
                onChange={(e) => setGhPath(e.target.value)}
                placeholder="backups/aadityatg-store-latest-backup.json"
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-500">
                  GitHub Personal Access Token (contents:write)
                </label>
                {gh?.tokenConfigured && (
                  <span className="text-[11px] font-mono text-emerald-700">
                    Saved: {gh.tokenMask}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder={
                  gh?.tokenConfigured
                    ? 'Leave blank to keep existing token, or paste new PAT'
                    : 'ghp_... or github_pat_...'
                }
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Quick schedule:</span>
            {[
              { label: '1 Hour (60m)', val: '60' },
              { label: '2 Hours (120m)', val: '120' },
              { label: '6 Hours (360m)', val: '360' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setGhInterval(opt.val)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors ${
                  ghInterval === opt.val
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs text-slate-600 space-y-1">
            <div>
              Use a <strong>private</strong> GitHub repository. On every scheduled run, the previous backup file at the configured path is deleted first and replaced with the newest full DB snapshot (users, balances, orders, deposits, settings). Your GitHub token is automatically excluded from the uploaded JSON.
            </div>
            {gh && (gh.lastBackupAt || gh.lastMessage) && (
              <div className="pt-1.5 mt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    gh.lastStatus === 'error'
                      ? 'text-red-700'
                      : gh.lastStatus === 'ok'
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                  }`}
                >
                  {gh.lastStatus === 'error' ? (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {gh.lastMessage || 'Ready'}
                    {gh.lastBackupAt ? ` · ${new Date(gh.lastBackupAt).toLocaleString()}` : ''}
                  </span>
                </span>
                {safeCommitUrl && (
                  <a
                    href={safeCommitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                  >
                    View Commit
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={savingGh}
              onClick={() => void handleSaveGithubConfig()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              {savingGh ? 'Saving…' : 'Save GitHub Config'}
            </button>
            <button
              type="button"
              disabled={runningGh || savingGh}
              onClick={() => void handleRunGithubBackup()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${runningGh ? 'animate-spin' : ''}`} />
              {runningGh ? 'Syncing to GitHub…' : 'Backup to GitHub Now'}
            </button>
            {gh?.tokenConfigured && (
              <button
                type="button"
                disabled={savingGh}
                onClick={() => void saveGithubBackupSettings({ clearToken: true })}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold transition-colors"
              >
                Clear Token
              </button>
            )}
          </div>
        </div>

        <div className="admin-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900">Support Links</h2>
          <div>
            <label className="text-xs text-slate-500">Support User URL</label>
            <input
              value={support}
              onChange={(e) => setSupport(e.target.value)}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Support Channel URL</label>
            <input
              value={supportCh}
              onChange={(e) => setSupportCh(e.target.value)}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void saveStoreSettings({ support: support.trim(), supportCh: supportCh.trim() })}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save Support Links
          </button>
        </div>

        <div className="admin-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900">Exchange Rate</h2>
          <div>
            <label className="text-xs text-slate-500">USDT Rate (INR per 1 USDT)</label>
            <input
              type="number"
              value={usdtRate}
              onChange={(e) => setUsdtRate(e.target.value)}
              className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void saveStoreSettings({ usdtRate: parseFloat(usdtRate) || 92 })}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Save Rate
          </button>
        </div>

        <div className="admin-card rounded-2xl p-5 space-y-3 md:col-span-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Manual Local Full Database Backup &amp; Restore
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Download a complete JSON snapshot of your entire store (users, balances, password hashes, orders, deposits, stock, payment QR/UPI settings, API keys, and Gmail IMAP config) and restore it in 1 click on any server or after redeploy.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {adminData.users.length} users · {adminData.orders.length} orders · {adminData.deposits.length} deposits
            </span>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
            Keep your downloaded full backup file private — it includes saved API keys, Gmail App Password, and account credentials so your store restores completely. For automatic persistence on Railway, also mount a Volume at <code className="font-mono bg-amber-100 px-1 rounded">/data</code>.
          </div>

          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleRestoreFileChange(e)}
            className="hidden"
          />

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={backingUp || restoring}
              onClick={() => void handleDownloadFullBackup()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              {backingUp ? 'Preparing Backup…' : 'Download Full DB Backup'}
            </button>

            <button
              type="button"
              disabled={backingUp || restoring}
              onClick={() => restoreInputRef.current?.click()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {restoring ? 'Restoring DB…' : 'Restore DB from JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminStatsView: React.FC = () => {
  const { adminData } = useStore();
  if (!adminData) return null;

  const totalBal = adminData.users.reduce((a, u) => a + (u.balance || 0), 0);
  const totalDep = adminData.users.reduce((a, u) => a + (u.deposited || 0), 0);
  const totalSales = adminData.orders.reduce((a, o) => a + (o.price || 0), 0);
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayOrders = adminData.orders.filter((o) => o.date.startsWith(todayPrefix));

  const byKind = (['TG', 'WhatsApp', 'AppOTP', 'Digital', 'SMM'] as const).map((k) => {
    const list = adminData.orders.filter((o) => o.kind === k);
    return {
      kind: k,
      count: list.length,
      revenue: list.reduce((a, o) => a + o.price, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Sales performance and service breakdown</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500">Total Users</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">{adminData.users.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500">Total Sales</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoneyCompact(totalSales)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500">Total Deposited</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoneyCompact(totalDep)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500">Wallet Sum</div>
          <div className="font-display text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatMoneyCompact(totalBal)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900">Today&apos;s Report</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Orders placed today</span>
              <span className="font-mono font-semibold tabular-nums">{todayOrders.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Sales today</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatMoneyCompact(todayOrders.reduce((a, o) => a + o.price, 0))}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Pending deposit requests</span>
              <span className="font-mono font-semibold text-amber-600 tabular-nums">
                {adminData.deposits.filter((d) => d.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-display font-bold text-base text-slate-900">Revenue by Service</h2>
          <div className="space-y-2 text-sm">
            {byKind.map((row) => (
              <div key={row.kind} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{row.kind}</span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {row.count} orders · <strong className="text-slate-900">{formatMoneyCompact(row.revenue)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
