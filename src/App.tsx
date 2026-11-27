import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StoreProvider, useStore } from './store/StoreContext';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { StoreAuth } from './components/store/StoreAuth';
import { StoreLayout } from './components/store/StoreLayout';
import {
  BuyConfirmView,
  CountriesView,
  DigitalShopView,
  HomeView,
  OrderResultView,
  SmmServicesView,
  StoreView,
} from './components/store/StoreMainViews';
import {
  DepositView,
  NewTicketView,
  OrdersView,
  ProfileView,
  RedeemView,
  SupportView,
  TicketChatView,
  WalletView,
} from './components/store/StoreAccountViews';
import { AdminAuth } from './components/admin/AdminAuth';
import { AdminLayout } from './components/admin/AdminLayout';
import {
  AdminDashboardView,
  AdminDepositsView,
  AdminDigitalView,
  AdminOrdersView,
  AdminRedeemView,
  AdminStockView,
  AdminTicketsView,
  AdminUsersView,
} from './components/admin/AdminCoreViews';
import {
  AdminApiKeysView,
  AdminBroadcastView,
  AdminManageAdminsView,
  AdminPaymentsView,
  AdminServerApisView,
  AdminSettingsView,
  AdminSmmView,
  AdminStatsView,
} from './components/admin/AdminConfigViews';

const AppContent: React.FC = () => {
  const { mode, storePage, adminPage, currentUser, adminSession, adminData, booting } = useStore();

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (mode === 'admin') {
    if (!adminSession || !adminData) {
      return <AdminAuth />;
    }

    const renderAdminPage = () => {
      switch (adminPage) {
        case 'dashboard':
          return <AdminDashboardView />;
        case 'users':
          return <AdminUsersView />;
        case 'orders':
          return <AdminOrdersView />;
        case 'deposits':
          return <AdminDepositsView />;
        case 'tickets':
          return <AdminTicketsView />;
        case 'stock':
          return <AdminStockView />;
        case 'digital':
          return <AdminDigitalView />;
        case 'redeem':
          return <AdminRedeemView />;
        case 'payments':
          return <AdminPaymentsView />;
        case 'broadcast':
          return <AdminBroadcastView />;
        case 'apikeys':
          return <AdminApiKeysView />;
        case 'admins':
          return <AdminManageAdminsView />;
        case 'serverapis':
          return <AdminServerApisView />;
        case 'smm':
          return <AdminSmmView />;
        case 'settings':
          return <AdminSettingsView />;
        case 'stats':
          return <AdminStatsView />;
        default:
          return <AdminDashboardView />;
      }
    };

    return (
      <AdminLayout>
        <AnimatePresence mode="wait">
          <motion.div
            key={adminPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderAdminPage()}
          </motion.div>
        </AnimatePresence>
      </AdminLayout>
    );
  }

  // Storefront Mode
  const isAuthPage = storePage === 'landing' || storePage === 'login' || storePage === 'register' || !currentUser;
  if (isAuthPage) {
    return <StoreAuth />;
  }

  const renderStorePage = () => {
    switch (storePage) {
      case 'home':
        return <HomeView />;
      case 'store':
        return <StoreView />;
      case 'countries':
        return <CountriesView />;
      case 'buy':
        return <BuyConfirmView />;
      case 'order-result':
        return <OrderResultView />;
      case 'digital':
        return <DigitalShopView />;
      case 'smm':
        return <SmmServicesView />;
      case 'deposit':
        return <DepositView />;
      case 'wallet':
        return <WalletView />;
      case 'orders':
        return <OrdersView />;
      case 'redeem':
        return <RedeemView />;
      case 'support':
        return <SupportView />;
      case 'new-ticket':
        return <NewTicketView />;
      case 'ticket-chat':
        return <TicketChatView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <StoreLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={storePage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderStorePage()}
        </motion.div>
      </AnimatePresence>
    </StoreLayout>
  );
};

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
            <h1 className="font-display text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-600 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <AppContent />
        <ToastContainer />
        <ConfirmDialog />
      </StoreProvider>
    </AppErrorBoundary>
  );
}
