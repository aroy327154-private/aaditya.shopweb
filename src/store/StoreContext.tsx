import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AdminPage,
  AdminPermissionKey,
  AdminStoreData,
  AppMode,
  AppOtpServiceOption,
  CountryOption,
  OrderRecord,
  PaymentSettings,
  PublicGoogleAuthConfig,
  PublicMaintenanceStatus,
  PublicStoreState,
  ServerFilterState,
  SmmService,
  StockItem,
  StorePage,
  StoreSettings,
  SupportTicket,
  TgAccountCategory,
  TgAccountOption,
  TgAccountsPageResponse,
  UserAccount,
  WorldCountryMeta,
} from '../types';
import { firebaseSignOut, signInWithGooglePopup } from '../firebase';

export interface ToastItem {
  id: number;
  message: string;
  type: 'ok' | 'err';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface StoreContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  storePage: StorePage;
  navigateStore: (page: StorePage) => void;
  adminPage: AdminPage;
  navigateAdmin: (page: AdminPage) => void;

  booting: boolean;
  adminSetupRequired: boolean;
  maintenance: PublicMaintenanceStatus;
  refreshMaintenance: () => Promise<void>;
  googleAuthConfig: PublicGoogleAuthConfig;

  userState: PublicStoreState | null;
  currentUser: UserAccount | null;
  adminData: AdminStoreData | null;
  adminSession: string | null;
  isViewAs: boolean;

