import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Boxes,
  CreditCard,
  Gift,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Plug,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { AdminPage } from '../../types';

interface NavGroup {
  label: string;
  items: { key: AdminPage; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'users', label: 'Users', icon: Users },
      { key: 'orders', label: 'Orders', icon: Package },
      { key: 'deposits', label: 'Deposits', icon: Wallet },
      { key: 'tickets', label: 'Support Tickets', icon: MessageSquare },
      { key: 'stats', label: 'Statistics', icon: BarChart3 },
    ],
  },
  {
    label: 'Catalog & Stock',
    items: [
      { key: 'stock', label: 'Stock', icon: Boxes },
      { key: 'digital', label: 'Digital Shop', icon: ShoppingBag },
      { key: 'smm', label: 'Social Media Service', icon: Share2 },
      { key: 'redeem', label: 'Redeem Codes', icon: Gift },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { key: 'payments', label: 'Payment Methods', icon: CreditCard },
      { key: 'serverapis', label: 'Server APIs', icon: Plug },
      { key: 'apikeys', label: 'API Keys', icon: KeyRound },
      { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
      { key: 'admins', label: 'Manage Admins', icon: ShieldCheck },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ALL_PAGES = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminPage, navigateAdmin, adminSession, logoutAdmin, setMode, adminData } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = (adminData?.deposits || []).filter((d) => d.status === 'pending').length;
  const openTicketsCount = (adminData?.tickets || []).filter((t) => t.status === 'open').length;
  const activeTitle = ALL_PAGES.find((p) => p.key === adminPage)?.label || 'Dashboard';

  const handleNav = (key: AdminPage) => {
    navigateAdmin(key);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
            A
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm text-white truncate">Admin Console</div>
            <div className="text-[11px] text-slate-400 truncate">Signed in as {adminSession}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[11px] font-medium text-slate-500">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = adminPage === item.key;
                const badgeCount =
                  item.key === 'deposits' ? pendingCount : item.key === 'tickets' ? openTicketsCount : 0;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNav(item.key)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {badgeCount > 0 && (
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          active ? 'text-emerald-100' : 'text-amber-400'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80 space-y-1 shrink-0">
        <button
          type="button"
          onClick={() => setMode('store')}
          className="w-full min-h-[40px] px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 flex items-center gap-2.5 transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>Open Storefront</span>
        </button>
        <button
          type="button"
          onClick={logoutAdmin}
          className="w-full min-h-[40px] px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-64 h-full shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">Admin Console</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-bold text-slate-900 truncate">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => navigateAdmin('deposits')}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold whitespace-nowrap"
              >
                {pendingCount} Pending Deposit{pendingCount > 1 ? 's' : ''}
              </button>
            )}
            {openTicketsCount > 0 && (
              <button
                type="button"
                onClick={() => navigateAdmin('tickets')}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap"
              >
                {openTicketsCount} Open Ticket{openTicketsCount > 1 ? 's' : ''}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('store')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Activity className="w-4 h-4 text-emerald-400 hidden sm:inline" />
              View Storefront
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
