import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CloudUpload,
  Edit3,
  Eye,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { formatMoney, formatMoneyCompact } from '../../lib/format';
import { DigitalProduct, OrderRecord, StockItem, SupportTicket, TicketMessage, UserAccount } from '../../types';
import { LiveAmbientBackdrop } from '../store/LiveAmbientBackdrop';

export const AdminDashboardView: React.FC = () => {
  const { adminData, approveDeposit, rejectDeposit, navigateAdmin, saveStoreSettings } = useStore();
  const [togglingMaint, setTogglingMaint] = useState(false);

  if (!adminData) return null;

  const totalBal = adminData.users.reduce((a, u) => a + (u.balance || 0), 0);
  const totalSales = adminData.orders.reduce((a, o) => a + (o.price || 0), 0);
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todaySales = adminData.orders
    .filter((o) => o.date.startsWith(todayPrefix))
    .reduce((a, o) => a + (o.price || 0), 0);
  const pendingDeposits = adminData.deposits.filter((d) => d.status === 'pending');
  const openTickets = adminData.tickets.filter((t) => t.status === 'open');
  const activeStock = adminData.stock.filter((s) => s.available).length;
  const waitingOrders = adminData.orders.filter((o) => o.status === 'WAIT_CODE').length;
  const isMaintenance = Boolean(adminData.settings.maintenanceMode);
  const gh = adminData.githubBackup;

  const handleQuickToggleMaintenance = async () => {
    setTogglingMaint(true);
    try {
      await saveStoreSettings({ maintenanceMode: !isMaintenance });
    } finally {
      setTogglingMaint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#04120e] text-white p-6 sm:p-7 shadow-[0_24px_48px_-24px_rgba(4,18,14,0.7)] border border-emerald-500/20">
        <LiveAmbientBackdrop variant="hero" className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AadityaTg.Store Command Center
            </h1>
            <p className="text-sm text-emerald-100/75 max-w-xl">
              Live revenue telemetry, instant deposit approvals, 2-hour GitHub backup status, and maintenance control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={togglingMaint}
              onClick={() => void handleQuickToggleMaintenance()}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border transition-all cursor-pointer ${
                isMaintenance
                  ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 border-amber-300/40'
                  : 'bg-white/10 hover:bg-white/16 text-white border-white/15 backdrop-blur-md'
              }`}
            >
              <Wrench className="w-4 h-4" />
              {togglingMaint
                ? 'Updating…'
                : isMaintenance
                  ? 'Maintenance: ON (Turn Off)'
                  : 'Maintenance: OFF'}
            </button>

            <button
              type="button"
              onClick={() => navigateAdmin('settings')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 inline-flex items-center gap-2 transition-colors"
            >
              <CloudUpload className="w-4 h-4 text-emerald-300" />
              {gh?.enabled
                ? `GitHub Auto-Backup: ${gh.intervalMinutes}m`
                : 'GitHub Backup: Off'}
            </button>

            <button
              type="button"
              onClick={() => navigateAdmin('serverapis')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
            >
              Configure APIs
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Revenue</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoneyCompact(totalSales)}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 tabular-nums">
            Today: {formatMoneyCompact(todaySales)}
          </div>
        </div>
        <div className="admin-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Registered Users</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {adminData.users.length}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 tabular-nums">
            Wallet Sum: {formatMoneyCompact(totalBal)}
          </div>
        </div>
        <div className="admin-card rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Orders &amp; Inventory</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {adminData.orders.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {waitingOrders} waiting OTP · {activeStock} manual stock
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateAdmin('deposits')}
          className="admin-card admin-card-interactive rounded-2xl p-5 text-left cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Pending Deposits</div>
          <div className="font-display text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {pendingDeposits.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Click to review UTRs</div>
        </button>
        <button
          type="button"
          onClick={() => navigateAdmin('tickets')}
          className="admin-card admin-card-interactive rounded-2xl p-5 text-left cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Open Support Tickets</div>
          <div className="font-display text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {openTickets.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Click to reply to users</div>
        </button>
        <button
          type="button"
          onClick={() => navigateAdmin('digital')}
          className="admin-card admin-card-interactive rounded-2xl p-5 text-left cursor-pointer"
        >
          <div className="text-xs font-medium text-slate-500">Catalog Items</div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {adminData.digital.length + adminData.smm.services.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {adminData.digital.length} digital · {adminData.smm.services.length} SMM
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="admin-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigateAdmin('orders')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Manage all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {adminData.orders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">No orders placed yet</div>
            ) : (
              adminData.orders.slice(0, 6).map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {o.kind} · {o.country || o.name || 'Order'}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {o.id} · User {o.userId}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatMoneyCompact(o.price)}
                    </div>
                    <div className="text-xs text-slate-500">{o.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900">Pending Deposits</h2>
            <button
              type="button"
              onClick={() => navigateAdmin('deposits')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Manage all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingDeposits.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">No pending deposits</div>
            ) : (
              pendingDeposits.slice(0, 6).map((d) => (
                <div key={d.id} className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 tabular-nums">
                      User {d.userId} · {formatMoneyCompact(d.amount)}
                    </div>
                    <div className="text-xs font-mono text-slate-500 truncate">
                      {d.method} · UTR: {d.utr || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void approveDeposit(d.id)}
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void rejectDeposit(d.id)}
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {openTickets.length > 0 && (
        <div className="admin-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900">Recent Open Tickets</h2>
            <button
              type="button"
              onClick={() => navigateAdmin('tickets')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Open Tickets Desk
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {openTickets.slice(0, 4).map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    #{t.id} · {t.subject}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    User {t.userId} · {t.cat} · {t.date}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigateAdmin('tickets')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0"
                >
                  Reply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminUsersView: React.FC = () => {
  const { adminData, updateUser, adjustUserBalance, toggleBanUser, toggleFreezeUser, viewAsUser } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'frozen'>('all');
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [balTarget, setBalTarget] = useState<UserAccount | null>(null);
  const [balExpr, setBalExpr] = useState('');

  // Edit user form state
  const [eName, setEName] = useState('');
  const [eUsername, setEUsername] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [ePass, setEPass] = useState('');
  const [eBal, setEBal] = useState('0');
  const [eBan, setEBan] = useState(false);
  const [eFrz, setEFrz] = useState(false);

  const openEdit = (u: UserAccount) => {
    setEditing(u);
    setEName(u.name);
    setEUsername(u.username);
    setEEmail(u.email);
    setEPass('');
    setEBal(String(u.balance));
    setEBan(u.banned);
    setEFrz(u.frozen);
  };

  const users = adminData?.users || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'banned' && u.banned) ||
        (statusFilter === 'frozen' && !u.banned && u.frozen) ||
        (statusFilter === 'active' && !u.banned && !u.frozen);
      if (!matchesStatus) return false;
      return (
        !q ||
        String(u.id).includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter]);

  if (!adminData) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage accounts, wallet balances, and storefront access</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {(['all', 'active', 'frozen', 'banned'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, email..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4 text-right">Balance</th>
              <th className="py-3 px-4 text-right">Deposited</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">{u.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.name || '—'}</div>
                    <div className="text-xs text-slate-500">
                      @{u.username || '—'} · {u.email}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoney(u.balance)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                    {formatMoney(u.deposited)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        u.banned ? 'text-red-600' : u.frozen ? 'text-amber-600' : 'text-emerald-700'
                      }`}
                    >
                      {u.banned ? 'Banned' : u.frozen ? 'Frozen' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void viewAsUser(u.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBalTarget(u);
                          setBalExpr('+100');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        Balance
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleBanUser(u.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                          u.banned
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleFreezeUser(u.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {u.frozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Edit User #{editing.id}</h2>
              <div className="space-y-3">
                <input
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  value={eUsername}
                  onChange={(e) => setEUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  value={eEmail}
                  onChange={(e) => setEEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="password"
                  value={ePass}
                  onChange={(e) => setEPass(e.target.value)}
                  placeholder="New password (blank = keep current)"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="number"
                  value={eBal}
                  onChange={(e) => setEBal(e.target.value)}
                  placeholder="Balance"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
                <div className="flex items-center gap-6 pt-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={eBan} onChange={(e) => setEBan(e.target.checked)} />
                    Banned
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={eFrz} onChange={(e) => setEFrz(e.target.checked)} />
                    Frozen
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateUser(editing.id, {
                      name: eName.trim(),
                      username: eUsername.trim(),
                      email: eEmail.trim(),
                      balance: parseFloat(eBal) || 0,
                      banned: eBan,
                      frozen: eFrz,
                      ...(ePass ? { password: ePass } : {}),
                    });
                    setEditing(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust Balance Modal */}
      <AnimatePresence>
        {balTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setBalTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Adjust Balance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {balTarget.name} · Current: {formatMoney(balTarget.balance)}
                </p>
              </div>
              <input
                type="text"
                value={balExpr}
                onChange={(e) => setBalExpr(e.target.value)}
                placeholder="e.g. +100, -50, or exact 500"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <div className="flex gap-2">
                {['+100', '+500', '-100'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setBalExpr(q)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono font-semibold"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setBalTarget(null)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await adjustUserBalance(balTarget.id, balExpr);
                    setBalTarget(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminOrdersView: React.FC = () => {
  const { adminData, updateAdminOrder, deleteAdminOrder, confirmAction } = useStore();
  const [kind, setKind] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [oStatus, setOStatus] = useState<OrderRecord['status']>('DONE');
  const [oCode, setOCode] = useState('');
  const [oCreds, setOCreds] = useState('');
  const [oRefund, setORefund] = useState(true);

  const openManage = (o: OrderRecord) => {
    setEditingOrder(o);
    setOStatus(o.status);
    setOCode(o.code || '');
    setOCreds(o.credentials || '');
    setORefund(o.status !== 'CANCELLED');
  };

  const orders = adminData?.orders || [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (kind !== 'all' && o.kind !== kind) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        String(o.userId).includes(q) ||
        (o.country || '').toLowerCase().includes(q) ||
        (o.name || '').toLowerCase().includes(q) ||
        (o.phone || '').toLowerCase().includes(q) ||
        (o.target || '').toLowerCase().includes(q)
      );
    });
  }, [orders, kind, statusFilter, search]);

  if (!adminData) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage status, deliver credentials/OTP codes, or cancel &amp; refund orders
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, user, phone, item..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
          {['all', 'TG', 'WhatsApp', 'AppOTP', 'Digital', 'SMM'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                kind === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {k === 'all' ? 'All Types' : k}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
          {['all', 'WAIT_CODE', 'DONE', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Country / Item</th>
              <th className="py-3 px-4">Number / Target</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">{o.id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">{o.userId}</td>
                  <td className="py-3 px-4 text-slate-700">{o.kind}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{o.country || o.name || '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    <div>{o.phone || o.target || '—'}</div>
                    {o.code && <div className="text-emerald-700">OTP: {o.code}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoneyCompact(o.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        o.status === 'DONE' || o.status === 'DELIVERED'
                          ? 'text-emerald-700'
                          : o.status === 'CANCELLED'
                            ? 'text-red-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openManage(o)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
                      >
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmAction({
                            title: `Delete order ${o.id}?`,
                            message: 'This permanently removes the order record from history.',
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () => void deleteAdminOrder(o.id),
                          })
                        }
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Delete order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manage / Fulfill Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setEditingOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Manage Order {editingOrder.id}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  User #{editingOrder.userId} · {editingOrder.kind} · {formatMoneyCompact(editingOrder.price)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Order Status</label>
                <select
                  value={oStatus}
                  onChange={(e) => setOStatus(e.target.value as OrderRecord['status'])}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="WAIT_CODE">WAIT_CODE (Pending)</option>
                  <option value="DONE">DONE (Completed)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">OTP / Verification Code</label>
                <input
                  value={oCode}
                  onChange={(e) => setOCode(e.target.value)}
                  placeholder="Optional OTP code"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Delivery Credentials / Notes (shown to buyer)
                </label>
                <textarea
                  rows={3}
                  value={oCreds}
                  onChange={(e) => setOCreds(e.target.value)}
                  placeholder="Login details, digital link, or fulfillment notes..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              {oStatus === 'CANCELLED' && editingOrder.status !== 'CANCELLED' && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
                  <input type="checkbox" checked={oRefund} onChange={(e) => setORefund(e.target.checked)} />
                  Refund {formatMoneyCompact(editingOrder.price)} back to user&apos;s wallet
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateAdminOrder(editingOrder.id, {
                      status: oStatus,
                      code: oCode,
                      credentials: oCreds,
                      refund: oStatus === 'CANCELLED' ? oRefund : false,
                    });
                    setEditingOrder(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold"
                >
                  Save Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminDepositsView: React.FC = () => {
  const { adminData, approveDeposit, rejectDeposit } = useStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const deposits = adminData?.deposits || [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deposits.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(d.id).includes(q) ||
        String(d.userId).includes(q) ||
        (d.utr || '').toLowerCase().includes(q) ||
        (d.method || '').toLowerCase().includes(q)
      );
    });
  }, [deposits, statusFilter, search]);

  if (!adminData) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Deposits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Approve or reject incoming wallet payments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {(['all', 'pending', 'success', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user ID or UTR..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">UTR / Ref</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No deposits found
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">#{d.id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums">{d.userId}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatMoneyCompact(d.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{d.method}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{d.utr || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold capitalize ${
                        d.status === 'success'
                          ? 'text-emerald-700'
                          : d.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">{d.date}</td>
                  <td className="py-3 px-4 text-right">
                    {d.status === 'pending' ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void approveDeposit(d.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void rejectDeposit(d.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminTicketsView: React.FC = () => {
  const {
    adminData,
    replyAdminTicket,
    sendAdminTicketMessage,
    deleteAdminTicket,
    markTicketRead,
    sendTicketTyping,
    ticketTypingState,
    onlineSupportUserIds,
    liveWsConnected,
    confirmAction,
  } = useStore();
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const tickets = adminData?.tickets || [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (!q) return true;
      return (
        String(t.id).includes(q) ||
        String(t.userId).includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        (t.messages || []).some((m) => m.text.toLowerCase().includes(q))
      );
    });
  }, [tickets, filter, search]);

  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === activeId) || rows[0] || null,
    [tickets, activeId, rows],
  );

  const activeMessages = useMemo(() => {
    if (!activeTicket) return [];
    if (Array.isArray(activeTicket.messages) && activeTicket.messages.length > 0) {
      return activeTicket.messages;
    }
    const list: TicketMessage[] = [
      {
        id: `legacy_${activeTicket.id}_u`,
        sender: 'user',
        senderName: `User #${activeTicket.userId}`,
        text: activeTicket.message,
        createdAt: activeTicket.date,
      },
    ];
    if (activeTicket.adminReply) {
      list.push({
        id: `legacy_${activeTicket.id}_a`,
        sender: 'admin' as const,
        senderName: 'Support Team',
        text: activeTicket.adminReply,
        createdAt: activeTicket.repliedAt || activeTicket.date,
      });
    }
    return list;
  }, [activeTicket]);

  useEffect(() => {
    if (!activeTicket) return;
    if ((activeTicket.unreadByAdmin || 0) > 0) {
      markTicketRead(activeTicket.id, true);
    }
  }, [activeTicket?.id, activeTicket?.unreadByAdmin, markTicketRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.id, activeMessages.length, ticketTypingState[activeTicket?.id || 0]?.until]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
      }
      if (activeTicket && isTypingRef.current) {
        sendTicketTyping(activeTicket.id, false);
        isTypingRef.current = false;
      }
    };
  }, [activeTicket?.id, sendTicketTyping]);

  if (!adminData) return null;

  const selectTicket = (t: SupportTicket) => {
    setActiveId(t.id);
    setMobileShowChat(true);
    if ((t.unreadByAdmin || 0) > 0) {
      markTicketRead(t.id, true);
    }
  };

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (!activeTicket) return;
    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true;
      sendTicketTyping(activeTicket.id, true);
    }
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTicketTyping(activeTicket.id, false);
      }
    }, 2200);
  };

  const handleSend = async (closeAfter = false) => {
    if (!activeTicket || sending) return;
    const clean = draft.trim();
    if (!clean) return;
    setSending(true);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTicketTyping(activeTicket.id, false);
    }
    const ok = await sendAdminTicketMessage(
      activeTicket.id,
      clean,
      closeAfter ? 'closed' : undefined,
    );
    if (ok) setDraft('');
    setSending(false);
  };

  const activeUserOnline = activeTicket ? onlineSupportUserIds.includes(activeTicket.userId) : false;
  const userTyping = activeTicket ? ticketTypingState[activeTicket.id]?.by === 'user' : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-900">Support Live Chat</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${liveWsConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {liveWsConnected ? 'Live' : 'Connecting'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Real-time chat with customers across support tickets</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {(['all', 'open', 'closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or message..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4 h-[calc(100dvh-13rem)] min-h-[500px]">
        {/* Left Ticket Queue */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 overflow-y-auto divide-y divide-slate-100 ${
            mobileShowChat ? 'hidden lg:block' : 'block'
          }`}
        >
          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              No support tickets found
            </div>
          ) : (
            rows.map((t) => {
              const selected = activeTicket?.id === t.id;
              const msgs = t.messages || [];
              const lastMsg = msgs[msgs.length - 1];
              const unread = t.unreadByAdmin || 0;
              const userOnline = onlineSupportUserIds.includes(t.userId);
              const preview = lastMsg
                ? `${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text}`
                : t.message;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTicket(t)}
                  className={`w-full text-left px-4 py-3.5 transition-colors flex flex-col gap-1.5 ${
                    selected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          userOnline
                            ? 'bg-emerald-500'
                            : selected
                              ? 'bg-slate-600'
                              : 'bg-slate-300'
                        }`}
                      />
                      <span className="font-mono text-xs font-semibold truncate">
                        #{t.id} · User #{t.userId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tabular-nums">
                          {unread}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold capitalize ${
                          t.status === 'open'
                            ? selected
                              ? 'text-emerald-300'
                              : 'text-emerald-700'
                            : selected
                              ? 'text-slate-400'
                              : 'text-slate-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-xs font-medium truncate ${
                      selected ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {preview}
                  </div>
                  <div className={`text-[11px] ${selected ? 'text-slate-400' : 'text-slate-400'}`}>
                    {t.cat} · {t.lastMessageAt || t.date}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Live Chat Room */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 overflow-hidden flex-col ${
            mobileShowChat ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!activeTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
              <div className="text-sm font-medium text-slate-600">Select a ticket to open live chat</div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
                    aria-label="Back to ticket list"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                      {activeTicket.subject}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="font-mono">
                        #{activeTicket.id} · User #{activeTicket.userId}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{activeTicket.cat}</span>
                      <span>·</span>
                      <span className={activeUserOnline ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {activeUserOnline ? 'User Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      void replyAdminTicket(activeTicket.id, {
                        status: activeTicket.status === 'open' ? 'closed' : 'open',
                      })
                    }
                    className="min-h-[34px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    {activeTicket.status === 'open' ? 'Close Ticket' : 'Reopen'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirmAction({
                        title: `Delete ticket #${activeTicket.id}?`,
                        message: 'This permanently deletes the support ticket and chat history.',
                        confirmLabel: 'Delete',
                        danger: true,
                        onConfirm: () => {
                          void deleteAdminTicket(activeTicket.id);
                          setActiveId(null);
                          setMobileShowChat(false);
                        },
                      })
                    }
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    aria-label="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-slate-50/70">
                {activeMessages.map((m) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${
                          isAdmin
                            ? 'bg-slate-900 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                        }`}
                      >
                        <div
                          className={`text-[11px] font-semibold ${
                            isAdmin ? 'text-emerald-300' : 'text-slate-500'
                          }`}
                        >
                          {m.senderName}
                        </div>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>
                        <div
                          className={`text-[10px] font-mono text-right ${
                            isAdmin ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {m.createdAt}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {userTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-slate-500 italic">
                      User #{activeTicket.userId} is typing…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend(false);
                }}
                className="p-3 sm:p-4 border-t border-slate-200 bg-white flex flex-wrap sm:flex-nowrap items-end gap-2 shrink-0"
              >
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(false);
                    }
                  }}
                  placeholder="Write a live reply to the customer…"
                  className="flex-1 min-w-[200px] min-h-[42px] max-h-28 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-slate-900 focus:outline-none resize-none"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                  {activeTicket.status === 'open' && (
                    <button
                      type="button"
                      disabled={sending || !draft.trim()}
                      onClick={() => void handleSend(true)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Send & Close
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminStockView: React.FC = () => {
  const {
    adminData,
    addStockItem,
    updateStockItem,
    bulkAddStockItems,
    toggleStockAvailability,
    removeStockItem,
    showToast,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [year, setYear] = useState('2024');
  const [cat, setCat] = useState('Good');
  const [price, setPrice] = useState('45');
  const [twofa, setTwofa] = useState('None');
  const [origin, setOrigin] = useState<'pushing' | 'autoreg' | 'resale'>('pushing');
  const [isPremium, setIsPremium] = useState(false);
  const [spamBlocked, setSpamBlocked] = useState(false);

  const [bulkText, setBulkText] = useState('');

  if (!adminData) return null;

  const openAdd = () => {
    setEditing(null);
    setPhone('');
    setCountry('India');
    setYear('2024');
    setCat('Good');
    setPrice('45');
    setTwofa('None');
    setOrigin('pushing');
    setIsPremium(false);
    setSpamBlocked(false);
    setOpen(true);
  };

  const openEdit = (s: StockItem) => {
    setEditing(s);
    setPhone(s.phone);
    setCountry(s.country);
    setYear(s.year);
    setCat(s.cat);
    setPrice(String(s.price));
    setTwofa(s.twofa);
    setOrigin(s.origin || 'pushing');
    setIsPremium(Boolean(s.isPremium));
    setSpamBlocked(Boolean(s.spamBlocked));
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (editing) {
      await updateStockItem(editing.id, {
        phone: phone.trim(),
        country: country.trim() || 'India',
        year: year.trim() || '2024',
        cat: cat.trim() || 'Good',
        price: parseFloat(price) || 0,
        twofa,
        origin,
        isPremium,
        spamBlocked,
      });
    } else {
      await addStockItem({
        phone: phone.trim(),
        country: country.trim() || 'India',
        year: year.trim() || '2024',
        cat: cat.trim() || 'Good',
        price: parseFloat(price) || 0,
        twofa,
        origin,
        isPremium,
        spamBlocked,
      });
    }
    setOpen(false);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const items = lines.map((line) => {
      const parts = line.split(/[|,]/).map((p) => p.trim());
      return {
        phone: parts[0],
        country: parts[1] || country || 'India',
        year: parts[2] || year || '2024',
        cat: parts[3] || cat || 'Good',
        price: parts[4] ? parseFloat(parts[4]) || 45 : parseFloat(price) || 45,
        twofa: parts[5] || twofa || 'None',
        origin,
        isPremium,
        spamBlocked,
      };
    });
    if (!items.length) return showToast('Enter at least one phone number', 'err');
    await bulkAddStockItems(items);
    setBulkText('');
    setBulkOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Stock Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manual accounts and ready inventory for Server 1</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" />
            Bulk Add
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Year</th>
              <th className="py-3 px-4">Category & Tags</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4">2FA</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adminData.stock.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No manual stock added yet
                </td>
              </tr>
            ) : (
              adminData.stock.map((s) => {
                const originLabel =
                  s.origin === 'autoreg'
                    ? 'Autoreg'
                    : s.origin === 'resale'
                      ? 'Resale'
                      : 'Pushing';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-slate-800">{s.phone}</td>
                    <td className="py-3 px-4">{s.country}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">{s.year}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{s.cat}</div>
                      <div className="text-xs text-slate-500">
                        {originLabel} · {s.isPremium ? 'Premium' : 'Non-Premium'} · {s.spamBlocked ? 'Spam Blocked' : 'Spam Free'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      {formatMoneyCompact(s.price)}
                    </td>
                    <td className="py-3 px-4">{s.twofa}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => void toggleStockAvailability(s.id)}
                        className={`text-xs font-semibold ${s.available ? 'text-emerald-700' : 'text-slate-400'}`}
                      >
                        {s.available ? 'Available' : 'Sold'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                          aria-label="Edit stock"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeStockItem(s.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          aria-label="Remove stock"
                        >
                          <Trash2 className="w-4 h-4" />
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
              onSubmit={handleSave}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                {editing ? 'Edit Stock Account' : 'Add Stock Account'}
              </h2>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+91...)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Year"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  placeholder="Category (Good/Premium)"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price (₹)"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as 'pushing' | 'autoreg' | 'resale')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="pushing">Origin: Pushing</option>
                  <option value="autoreg">Origin: Autoreg</option>
                  <option value="resale">Origin: Resale</option>
                </select>
                <select
                  value={isPremium ? 'yes' : 'no'}
                  onChange={(e) => setIsPremium(e.target.value === 'yes')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="no">Non-Premium</option>
                  <option value="yes">Telegram Premium</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={spamBlocked ? 'blocked' : 'free'}
                  onChange={(e) => setSpamBlocked(e.target.value === 'blocked')}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="free">Spam: Spam Free</option>
                  <option value="blocked">Spam: Spam Blocked</option>
                </select>
                <select
                  value={twofa}
                  onChange={(e) => setTwofa(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="None">2FA: None</option>
                  <option value="Yes">2FA: Yes</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 min-h-[42px] rounded-xl bg-slate-900 text-white text-sm font-semibold">
                  {editing ? 'Save Stock' : 'Add Stock'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

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
              onSubmit={handleBulkSubmit}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Bulk Import Stock</h2>
              <p className="text-xs text-slate-500">
                One account per line: <code className="font-mono">+919876543210 | India | 2024 | Good | 45 | None</code> (or just phone numbers using defaults below).
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Default Country"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Default Price"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Default Year"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as 'pushing' | 'autoreg' | 'resale')}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="pushing">Origin: Pushing</option>
                  <option value="autoreg">Origin: Autoreg</option>
                  <option value="resale">Origin: Resale</option>
                </select>
                <select
                  value={isPremium ? 'yes' : 'no'}
                  onChange={(e) => setIsPremium(e.target.value === 'yes')}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="no">Non-Premium</option>
                  <option value="yes">Telegram Premium</option>
                </select>
                <select
                  value={spamBlocked ? 'blocked' : 'free'}
                  onChange={(e) => setSpamBlocked(e.target.value === 'blocked')}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="free">Spam Free</option>
                  <option value="blocked">Spam Blocked</option>
                </select>
              </div>
              <textarea
                rows={6}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'+919811111111 | India | 2024 | Good | 45 | None\n+14155550199 | USA | 2023 | Aged | 85 | Yes'}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono"
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
                  Import Stock
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminDigitalView: React.FC = () => {
  const { adminData, addDigitalProduct, updateDigitalProduct, toggleDigitalProduct, removeDigitalProduct } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DigitalProduct | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');

  if (!adminData) return null;

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setPrice('');
    setOpen(true);
  };

  const openEdit = (p: DigitalProduct) => {
    setEditing(p);
    setName(p.name);
    setDesc(p.desc);
    setPrice(String(p.price));
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      await updateDigitalProduct(editing.id, {
        name: name.trim(),
        desc: desc.trim(),
        price: parseFloat(price) || 0,
      });
    } else {
      await addDigitalProduct(name.trim(), desc.trim(), parseFloat(price) || 0);
    }
    setName('');
    setDesc('');
    setPrice('');
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Digital Shop</h1>
          <p className="text-sm text-slate-500 mt-0.5">Products automatically sync to Storefront Digital Shop</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adminData.digital.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No digital products added yet
                </td>
              </tr>
            ) : (
              adminData.digital.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">#{p.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.desc}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                    {formatMoneyCompact(p.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${p.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleDigitalProduct(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {p.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDigitalProduct(p.id)}
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
              onSubmit={handleSave}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                {editing ? `Edit Product #${editing.id}` : 'Add Digital Product'}
              </h2>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Name"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Short description"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price (₹)"
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
                  {editing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminRedeemView: React.FC = () => {
  const { adminData, addRedeemCode, toggleRedeemCode, removeRedeemCode } = useStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('50');
  const [max, setMax] = useState('10');

  if (!adminData) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addRedeemCode(code, parseFloat(amount) || 0, parseInt(max, 10) || 1);
    if (ok) {
      setCode('');
      setOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Redeem Codes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gift &amp; promo codes redeemable in the storefront</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Code
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Used / Max</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {adminData.redeem.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No redeem codes created yet
                </td>
              </tr>
            ) : (
              adminData.redeem.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.code}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                    {formatMoneyCompact(r.amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                    {r.used} / {r.max}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${r.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {r.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleRedeemCode(r.code)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {r.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeRedeemCode(r.code)}
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
              onSubmit={handleAdd}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Create Redeem Code</h2>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO50"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase"
              />
              <input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <input
                required
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="Max uses"
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
                  Create
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