  currentServer: 1 | 2 | 3;
  setCurrentServer: (s: 1 | 2 | 3) => void;
  selectedAppCode: string;
  setSelectedAppCode: (code: string) => void;
  selectedAppName: string;
  setSelectedAppName: (name: string) => void;
  appOtpStage: 'apps' | 'countries';
  setAppOtpStage: (stage: 'apps' | 'countries') => void;
  tgStage: 'categories' | 'countries' | 'accounts';
  setTgStage: (stage: 'categories' | 'countries' | 'accounts') => void;
  selectedTgCategory: TgAccountCategory | null;
  setSelectedTgCategory: (cat: TgAccountCategory | null) => void;
  selectTgCategory: (cat: TgAccountCategory) => void;
  serverFilters: ServerFilterState;
  setServerFilters: React.Dispatch<React.SetStateAction<ServerFilterState>>;
  resetServerFilters: () => void;
  selectedCountry: CountryOption | null;
  setSelectedCountry: (c: CountryOption | null) => void;
  selectedTgAccount: TgAccountOption | null;
  setSelectedTgAccount: (acct: TgAccountOption | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedTicketId: number | null;
  setSelectedTicketId: (id: number | null) => void;
  openTicketChat: (ticketId: number) => void;
  liveWsConnected: boolean;
  supportAdminOnline: boolean;
  onlineSupportUserIds: number[];
  ticketTypingState: Record<number, { by: 'user' | 'admin'; name: string; until: number }>;

  toasts: ToastItem[];
  showToast: (message: string, type?: 'ok' | 'err') => void;
  dismissToast: (id: number) => void;

  confirmState: ConfirmOptions | null;
  confirmAction: (opts: ConfirmOptions) => void;
  closeConfirm: () => void;

  // Storefront auth & account
  loginUser: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerUser: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logoutUser: () => void;
  updateProfile: (name: string, username: string, email: string) => Promise<boolean>;
  changeUserPassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  refreshUserState: () => Promise<void>;

  // Storefront live providers & orders
  fetchServerApps: () => Promise<{ apps: AppOtpServiceOption[]; configured: boolean; error?: string }>;
  fetchServerCountries: (
    server: 1 | 2 | 3,
    serviceCode?: string,
    filters?: ServerFilterState,
  ) => Promise<{ countries: CountryOption[]; configured: boolean; error?: string }>;
  fetchTgAccounts: (opts: {
    countryCode?: string;
    countryIso?: string;
    filters?: ServerFilterState;
    page?: number;
    pmin?: number;
    pmax?: number;
  }) => Promise<TgAccountsPageResponse>;
  fetchWorldCountries: () => Promise<WorldCountryMeta[]>;
  placeCountryOrder: (
    server: 1 | 2 | 3,
    country: CountryOption,
    serviceCode?: string,
    filters?: ServerFilterState,
    selectedAccount?: TgAccountOption | null,
  ) => Promise<OrderRecord | null>;
  pollOrderOtp: (orderId: string, silent?: boolean) => Promise<OrderRecord | null>;
  retryOrderOtp: (orderId: string) => Promise<OrderRecord | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  fetchTgOrderCode: (orderId: string) => Promise<string | null>;
  fetchTgOrderSession: (orderId: string) => Promise<{ stringSession: string; dcId?: string } | null>;
  resetTgOrderSessions: (orderId: string) => Promise<boolean>;
  buyDigitalProduct: (productId: number) => Promise<boolean>;
  placeSmmOrder: (service: SmmService, link: string, quantity: number) => Promise<boolean>;
  submitDeposit: (
    methodLabel: string,
    amount: number,
    utr: string,
    screenshot?: string,
  ) => Promise<boolean>;
  verifyDepositViaImap: (depositId: number, silent?: boolean) => Promise<boolean>;
  redeemGiftCode: (code: string) => Promise<boolean>;
  createSupportTicket: (cat: SupportTicket['cat'], message: string) => Promise<SupportTicket | null>;
  sendTicketMessage: (ticketId: number, text: string) => Promise<boolean>;
  reopenSupportTicket: (ticketId: number) => Promise<boolean>;
  markTicketRead: (ticketId: number, asAdmin?: boolean) => void;
  sendTicketTyping: (ticketId: number, isTyping: boolean) => void;

  // Admin auth & actions
  claimAdmin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAdmin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => void;
  viewAsUser: (userId: number) => Promise<void>;
  exitViewAs: () => void;

  updateUser: (userId: number, patch: Partial<UserAccount> & { password?: string }) => Promise<void>;
  adjustUserBalance: (userId: number, expr: string) => Promise<void>;
  toggleBanUser: (userId: number) => Promise<void>;
  toggleFreezeUser: (userId: number) => Promise<void>;
  approveDeposit: (depositId: number) => Promise<void>;
  rejectDeposit: (depositId: number) => Promise<void>;
  updateAdminOrder: (
    orderId: string,
    patch: { status?: OrderRecord['status']; code?: string; credentials?: string; refund?: boolean },
  ) => Promise<void>;
  deleteAdminOrder: (orderId: string) => Promise<void>;
  addStockItem: (item: Omit<StockItem, 'id' | 'available'>) => Promise<void>;
  updateStockItem: (id: string, patch: Partial<StockItem>) => Promise<void>;
  bulkAddStockItems: (items: Omit<StockItem, 'id' | 'available'>[]) => Promise<number>;
  toggleStockAvailability: (id: string) => Promise<void>;
  removeStockItem: (id: string) => Promise<void>;
  addDigitalProduct: (name: string, desc: string, price: number) => Promise<void>;
  updateDigitalProduct: (
    id: number,
    patch: { name?: string; desc?: string; price?: number; active?: boolean },
  ) => Promise<void>;
  toggleDigitalProduct: (id: number) => Promise<void>;
  removeDigitalProduct: (id: number) => Promise<void>;
  addRedeemCode: (code: string, amount: number, max: number) => Promise<boolean>;
  toggleRedeemCode: (code: string) => Promise<void>;
  removeRedeemCode: (code: string) => Promise<void>;
  savePaymentSettings: (patch: Partial<PaymentSettings>, label: string) => Promise<void>;
  saveImapSettings: (patch: {
    enabled?: boolean;
    host?: string;
    port?: number;
    email?: string;
    appPassword?: string;
    senderFilter?: string;
    autoApproveOnSubmit?: boolean;
    pollIntervalSec?: number;
  }) => Promise<void>;
  testImapSettings: (draft?: { host?: string; port?: number; email?: string; appPassword?: string }) => Promise<void>;
  syncImapDeposits: () => Promise<void>;
  sendBroadcast: (message: string) => Promise<void>;
  deleteBroadcast: (id: number) => Promise<void>;
  replyAdminTicket: (id: number, patch: { status?: 'open' | 'closed'; adminReply?: string }) => Promise<void>;
  sendAdminTicketMessage: (ticketId: number, text: string, status?: 'open' | 'closed') => Promise<boolean>;
  deleteAdminTicket: (id: number) => Promise<void>;
  createApiKey: (ownerId: number, days: number) => Promise<string | null>;
  toggleApiKey: (id: number) => Promise<void>;
  removeApiKey: (id: number) => Promise<void>;
  addAdminAccount: (
    username: string,
    password: string,
    perms: Record<AdminPermissionKey, boolean>,
  ) => Promise<boolean>;
  toggleAdminPermission: (id: number, key: AdminPermissionKey) => Promise<void>;
  changeAdminPassword: (id: number, password: string) => Promise<void>;
  removeAdminAccount: (id: number) => Promise<void>;
  saveServerConfig: (no: 1 | 2 | 3, patch: { url?: string; key?: string; margin?: number; lowbal?: number }) => Promise<void>;
  testServerConfig: (no: 1 | 2 | 3, draft?: { url?: string; key?: string }) => Promise<void>;
  removeServerConfig: (no: 1 | 2 | 3) => Promise<void>;
  saveSmmApi: (url: string, key?: string) => Promise<void>;
  testSmmApi: (draft?: { url?: string; key?: string }) => Promise<void>;
  addSmmCategory: (name: string) => Promise<void>;
  removeSmmCategory: (id: number) => Promise<void>;
  addSmmService: (svc: Omit<SmmService, 'id'> & { id: number }) => Promise<boolean>;
  bulkAddSmmServices: (cat: number, ids: number[], markup: number) => Promise<number>;
  updateSmmService: (id: number, patch: Partial<SmmService>) => Promise<void>;
  removeSmmService: (id: number) => Promise<void>;
  saveStoreSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  saveGoogleAuthSettings: (patch: {
    enabled?: boolean;
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    appId?: string;
  }) => Promise<boolean>;
  saveGithubBackupSettings: (patch: {
    enabled?: boolean;
    repo?: string;
    branch?: string;
    filePath?: string;
    intervalMinutes?: number;
    token?: string;
    clearToken?: boolean;
  }) => Promise<boolean>;
  runGithubBackupNow: () => Promise<boolean>;
  downloadFullBackup: () => Promise<boolean>;
  restoreFullBackup: (backupPayload: unknown) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

function getInitialModeFromUrl(): AppMode {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
    return 'admin';
  }
  return 'store';
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(getInitialModeFromUrl);
  const [storePage, setStorePage] = useState<StorePage>('landing');
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');

  const setMode = useCallback((nextMode: AppMode) => {
    setModeState(nextMode);
    if (typeof window !== 'undefined') {
      const targetPath = nextMode === 'admin' ? '/admin' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  }, []);

  const [booting, setBooting] = useState(true);
  const [adminSetupRequired, setAdminSetupRequired] = useState(false);
  const [maintenance, setMaintenance] = useState<PublicMaintenanceStatus>({
    enabled: false,
    title: 'Store Under Maintenance',
    message:
      'AadityaTg.Store is currently upgrading servers and live inventory. We will be back online shortly.',
    eta: '',
    support: '',
    supportCh: '',
  });
  const [googleAuthConfig, setGoogleAuthConfig] = useState<PublicGoogleAuthConfig>({
    enabled: true,
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  });

  // Tokens held strictly in React state memory (never localStorage)
  const [userToken, setUserToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [userState, setUserState] = useState<PublicStoreState | null>(null);
  const [viewAsState, setViewAsState] = useState<PublicStoreState | null>(null);
  const [adminData, setAdminData] = useState<AdminStoreData | null>(null);
  const [adminSession, setAdminSession] = useState<string | null>(null);

  const [currentServer, setCurrentServerState] = useState<1 | 2 | 3>(1);
  const [selectedAppCode, setSelectedAppCode] = useState<string>('tg');
  const [selectedAppName, setSelectedAppName] = useState<string>('Telegram');
  const [appOtpStage, setAppOtpStage] = useState<'apps' | 'countries'>('apps');
  const [tgStage, setTgStage] = useState<'categories' | 'countries' | 'accounts'>('categories');
  const [selectedTgCategory, setSelectedTgCategory] = useState<TgAccountCategory | null>(null);
  const [serverFilters, setServerFilters] = useState<ServerFilterState>({
    category: null,
    spam: 'any',
    origin: 'any',
    premium: 'any',
    email: 'any',
    sort: 'low',
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [selectedTgAccount, setSelectedTgAccount] = useState<TgAccountOption | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [liveWsConnected, setLiveWsConnected] = useState(false);
  const [supportAdminOnline, setSupportAdminOnline] = useState(false);
  const [onlineSupportUserIds, setOnlineSupportUserIds] = useState<number[]>([]);
  const [ticketTypingState, setTicketTypingState] = useState<
    Record<number, { by: 'user' | 'admin'; name: string; until: number }>
  >({});
  const wsRef = useRef<WebSocket | null>(null);

  const worldCountriesRef = useRef<WorldCountryMeta[] | null>(null);

  const resetServerFilters = useCallback(() => {
    setServerFilters((prev) => ({
      category: prev.category ?? null,
      spam: 'any',
      origin:
        prev.category === 'pushing'
          ? 'pushing'
          : prev.category === 'autoreg'
            ? 'autoreg'
            : 'any',
      premium: prev.category === 'premium' ? 'premium' : 'any',
      email: 'any',
      sort: 'low',
    }));
  }, []);

  const selectTgCategory = useCallback((cat: TgAccountCategory) => {
    setSelectedTgCategory(cat);
    setSelectedCountry(null);
    setSelectedTgAccount(null);
    if (cat === 'all') {
      setServerFilters({
        category: 'all',
        spam: 'any',
        origin: 'any',
        premium: 'any',
        email: 'any',
        sort: 'low',
      });
    } else if (cat === 'pushing') {
      setServerFilters({
        category: 'pushing',
        spam: 'any',
        origin: 'pushing',
        premium: 'any',
        email: 'any',
        sort: 'low',
      });
    } else if (cat === 'premium') {
      setServerFilters({
        category: 'premium',
        spam: 'any',
        origin: 'any',
        premium: 'premium',
        email: 'any',
        sort: 'low',
      });
    } else if (cat === 'autoreg') {
      setServerFilters({
        category: 'autoreg',
        spam: 'any',
        origin: 'autoreg',
        premium: 'any',
        email: 'any',
        sort: 'low',
      });
    }
    setTgStage('accounts');
  }, []);

  const setCurrentServer = useCallback((srv: 1 | 2 | 3) => {
    setCurrentServerState(srv);
    setServerFilters({
      category: null,
      spam: 'any',
      origin: 'any',
      premium: 'any',
      email: 'any',
      sort: 'low',
    });
    setSelectedTgAccount(null);
    if (srv === 1) {
      setTgStage('categories');
      setSelectedTgCategory(null);
    } else if (srv === 3) {
      setAppOtpStage('apps');
    }
  }, []);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const showToast = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback((opts: ConfirmOptions) => {
    setConfirmState(opts);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const refreshMaintenance = useCallback(async () => {
    const res = await apiRequest<{ maintenance?: PublicMaintenanceStatus }>('/api/public/maintenance');
    if (res.ok && res.data.maintenance) {
      setMaintenance(res.data.maintenance);
    }
  }, []);

  // Bootstrap initial configuration check
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await apiRequest<{
        adminSetupRequired: boolean;
        maintenance?: PublicMaintenanceStatus;
        googleAuth?: PublicGoogleAuthConfig;
      }>('/api/bootstrap');
      if (active && res.ok) {
        setAdminSetupRequired(Boolean(res.data.adminSetupRequired));
        if (res.data.maintenance) {
          setMaintenance(res.data.maintenance);
        }
        if (res.data.googleAuth) {
          setGoogleAuthConfig(res.data.googleAuth);
        }
      }
      if (active) setBooting(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeStoreState = viewAsState || userState;
  const currentUser = activeStoreState?.user || null;

  const navigateStore = useCallback(
    (page: StorePage) => {
      const authPages: StorePage[] = ['landing', 'login', 'register'];
      if (!authPages.includes(page) && !currentUser) {
        setStorePage('login');
        return;
      }
      setStorePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentUser],
  );

  const navigateAdmin = useCallback((page: AdminPage) => {
    setAdminPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshUserState = useCallback(async () => {
    if (!userToken) return;
    const res = await apiRequest<PublicStoreState>('/api/store/state', {}, userToken);
    if (res.ok) setUserState(res.data);
  }, [userToken]);

  const refreshAdminState = useCallback(async () => {
    if (!adminToken) return;
    const res = await apiRequest<{ data: AdminStoreData }>('/api/admin/state', {}, adminToken);
    if (res.ok) setAdminData(res.data.data);
  }, [adminToken]);

  const openTicketChat = useCallback(
    (ticketId: number) => {
      setSelectedTicketId(ticketId);
      setStorePage('ticket-chat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  // Real-time Support WebSocket Connection (User or Admin)
  useEffect(() => {
    const activeToken = mode === 'admin' ? adminToken : viewAsState ? null : userToken;
    if (!activeToken || typeof window === 'undefined') {
      wsRef.current?.close();
      wsRef.current = null;
      setLiveWsConnected(false);
      setSupportAdminOnline(false);
      setOnlineSupportUserIds([]);
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let attempt = 0;

    const mergeTicket = (incoming: SupportTicket) => {
      setUserState((prev) => {
        if (!prev || prev.user.id !== incoming.userId) return prev;
        const exists = prev.tickets.some((t) => t.id === incoming.id);
        const tickets = exists
          ? prev.tickets.map((t) => (t.id === incoming.id ? incoming : t))
          : [incoming, ...prev.tickets];
        return { ...prev, tickets };
      });
      setAdminData((prev) => {
        if (!prev) return prev;
        const exists = prev.tickets.some((t) => t.id === incoming.id);
        const tickets = exists
          ? prev.tickets.map((t) => (t.id === incoming.id ? incoming : t))
          : [incoming, ...prev.tickets];
        return { ...prev, tickets };
      });
    };

    const removeTicket = (ticketId: number) => {
      setUserState((prev) =>
        prev ? { ...prev, tickets: prev.tickets.filter((t) => t.id !== ticketId) } : prev,
      );
      setAdminData((prev) =>
        prev ? { ...prev, tickets: prev.tickets.filter((t) => t.id !== ticketId) } : prev,
      );
    };

    const connect = () => {
      if (cancelled) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws/support?token=${encodeURIComponent(activeToken)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        const wasReconnect = attempt > 0;
        attempt = 0;
        setLiveWsConnected(true);
        if (wasReconnect) {
          if (mode === 'admin') void refreshAdminState();
          else void refreshUserState();
        }
        heartbeatTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25_000);
      };

      ws.onmessage = (event) => {
        let payload: {
          type?: string;
          ticketId?: number;
          ticket?: SupportTicket;
          adminOnline?: boolean;
          onlineUserIds?: number[];
          sender?: 'user' | 'admin';
          senderName?: string;
          isTyping?: boolean;
          error?: string;
        };
        try {
          payload = JSON.parse(String(event.data));
        } catch {
          return;
        }

        if (payload.type === 'support:presence') {
          setSupportAdminOnline(Boolean(payload.adminOnline));
          if (Array.isArray(payload.onlineUserIds)) {
            setOnlineSupportUserIds(payload.onlineUserIds);
          }
          return;
        }

        if (
          (payload.type === 'ticket:created' ||
            payload.type === 'ticket:message' ||
            payload.type === 'ticket:updated' ||
            payload.type === 'ticket:sync') &&
          payload.ticket
        ) {
          mergeTicket(payload.ticket);
          if (payload.type === 'ticket:message' && payload.ticketId) {
            setTicketTypingState((prev) => {
              if (!prev[payload.ticketId!]) return prev;
              const next = { ...prev };
              delete next[payload.ticketId!];
              return next;
            });
          }
          return;
        }

        if (payload.type === 'ticket:deleted' && payload.ticketId) {
          removeTicket(payload.ticketId);
          return;
        }

        if (payload.type === 'ticket:typing' && payload.ticketId && payload.sender) {
          const tid = payload.ticketId;
          if (payload.isTyping) {
            setTicketTypingState((prev) => ({
              ...prev,
              [tid]: {
                by: payload.sender!,
                name: payload.senderName || (payload.sender === 'admin' ? 'Support Team' : 'User'),
                until: Date.now() + 4500,
              },
            }));
          } else {
            setTicketTypingState((prev) => {
              if (!prev[tid]) return prev;
              const next = { ...prev };
              delete next[tid];
              return next;
            });
          }
        }
      };

      ws.onclose = () => {
        if (heartbeatTimer !== null) {
          window.clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        setLiveWsConnected(false);
        if (!cancelled) {
          const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
          attempt += 1;
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    const pruneTimer = window.setInterval(() => {
      const now = Date.now();
      setTicketTypingState((prev) => {
        let changed = false;
        const next: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.until > now) next[Number(k)] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1500);

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      window.clearInterval(pruneTimer);
      wsRef.current?.close();
      wsRef.current = null;
      setLiveWsConnected(false);
    };
  }, [mode, userToken, adminToken, viewAsState, refreshUserState, refreshAdminState]);

  // Storefront Auth
  const loginUser = useCallback(
    async (email: string, password: string) => {
      const res = await apiRequest<{ token: string; state: PublicStoreState }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return { ok: false, error: res.data.error || 'Login failed' };
      setViewAsState(null);
      setUserToken(res.data.token);
      setUserState(res.data.state);
      setStorePage('home');
      showToast(`Welcome back, ${res.data.state.user.name}!`);
      return { ok: true };
    },
    [showToast],
  );

  const registerUser = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await apiRequest<{ token: string; state: PublicStoreState }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return { ok: false, error: res.data.error || 'Registration failed' };
      setViewAsState(null);
      setUserToken(res.data.token);
      setUserState(res.data.state);
      setStorePage('home');
      showToast('Account created successfully');
      return { ok: true };
    },
    [showToast],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!googleAuthConfig.enabled) {
      return { ok: false, error: 'Google sign-in is currently disabled by the store administrator.' };
    }
    try {
      const { idToken } = await signInWithGooglePopup(googleAuthConfig);
      const res = await apiRequest<{ token: string; isNewUser?: boolean; state: PublicStoreState }>(
        '/api/auth/google',
        {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        },
      );
      if (!res.ok) return { ok: false, error: res.data.error || 'Google sign-in failed' };
      setViewAsState(null);
      setUserToken(res.data.token);
      setUserState(res.data.state);
      setStorePage('home');
      showToast(
        res.data.isNewUser
          ? `Account created! Welcome, ${res.data.state.user.name}`
          : `Welcome back, ${res.data.state.user.name}!`,
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Google sign-in failed' };
    }
  }, [googleAuthConfig, showToast]);

  const logoutUser = useCallback(() => {
    setViewAsState(null);
    setUserToken(null);
    setUserState(null);
    setStorePage('landing');
    void firebaseSignOut().catch(() => {});
    showToast('Signed out');
  }, [showToast]);

  const updateProfile = useCallback(
    async (name: string, username: string, email: string): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ user: UserAccount }>(
        '/api/account/profile',
        { method: 'PUT', body: JSON.stringify({ name, username, email }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not update profile', 'err');
        return false;
      }
      setUserState((prev) => (prev ? { ...prev, user: res.data.user } : prev));
      showToast('Profile details updated');
      return true;
    },
    [userToken, showToast],
  );

  const changeUserPassword = useCallback(
    async (oldPassword: string, newPassword: string, confirmPassword: string): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ ok: boolean; user?: UserAccount }>(
        '/api/account/password',
        { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not change password', 'err');
        return false;
      }
      if (res.data.user) {
        setUserState((prev) => (prev ? { ...prev, user: res.data.user! } : prev));
      }
      showToast('Password updated successfully');
      return true;
    },
    [userToken, showToast],
  );

  // Storefront Live Operations
  const fetchServerApps = useCallback(async () => {
    const token = userToken;
    if (!token) return { apps: [], configured: false, error: 'Sign in required' };
    const res = await apiRequest<{ apps: AppOtpServiceOption[]; configured: boolean }>(
      '/api/providers/apps',
      {},
      token,
    );
    if (!res.ok) {
      return {
        apps: [],
        configured: Boolean(res.data.configured),
        error: res.data.error || 'Unable to load available apps right now',
      };
    }
    return { apps: res.data.apps || [], configured: Boolean(res.data.configured) };
  }, [userToken]);

  const fetchServerCountries = useCallback(
    async (server: 1 | 2 | 3, serviceCode?: string, filters?: ServerFilterState) => {
      const token = userToken;
      if (!token) return { countries: [], configured: false, error: 'Sign in required' };
      const qs = new URLSearchParams({ server: String(server) });
      if (serviceCode) qs.set('service', serviceCode);
      if (filters) {
        if (filters.category) qs.set('category', filters.category);
        if (filters.spam && filters.spam !== 'any') qs.set('spam', filters.spam);
        if (filters.origin && filters.origin !== 'any') qs.set('origin', filters.origin);
        if (filters.premium && filters.premium !== 'any') qs.set('premium', filters.premium);
        if (filters.email && filters.email !== 'any') qs.set('email', filters.email);
        if (filters.sort && filters.sort !== 'low') qs.set('sort', filters.sort);
      }
      const res = await apiRequest<{ countries: CountryOption[]; configured: boolean }>(
        `/api/providers/countries?${qs.toString()}`,
        {},
        token,
      );
      if (!res.ok) {
        return {
          countries: [],
          configured: false,
          error: res.data.error || 'Unable to load available countries right now',
        };
      }
      return { countries: res.data.countries || [], configured: Boolean(res.data.configured) };
    },
    [userToken],
  );

  const fetchTgAccounts = useCallback(
    async (opts: {
      countryCode?: string;
      countryIso?: string;
      filters?: ServerFilterState;
      page?: number;
      pmin?: number;
      pmax?: number;
    }): Promise<TgAccountsPageResponse> => {
      const token = userToken;
      const page = Math.max(1, Math.floor(Number(opts.page) || 1));
      if (!token) {
        return {
          accounts: [],
          totalItems: null,
          page,
          perPage: 40,
          hasNextPage: false,
          nextPage: null,
          configured: false,
          error: 'Sign in required',
        };
      }
      const qs = new URLSearchParams();
      if (opts.countryCode && opts.countryCode.toUpperCase() !== 'ALL') {
        qs.set('country', opts.countryCode);
      }
      if (opts.countryIso) qs.set('iso', opts.countryIso);
      qs.set('page', String(page));
      if (opts.pmin && opts.pmin > 0) qs.set('pmin', String(opts.pmin));
      if (opts.pmax && opts.pmax > 0) qs.set('pmax', String(opts.pmax));
      if (opts.filters) {
        if (opts.filters.category) qs.set('category', opts.filters.category);
        if (opts.filters.spam && opts.filters.spam !== 'any') qs.set('spam', opts.filters.spam);
        if (opts.filters.origin && opts.filters.origin !== 'any') qs.set('origin', opts.filters.origin);
        if (opts.filters.premium && opts.filters.premium !== 'any') qs.set('premium', opts.filters.premium);
        if (opts.filters.email && opts.filters.email !== 'any') qs.set('email', opts.filters.email);
        if (opts.filters.sort && opts.filters.sort !== 'low') qs.set('sort', opts.filters.sort);
      }
      const res = await apiRequest<TgAccountsPageResponse>(
        `/api/providers/tg-accounts?${qs.toString()}`,
        {},
        token,
      );
      if (!res.ok) {
        return {
          accounts: [],
          totalItems: null,
          page,
          perPage: 40,
          hasNextPage: false,
          nextPage: null,
          configured: Boolean(res.data.configured),
          error: res.data.error || 'Unable to load available accounts right now',
        };
      }
      return {
        accounts: res.data.accounts || [],
        totalItems: typeof res.data.totalItems === 'number' ? res.data.totalItems : null,
        page: typeof res.data.page === 'number' ? res.data.page : page,
        perPage: typeof res.data.perPage === 'number' ? res.data.perPage : 40,
        hasNextPage: Boolean(res.data.hasNextPage),
        nextPage: typeof res.data.nextPage === 'number' ? res.data.nextPage : null,
        nextPmin: typeof res.data.nextPmin === 'number' ? res.data.nextPmin : undefined,
        nextPmax: typeof res.data.nextPmax === 'number' ? res.data.nextPmax : undefined,
        configured: Boolean(res.data.configured),
      };
    },
    [userToken],
  );

  const fetchWorldCountries = useCallback(async (): Promise<WorldCountryMeta[]> => {
    if (worldCountriesRef.current && worldCountriesRef.current.length > 0) {
      return worldCountriesRef.current;
    }
    const token = userToken;
    if (!token) return [];
    const res = await apiRequest<{ countries: WorldCountryMeta[] }>(
      '/api/providers/world-countries',
      {},
      token,
    );
    if (res.ok && Array.isArray(res.data.countries)) {
      worldCountriesRef.current = res.data.countries;
      return res.data.countries;
    }
    return [];
  }, [userToken]);

  const placeCountryOrder = useCallback(
    async (
      server: 1 | 2 | 3,
      country: CountryOption,
      serviceCode?: string,
      filters?: ServerFilterState,
      selectedAccount?: TgAccountOption | null,
    ): Promise<OrderRecord | null> => {
      if (!userToken) return null;
      const effectiveSource = selectedAccount?.source || country.source || 'api';
      const effectivePrice = selectedAccount?.price ?? country.price;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState }>(
        '/api/orders/buy',
        {
          method: 'POST',
          body: JSON.stringify({
            server,
            countryCode: selectedAccount?.countryCode || country.code,
            countryName: selectedAccount?.countryName || country.name,
            price: effectivePrice,
            source: effectiveSource,
            serviceCode,
            ...(filters ? { filters } : {}),
            ...(selectedAccount
              ? effectiveSource === 'manual'
                ? { stockId: selectedAccount.id }
                : { itemId: selectedAccount.id }
              : {}),
          }),
        },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Purchase failed', 'err');
        return null;
      }
      setUserState(res.data.state);
      setSelectedOrderId(res.data.order.id);
      showToast(res.data.order.status === 'DONE' ? 'Order completed!' : 'Number issued! Waiting for OTP…');
      return res.data.order;
    },
    [userToken, showToast],
  );

  const pollOrderOtp = useCallback(
    async (orderId: string, silent = false): Promise<OrderRecord | null> => {
      if (!userToken) return null;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState }>(
        `/api/orders/${encodeURIComponent(orderId)}/check-otp`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        if (!silent) showToast(res.data.error || 'OTP check failed', 'err');
        return null;
      }
      setUserState(res.data.state);
      if (res.data.order.status === 'DONE' && res.data.order.code) {
        showToast(`OTP received: ${res.data.order.code}`);
      } else if (!silent && res.data.order.status === 'WAIT_RETRY') {
        showToast(
          res.data.order.code
            ? `Code received (${res.data.order.code}) — Retry SMS available`
            : 'Retry SMS available',
        );
      } else if (!silent && res.data.order.status === 'WAIT_CODE') {
        showToast('Still waiting for SMS…');
      }
      return res.data.order;
    },
    [userToken, showToast],
  );

  const retryOrderOtp = useCallback(
    async (orderId: string): Promise<OrderRecord | null> => {
      if (!userToken) return null;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState }>(
        `/api/orders/${encodeURIComponent(orderId)}/retry-otp`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not request a new SMS', 'err');
        return null;
      }
      setUserState(res.data.state);
      showToast('New SMS requested — waiting for OTP…');
      return res.data.order;
    },
    [userToken, showToast],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!userToken) return;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState; alreadyReceived?: boolean }>(
        `/api/orders/${encodeURIComponent(orderId)}/cancel`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not cancel order', 'err');
        return;
      }
      setUserState(res.data.state);
      if (res.data.alreadyReceived && res.data.order.code) {
        showToast(`OTP already arrived (${res.data.order.code}) — order completed`);
      } else {
        showToast('Order cancelled and refunded');
      }
    },
    [userToken, showToast],
  );

  const fetchTgOrderCode = useCallback(
    async (orderId: string): Promise<string | null> => {
      if (!userToken) return null;
      const res = await apiRequest<{ code: string; order: OrderRecord; state: PublicStoreState }>(
        `/api/orders/${encodeURIComponent(orderId)}/tg-code`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Login code not received yet', 'err');
        return null;
      }
      setUserState(res.data.state);
      showToast(`Login code received: ${res.data.code}`);
      return res.data.code;
    },
    [userToken, showToast],
  );

  const fetchTgOrderSession = useCallback(
    async (orderId: string): Promise<{ stringSession: string; dcId?: string } | null> => {
      if (!userToken) return null;
      const res = await apiRequest<{ stringSession: string; dcId?: string }>(
        `/api/orders/${encodeURIComponent(orderId)}/tg-session`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Session string is not available for this account', 'err');
        return null;
      }
      showToast('Session string loaded');
      return { stringSession: res.data.stringSession, dcId: res.data.dcId };
    },
    [userToken, showToast],
  );

  const resetTgOrderSessions = useCallback(
    async (orderId: string): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ ok: boolean; state: PublicStoreState }>(
        `/api/orders/${encodeURIComponent(orderId)}/tg-reset-sessions`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not terminate other sessions', 'err');
        return false;
      }
      setUserState(res.data.state);
      showToast('Other active Telegram sessions terminated');
      return true;
    },
    [userToken, showToast],
  );

  const buyDigitalProduct = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState }>(
        '/api/orders/digital',
        { method: 'POST', body: JSON.stringify({ productId }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Purchase failed', 'err');
        return false;
      }
      setUserState(res.data.state);
      setSelectedOrderId(res.data.order.id);
      showToast('Digital product purchased!');
      return true;
    },
    [userToken, showToast],
  );

  const placeSmmOrder = useCallback(
    async (service: SmmService, link: string, quantity: number): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ order: OrderRecord; state: PublicStoreState }>(
        '/api/orders/smm',
        { method: 'POST', body: JSON.stringify({ serviceId: service.id, link, quantity }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'SMM order failed', 'err');
        return false;
      }
      setUserState(res.data.state);
      showToast(`SMM order placed (${quantity} units)`);
      return true;
    },
    [userToken, showToast],
  );

  const submitDeposit = useCallback(
    async (
      methodLabel: string,
      amount: number,
      utr: string,
      screenshot?: string,
    ): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ autoVerified?: boolean; state: PublicStoreState }>(
        '/api/deposits',
        {
          method: 'POST',
          body: JSON.stringify({
            method: methodLabel,
            amount,
            utr,
            ...(screenshot ? { screenshot } : {}),
          }),
        },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Deposit submission failed', 'err');
        return false;
      }
      setUserState(res.data.state);
      showToast(
        res.data.autoVerified
          ? `₹${amount} verified & credited instantly!`
          : `₹${amount} deposit submitted — automatic verification is running`,
      );
      return true;
    },
    [userToken, showToast],
  );

  const verifyDepositViaImap = useCallback(
    async (depositId: number, silent = false): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ verified: boolean; state: PublicStoreState }>(
        `/api/deposits/${depositId}/verify-imap`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        if (!silent) showToast(res.data.error || 'Unable to verify payment right now', 'err');
        return false;
      }
      setUserState(res.data.state);
      if (res.data.verified) {
        showToast('Payment verified & credited to your wallet!');
        return true;
      }
      if (!silent) {
        showToast('Payment confirmation not received yet — we will keep checking automatically', 'err');
      }
      return false;
    },
    [userToken, showToast],
  );

  const redeemGiftCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!userToken) return false;
      const res = await apiRequest<{ amount: number; state: PublicStoreState }>(
        '/api/redeem',
        { method: 'POST', body: JSON.stringify({ code }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Invalid code', 'err');
        return false;
      }
      setUserState(res.data.state);
      showToast(`₹${res.data.amount} credited to your wallet!`);
      return true;
    },
    [userToken, showToast],
  );

  const createSupportTicket = useCallback(
    async (cat: SupportTicket['cat'], message: string): Promise<SupportTicket | null> => {
      if (!userToken) return null;
      const res = await apiRequest<{ ticket: SupportTicket; state: PublicStoreState }>(
        '/api/tickets',
        { method: 'POST', body: JSON.stringify({ cat, message }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not submit ticket', 'err');
        return null;
      }
      setUserState(res.data.state);
      showToast('Support chat started');
      return res.data.ticket || res.data.state.tickets[0] || null;
    },
    [userToken, showToast],
  );

  const sendTicketMessage = useCallback(
    async (ticketId: number, text: string): Promise<boolean> => {
      if (!userToken || viewAsState) return false;
      const clean = text.trim();
      if (!clean) return false;
      const clientMsgId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: 'ticket:send', ticketId, text: clean, clientMsgId }),
        );
        return true;
      }

      const res = await apiRequest<{ state: PublicStoreState }>(
        `/api/tickets/${ticketId}/messages`,
        { method: 'POST', body: JSON.stringify({ text: clean, clientMsgId }) },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not send message', 'err');
        return false;
      }
      setUserState(res.data.state);
      return true;
    },
    [userToken, viewAsState, showToast],
  );

  const reopenSupportTicket = useCallback(
    async (ticketId: number): Promise<boolean> => {
      if (!userToken || viewAsState) return false;
      const res = await apiRequest<{ state: PublicStoreState }>(
        `/api/tickets/${ticketId}/reopen`,
        { method: 'POST' },
        userToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not reopen ticket', 'err');
        return false;
      }
      setUserState(res.data.state);
      showToast('Ticket reopened');
      return true;
    },
    [userToken, viewAsState, showToast],
  );

  const markTicketRead = useCallback(
    (ticketId: number, asAdmin = false) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ticket:read', ticketId }));
        return;
      }
      if (asAdmin && adminToken) {
        void apiRequest<{ data: AdminStoreData }>(
          `/api/admin/tickets/${ticketId}/read`,
          { method: 'POST' },
          adminToken,
        ).then((r) => {
          if (r.ok) setAdminData(r.data.data);
        });
      } else if (!asAdmin && userToken && !viewAsState) {
        void apiRequest<{ state: PublicStoreState }>(
          `/api/tickets/${ticketId}/read`,
          { method: 'POST' },
          userToken,
        ).then((r) => {
          if (r.ok) setUserState(r.data.state);
        });
      }
    },
    [adminToken, userToken, viewAsState],
  );

  const sendTicketTyping = useCallback((ticketId: number, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ticket:typing', ticketId, isTyping }));
    }
  }, []);

  // Admin Auth & Actions
  const claimAdmin = useCallback(
    async (username: string, password: string) => {
      const res = await apiRequest<{ token: string; adminUsername: string; data: AdminStoreData }>(
        '/api/admin/claim',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      );
      if (!res.ok) return { ok: false, error: res.data.error || 'Setup failed' };
      setAdminSetupRequired(false);
      setAdminToken(res.data.token);
      setAdminSession(res.data.adminUsername);
      setAdminData(res.data.data);
      showToast('Primary admin account created');
      return { ok: true };
    },
    [showToast],
  );

  const loginAdmin = useCallback(
    async (username: string, password: string) => {
      const res = await apiRequest<{ token: string; adminUsername: string; data: AdminStoreData }>(
        '/api/admin/login',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      );
      if (!res.ok) return { ok: false, error: res.data.error || 'Invalid credentials' };
      setAdminToken(res.data.token);
      setAdminSession(res.data.adminUsername);
      setAdminData(res.data.data);
      showToast('Signed in to Admin Console');
      return { ok: true };
    },
    [showToast],
  );

  const logoutAdmin = useCallback(() => {
    setAdminToken(null);
    setAdminSession(null);
    setAdminData(null);
    setViewAsState(null);
    showToast('Signed out of Admin Console');
  }, [showToast]);

  const viewAsUser = useCallback(
    async (userId: number) => {
      if (!adminToken) return;
      const res = await apiRequest<{ userState: PublicStoreState }>(
        `/api/admin/view-as/${userId}`,
        { method: 'POST' },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not open user view', 'err');
        return;
      }
      setViewAsState(res.data.userState);
      setMode('store');
      setStorePage('home');
      showToast(`Previewing storefront as ${res.data.userState.user.name}`);
    },
    [adminToken, showToast],
  );

  const exitViewAs = useCallback(() => {
    setViewAsState(null);
    setMode('admin');
    showToast('Returned to Admin Console');
  }, [showToast]);

  const adminMutate = useCallback(
    async (url: string, method: string, body?: unknown, successMsg?: string) => {
      if (!adminToken) return false;
      const res = await apiRequest<{ data: AdminStoreData }>(
        url,
        { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Action failed', 'err');
        return false;
      }
      setAdminData(res.data.data);
      if (userToken) {
        refreshUserState();
      }
      if (successMsg) showToast(successMsg);
      return true;
    },
    [adminToken, userToken, refreshUserState, showToast],
  );

  const updateUser = useCallback(
    async (userId: number, patch: Partial<UserAccount> & { password?: string }) => {
      await adminMutate(`/api/admin/users/${userId}`, 'PUT', patch, 'User updated');
    },
    [adminMutate],
  );

  const adjustUserBalance = useCallback(
    async (userId: number, expr: string) => {
      await adminMutate(`/api/admin/users/${userId}/balance`, 'POST', { expr }, 'Balance updated');
    },
    [adminMutate],
  );

  const toggleBanUser = useCallback(
    async (userId: number) => {
      const target = adminData?.users.find((u) => u.id === userId);
      if (!target) return;
      await adminMutate(
        `/api/admin/users/${userId}`,
        'PUT',
        { banned: !target.banned },
        target.banned ? 'User unbanned' : 'User banned',
      );
    },
    [adminData?.users, adminMutate],
  );

  const toggleFreezeUser = useCallback(
    async (userId: number) => {
      const target = adminData?.users.find((u) => u.id === userId);
      if (!target) return;
      await adminMutate(
        `/api/admin/users/${userId}`,
        'PUT',
        { frozen: !target.frozen },
        target.frozen ? 'User unfrozen' : 'User wallet frozen',
      );
    },
    [adminData?.users, adminMutate],
  );

  const approveDeposit = useCallback(
    async (depositId: number) => {
      await adminMutate(`/api/admin/deposits/${depositId}/approve`, 'POST', undefined, 'Deposit approved');
    },
    [adminMutate],
  );

  const rejectDeposit = useCallback(
    async (depositId: number) => {
      await adminMutate(`/api/admin/deposits/${depositId}/reject`, 'POST', undefined, 'Deposit rejected');
    },
    [adminMutate],
  );

  const updateAdminOrder = useCallback(
    async (
      orderId: string,
      patch: { status?: OrderRecord['status']; code?: string; credentials?: string; refund?: boolean },
    ) => {
      await adminMutate(`/api/admin/orders/${encodeURIComponent(orderId)}`, 'PUT', patch, 'Order updated');
    },
    [adminMutate],
  );

  const deleteAdminOrder = useCallback(
    async (orderId: string) => {
      await adminMutate(`/api/admin/orders/${encodeURIComponent(orderId)}`, 'DELETE', undefined, 'Order deleted');
    },
    [adminMutate],
  );

  const addStockItem = useCallback(
    async (item: Omit<StockItem, 'id' | 'available'>) => {
      await adminMutate('/api/admin/stock', 'POST', item, 'Stock item added');
    },
    [adminMutate],
  );

  const updateStockItem = useCallback(
    async (id: string, patch: Partial<StockItem>) => {
      await adminMutate(`/api/admin/stock/${encodeURIComponent(id)}`, 'PUT', patch, 'Stock updated');
    },
    [adminMutate],
  );

  const bulkAddStockItems = useCallback(
    async (items: Omit<StockItem, 'id' | 'available'>[]): Promise<number> => {
      if (!adminToken) return 0;
      const res = await apiRequest<{ added: number; data: AdminStoreData }>(
        '/api/admin/stock/bulk',
        { method: 'POST', body: JSON.stringify({ items }) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Bulk stock import failed', 'err');
        return 0;
      }
      setAdminData(res.data.data);
      showToast(`${res.data.added} stock account(s) added`);
      return res.data.added;
    },
    [adminToken, showToast],
  );

  const toggleStockAvailability = useCallback(
    async (id: string) => {
      await adminMutate(`/api/admin/stock/${encodeURIComponent(id)}/toggle`, 'POST');
    },
    [adminMutate],
  );

  const removeStockItem = useCallback(
    async (id: string) => {
      await adminMutate(`/api/admin/stock/${encodeURIComponent(id)}`, 'DELETE', undefined, 'Stock item removed');
    },
    [adminMutate],
  );

  const addDigitalProduct = useCallback(
    async (name: string, desc: string, price: number) => {
      await adminMutate('/api/admin/digital', 'POST', { name, desc, price }, 'Digital product added');
    },
    [adminMutate],
  );

  const updateDigitalProduct = useCallback(
    async (id: number, patch: { name?: string; desc?: string; price?: number; active?: boolean }) => {
      await adminMutate(`/api/admin/digital/${id}`, 'PUT', patch, 'Product updated');
    },
    [adminMutate],
  );

  const toggleDigitalProduct = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/digital/${id}/toggle`, 'POST');
    },
    [adminMutate],
  );

  const removeDigitalProduct = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/digital/${id}`, 'DELETE', undefined, 'Product deleted');
    },
    [adminMutate],
  );

  const addRedeemCode = useCallback(
    async (code: string, amount: number, max: number) => {
      return adminMutate('/api/admin/redeem', 'POST', { code, amount, max }, `Code ${code.toUpperCase()} created`);
    },
    [adminMutate],
  );

  const toggleRedeemCode = useCallback(
    async (code: string) => {
      await adminMutate(`/api/admin/redeem/${encodeURIComponent(code)}/toggle`, 'POST');
    },
    [adminMutate],
  );

  const removeRedeemCode = useCallback(
    async (code: string) => {
      await adminMutate(`/api/admin/redeem/${encodeURIComponent(code)}`, 'DELETE', undefined, 'Redeem code deleted');
    },
    [adminMutate],
  );

  const savePaymentSettings = useCallback(
    async (patch: Partial<PaymentSettings>, label: string) => {
      await adminMutate('/api/admin/payments', 'PUT', patch, `${label} settings saved`);
    },
    [adminMutate],
  );

  const saveImapSettings = useCallback(
    async (patch: {
      enabled?: boolean;
      host?: string;
      port?: number;
      email?: string;
      appPassword?: string;
      senderFilter?: string;
      autoApproveOnSubmit?: boolean;
      pollIntervalSec?: number;
    }) => {
      await adminMutate('/api/admin/imap', 'PUT', patch, 'Gmail IMAP verification settings saved');
    },
    [adminMutate],
  );

  const testImapSettings = useCallback(
    async (draft?: { host?: string; port?: number; email?: string; appPassword?: string }) => {
      if (!adminToken) return;
      const res = await apiRequest<{ ok: boolean; detail: string }>(
        '/api/admin/imap/test',
        { method: 'POST', body: JSON.stringify(draft || {}) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'IMAP test failed', 'err');
        return;
      }
      showToast(res.data.detail);
    },
    [adminToken, showToast],
  );

  const syncImapDeposits = useCallback(async () => {
    if (!adminToken) return;
    const res = await apiRequest<{ checked: number; approved: number; data: AdminStoreData }>(
      '/api/admin/imap/sync',
      { method: 'POST' },
      adminToken,
    );
    if (!res.ok) {
      showToast(res.data.error || 'IMAP sync failed', 'err');
      return;
    }
    setAdminData(res.data.data);
    showToast(`Checked ${res.data.checked} pending deposit(s) · ${res.data.approved} auto-approved`);
  }, [adminToken, showToast]);

  const sendBroadcast = useCallback(
    async (message: string) => {
      await adminMutate('/api/admin/broadcast', 'POST', { message }, 'Broadcast queued');
    },
    [adminMutate],
  );

  const deleteBroadcast = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/broadcast/${id}`, 'DELETE', undefined, 'Broadcast deleted');
    },
    [adminMutate],
  );

  const replyAdminTicket = useCallback(
    async (id: number, patch: { status?: 'open' | 'closed'; adminReply?: string }) => {
      await adminMutate(`/api/admin/tickets/${id}`, 'PUT', patch, 'Ticket updated');
    },
    [adminMutate],
  );

  const sendAdminTicketMessage = useCallback(
    async (ticketId: number, text: string, status?: 'open' | 'closed'): Promise<boolean> => {
      if (!adminToken) return false;
      const clean = text.trim();
      if (!clean) return false;
      const clientMsgId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: 'ticket:send', ticketId, text: clean, status, clientMsgId }),
        );
        return true;
      }

      const res = await apiRequest<{ data: AdminStoreData }>(
        `/api/admin/tickets/${ticketId}/messages`,
        { method: 'POST', body: JSON.stringify({ text: clean, status, clientMsgId }) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not send message', 'err');
        return false;
      }
      setAdminData(res.data.data);
      return true;
    },
    [adminToken, showToast],
  );

  const deleteAdminTicket = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/tickets/${id}`, 'DELETE', undefined, 'Ticket deleted');
    },
    [adminMutate],
  );

  const createApiKey = useCallback(
    async (ownerId: number, days: number): Promise<string | null> => {
      if (!adminToken) return null;
      const res = await apiRequest<{ createdKey: string; data: AdminStoreData }>(
        '/api/admin/apikeys',
        { method: 'POST', body: JSON.stringify({ owner: ownerId, days }) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Could not create API key', 'err');
        return null;
      }
      setAdminData(res.data.data);
      showToast('API key created (copied to clipboard)');
      navigator.clipboard?.writeText(res.data.createdKey);
      return res.data.createdKey;
    },
    [adminToken, showToast],
  );

  const toggleApiKey = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/apikeys/${id}/toggle`, 'POST');
    },
    [adminMutate],
  );

  const removeApiKey = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/apikeys/${id}`, 'DELETE', undefined, 'API key deleted');
    },
    [adminMutate],
  );

  const addAdminAccount = useCallback(
    async (username: string, password: string, perms: Record<AdminPermissionKey, boolean>) => {
      return adminMutate('/api/admin/admins', 'POST', { username, password, perms }, `Sub-admin ${username} added`);
    },
    [adminMutate],
  );

  const toggleAdminPermission = useCallback(
    async (id: number, key: AdminPermissionKey) => {
      await adminMutate(`/api/admin/admins/${id}/perm`, 'POST', { key }, 'Permission updated');
    },
    [adminMutate],
  );

  const changeAdminPassword = useCallback(
    async (id: number, password: string) => {
      await adminMutate(`/api/admin/admins/${id}/password`, 'PUT', { password }, 'Admin password updated');
    },
    [adminMutate],
  );

  const removeAdminAccount = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/admins/${id}`, 'DELETE', undefined, 'Admin removed');
    },
    [adminMutate],
  );

  const saveServerConfig = useCallback(
    async (no: 1 | 2 | 3, patch: { url?: string; key?: string; margin?: number; lowbal?: number }) => {
      await adminMutate(`/api/admin/servers/${no}`, 'PUT', patch, `Server ${no} settings saved`);
    },
    [adminMutate],
  );

  const testServerConfig = useCallback(
    async (no: 1 | 2 | 3, draft?: { url?: string; key?: string }) => {
      if (!adminToken) return;
      const res = await apiRequest<{ ok: boolean; detail: string }>(
        `/api/admin/servers/${no}/test`,
        { method: 'POST', body: JSON.stringify(draft || {}) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Provider test failed', 'err');
        return;
      }
      showToast(res.data.detail);
    },
    [adminToken, showToast],
  );

  const removeServerConfig = useCallback(
    async (no: 1 | 2 | 3) => {
      await adminMutate(`/api/admin/servers/${no}`, 'DELETE', undefined, `Server ${no} API cleared`);
    },
    [adminMutate],
  );

  const saveSmmApi = useCallback(
    async (url: string, key?: string) => {
      await adminMutate('/api/admin/smm/api', 'PUT', { url, key }, 'SMM API saved');
    },
    [adminMutate],
  );

  const testSmmApi = useCallback(
    async (draft?: { url?: string; key?: string }) => {
      if (!adminToken) return;
      const res = await apiRequest<{ ok: boolean; detail: string }>(
        '/api/admin/smm/test',
        { method: 'POST', body: JSON.stringify(draft || {}) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'SMM API test failed', 'err');
        return;
      }
      showToast(res.data.detail);
    },
    [adminToken, showToast],
  );

  const addSmmCategory = useCallback(
    async (name: string) => {
      await adminMutate('/api/admin/smm/categories', 'POST', { name }, `Category "${name}" created`);
    },
    [adminMutate],
  );

  const removeSmmCategory = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/smm/categories/${id}`, 'DELETE', undefined, 'Category removed');
    },
    [adminMutate],
  );

  const addSmmService = useCallback(
    async (svc: Omit<SmmService, 'id'> & { id: number }) => {
      return adminMutate('/api/admin/smm/services', 'POST', svc, 'SMM service added');
    },
    [adminMutate],
  );

  const bulkAddSmmServices = useCallback(
    async (cat: number, ids: number[], markup: number): Promise<number> => {
      if (!adminToken) return 0;
      const res = await apiRequest<{ added: number; fetchedFromApi: boolean; data: AdminStoreData }>(
        '/api/admin/smm/services/bulk',
        { method: 'POST', body: JSON.stringify({ cat, ids, markup }) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Bulk import failed', 'err');
        return 0;
      }
      setAdminData(res.data.data);
      showToast(
        res.data.fetchedFromApi
          ? `${res.data.added} service(s) synced live from SMM API`
          : `${res.data.added} service(s) added`,
      );
      return res.data.added;
    },
    [adminToken, showToast],
  );

  const updateSmmService = useCallback(
    async (id: number, patch: Partial<SmmService>) => {
      await adminMutate(`/api/admin/smm/services/${id}`, 'PUT', patch, 'SMM service updated');
    },
    [adminMutate],
  );

  const removeSmmService = useCallback(
    async (id: number) => {
      await adminMutate(`/api/admin/smm/services/${id}`, 'DELETE', undefined, 'SMM service removed');
    },
    [adminMutate],
  );

  const saveStoreSettings = useCallback(
    async (patch: Partial<StoreSettings>) => {
      if (!adminToken) return;
      const res = await apiRequest<{
        data: AdminStoreData;
        maintenance?: PublicMaintenanceStatus;
      }>(
        '/api/admin/settings',
        { method: 'PUT', body: JSON.stringify(patch) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Failed to save settings', 'err');
        return;
      }
      setAdminData(res.data.data);
      if (res.data.maintenance) {
        setMaintenance(res.data.maintenance);
      }
      if (userToken) {
        await refreshUserState();
      }
      showToast('Store settings saved');
    },
    [adminToken, userToken, refreshUserState, showToast],
  );

  const saveGoogleAuthSettings = useCallback(
    async (patch: {
      enabled?: boolean;
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      appId?: string;
    }): Promise<boolean> => {
      if (!adminToken) return false;
      const res = await apiRequest<{
        data: AdminStoreData;
        googleAuth?: PublicGoogleAuthConfig;
      }>(
        '/api/admin/google-auth',
        { method: 'PUT', body: JSON.stringify(patch) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Failed to save Google Login settings', 'err');
        return false;
      }
      setAdminData(res.data.data);
      if (res.data.googleAuth) {
        setGoogleAuthConfig(res.data.googleAuth);
      }
      showToast('Google Login settings saved');
      return true;
    },
    [adminToken, showToast],
  );

  const saveGithubBackupSettings = useCallback(
    async (patch: {
      enabled?: boolean;
      repo?: string;
      branch?: string;
      filePath?: string;
      intervalMinutes?: number;
      token?: string;
      clearToken?: boolean;
    }): Promise<boolean> => {
      if (!adminToken) return false;
      const res = await apiRequest<{ data: AdminStoreData }>(
        '/api/admin/github-backup',
        { method: 'PUT', body: JSON.stringify(patch) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Failed to save GitHub backup settings', 'err');
        return false;
      }
      setAdminData(res.data.data);
      showToast('GitHub auto-backup settings saved');
      return true;
    },
    [adminToken, showToast],
  );

  const runGithubBackupNow = useCallback(async (): Promise<boolean> => {
    if (!adminToken) return false;
    const res = await apiRequest<{
      ok: boolean;
      message?: string;
      data?: AdminStoreData;
    }>(
      '/api/admin/github-backup/run',
      { method: 'POST' },
      adminToken,
    );
    if (res.data.data) {
      setAdminData(res.data.data);
    }
    if (!res.ok) {
      showToast(res.data.error || 'GitHub backup failed', 'err');
      return false;
    }
    showToast(res.data.message || 'GitHub backup completed');
    return true;
  }, [adminToken, showToast]);

  const downloadFullBackup = useCallback(async (): Promise<boolean> => {
    if (!adminToken) return false;
    const res = await apiRequest<{ backup: unknown }>(
      '/api/admin/backup',
      { method: 'GET' },
      adminToken,
    );
    if (!res.ok || !res.data.backup) {
      showToast(res.data.error || 'Failed to download full backup', 'err');
      return false;
    }
    const blob = new Blob([JSON.stringify(res.data.backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaditya-tg-store-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full DB backup JSON downloaded');
    return true;
  }, [adminToken, showToast]);

  const restoreFullBackup = useCallback(
    async (backupPayload: unknown): Promise<boolean> => {
      if (!adminToken) return false;
      const res = await apiRequest<{
        ok: boolean;
        summary: { users: number; orders: number; deposits: number; stock: number };
        data: AdminStoreData;
      }>(
        '/api/admin/restore',
        { method: 'POST', body: JSON.stringify({ backup: backupPayload }) },
        adminToken,
      );
      if (!res.ok) {
        showToast(res.data.error || 'Database restore failed', 'err');
        return false;
      }
      setAdminData(res.data.data);
      if (userToken) {
        await refreshUserState();
      }
      const s = res.data.summary;
      showToast(`DB restored (${s.users} users, ${s.orders} orders, ${s.deposits} deposits)`);
      return true;
    },
    [adminToken, userToken, refreshUserState, showToast],
  );

  const value: StoreContextValue = {
    mode,
    setMode,
    storePage,
    navigateStore,
    adminPage,
    navigateAdmin,
    booting,
    adminSetupRequired,
    maintenance,
    refreshMaintenance,
    googleAuthConfig,
    userState: activeStoreState,
    currentUser,
    adminData,
    adminSession,
    isViewAs: viewAsState !== null,
    currentServer,
    setCurrentServer,
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
    selectedCountry,
    setSelectedCountry,
    selectedTgAccount,
    setSelectedTgAccount,
    selectedOrderId,
    setSelectedOrderId,
    selectedTicketId,
    setSelectedTicketId,
    openTicketChat,
    liveWsConnected,
    supportAdminOnline,
    onlineSupportUserIds,
    ticketTypingState,
    toasts,
    showToast,
    dismissToast,
    confirmState,
    confirmAction,
    closeConfirm,
    loginUser,
    registerUser,
    loginWithGoogle,
    logoutUser,
    updateProfile,
    changeUserPassword,
    refreshUserState,
    fetchServerApps,
    fetchServerCountries,
    fetchTgAccounts,
    fetchWorldCountries,
    placeCountryOrder,
    pollOrderOtp,
    retryOrderOtp,
    cancelOrder,
    fetchTgOrderCode,
    fetchTgOrderSession,
    resetTgOrderSessions,
    buyDigitalProduct,
    placeSmmOrder,
    submitDeposit,
    verifyDepositViaImap,
    redeemGiftCode,
    createSupportTicket,
    sendTicketMessage,
    reopenSupportTicket,
    markTicketRead,
    sendTicketTyping,
    claimAdmin,
    loginAdmin,
    logoutAdmin,
    viewAsUser,
    exitViewAs,
    updateUser,
    adjustUserBalance,
    toggleBanUser,
    toggleFreezeUser,
    approveDeposit,
    rejectDeposit,
    updateAdminOrder,
    deleteAdminOrder,
    addStockItem,
    updateStockItem,
    bulkAddStockItems,
    toggleStockAvailability,
    removeStockItem,
    addDigitalProduct,
    updateDigitalProduct,
    toggleDigitalProduct,
    removeDigitalProduct,
    addRedeemCode,
    toggleRedeemCode,
    removeRedeemCode,
    savePaymentSettings,
    saveImapSettings,
    testImapSettings,
    syncImapDeposits,
    sendBroadcast,
    deleteBroadcast,
    replyAdminTicket,
    sendAdminTicketMessage,
    deleteAdminTicket,
    createApiKey,
    toggleApiKey,
    removeApiKey,
    addAdminAccount,
    toggleAdminPermission,
    changeAdminPassword,
    removeAdminAccount,
    saveServerConfig,
    testServerConfig,
    removeServerConfig,
    saveSmmApi,
    testSmmApi,
    addSmmCategory,
    removeSmmCategory,
    addSmmService,
    bulkAddSmmServices,
    updateSmmService,
    removeSmmService,
    saveStoreSettings,
    saveGoogleAuthSettings,
    saveGithubBackupSettings,
    runGithubBackupNow,
    downloadFullBackup,
    restoreFullBackup,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
