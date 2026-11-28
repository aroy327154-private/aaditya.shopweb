export type AppMode = 'store' | 'admin';

export type StorePage =
  | 'landing'
  | 'login'
  | 'register'
  | 'home'
  | 'store'
  | 'countries'
  | 'buy'
  | 'order-result'
  | 'deposit'
  | 'wallet'
  | 'orders'
  | 'digital'
  | 'smm'
  | 'redeem'
  | 'support'
  | 'new-ticket'
  | 'ticket-chat'
  | 'profile';

export type AdminPage =
  | 'dashboard'
  | 'users'
  | 'orders'
  | 'deposits'
  | 'tickets'
  | 'stock'
  | 'digital'
  | 'redeem'
  | 'payments'
  | 'broadcast'
  | 'apikeys'
  | 'admins'
  | 'serverapis'
  | 'smm'
  | 'settings'
  | 'stats';

export interface UserAccount {
  id: number;
  name: string;
  username: string;
  email: string;
  balance: number;
  deposited: number;
  joined: string;
  banned: boolean;
  frozen: boolean;
  hasPassword?: boolean;
  authProvider?: 'password' | 'google';
}

export type OrderKind = 'TG' | 'WhatsApp' | 'AppOTP' | 'Digital' | 'SMM';

export interface OrderRecord {
  id: string;
  userId: number;
  kind: OrderKind;
  country?: string;
  name?: string;
  phone?: string;
  price: number;
  status: 'WAIT_CODE' | 'WAIT_RETRY' | 'DONE' | 'DELIVERED' | 'CANCELLED';
  code?: string;
  date: string;
  target?: string;
  quantity?: number;
  credentials?: string;
  providerOrderId?: string;
  canFetchTgActions?: boolean;
  otherSessionsTerminated?: boolean;
}

export interface DepositRecord {
  id: number;
  userId: number;
  amount: number;
  method: string;
  utr: string;
  invoiceId?: string;
  status: 'pending' | 'success' | 'rejected';
  date: string;
  isRedeem?: boolean;
  verifiedBy?: 'admin' | 'imap' | 'bharatpe';
  screenshot?: string;
}

export type TgAccountCategory = 'all' | 'pushing' | 'premium' | 'autoreg';
export type TgSpamFilter = 'any' | 'free' | 'blocked' | 'temp';
export type TgOriginFilter =
  | 'any'
  | 'pushing'
  | 'autoreg'
  | 'resale'
  | 'stealer'
  | 'brute'
  | 'personal'
  | 'self_registration'
  | 'mixed'
  | 'fresh';
export type TgPremiumFilter = 'any' | 'premium' | 'non_premium';
export type TgEmailFilter = 'any' | 'required';
export type TgSortOrder = 'low' | 'high';

export interface ServerFilterState {
  category?: TgAccountCategory | null;
  spam: TgSpamFilter;
  origin: TgOriginFilter;
  premium: TgPremiumFilter;
  email: TgEmailFilter;
  sort: TgSortOrder;
}

export interface StockItem {
  id: string;
  phone: string;
  country: string;
  year: string;
  cat: string;
  price: number;
  twofa: string;
  available: boolean;
  origin?: 'pushing' | 'autoreg' | 'resale';
  isPremium?: boolean;
  spamBlocked?: boolean;
}

export interface DigitalProduct {
  id: number;
  name: string;
  desc: string;
  price: number;
  active: boolean;
}

export interface RedeemCode {
  code: string;
  amount: number;
  used: number;
  max: number;
  active: boolean;
}

export interface ApiKeyItem {
  id: number;
  owner: number;
  prefix: string;
  status: 'active' | 'suspended';
  expires: string;
}

export type AdminPermissionKey =
  | 'p_add_stock'
  | 'p_manage_stock'
  | 'p_stats'
  | 'p_bal'
  | 'p_settings';

export interface AdminAccount {
  id: number;
  username: string;
  p_add_stock: boolean;
  p_manage_stock: boolean;
  p_stats: boolean;
  p_bal: boolean;
  p_settings: boolean;
}

export interface ServerConfigView {
  no: 1 | 2 | 3;
  label: string;
  about: string;
  url: string;
  keyConfigured: boolean;
  keyMask: string;
  margin: number;
  lowbal: number;
}

export interface SmmCategory {
  id: number;
  name: string;
}

export interface SmmService {
  id: number;
  cat: number;
  name: string;
  rate: number;
  min: number;
  max: number;
  desc: string;
}

export interface PaymentSettings {
  manualUpi: string;
  manualName: string;
  manualEnabled: boolean;
  manualQr?: string;
  manualMin: number;
  manualMax: number;
  fampayUpi: string;
  fampayName: string;
  fampayEnabled: boolean;
  fampayQr?: string;
  fampayMin: number;
  fampayMax: number;
  bharatpeUpi: string;
  bharatpeMid: string;
  bharatpeAutoVerify?: boolean;
  bharatpeTokenConfigured?: boolean;
  bharatpeTokenMask?: string;
  bharatpeEnabled: boolean;
  bharatpeQr?: string;
  bharatpeMin: number;
  bharatpeMax: number;
  usdtAddr: string;
  usdtNet: string;
  usdtEnabled: boolean;
  usdtQr?: string;
  usdtMin: number;
  usdtMax: number;
}

export interface ImapSettingsView {
  enabled: boolean;
  host: string;
  port: number;
  email: string;
  passConfigured: boolean;
  passMask: string;
  senderFilter: string;
  autoApproveOnSubmit: boolean;
  requireInvoiceMatch?: boolean;
  pollIntervalSec: number;
}

export interface GithubBackupSettingsView {
  enabled: boolean;
  repo: string;
  branch: string;
  filePath: string;
  intervalMinutes: number;
  tokenConfigured: boolean;
  tokenMask: string;
  lastBackupAt: string | null;
  lastStatus: 'idle' | 'ok' | 'error';
  lastMessage: string;
  lastCommitUrl: string;
}

export interface StoreSettings {
  support: string;
  supportCh: string;
  usdtRate: number;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEta: string;
}

export interface PublicMaintenanceStatus {
  enabled: boolean;
  title: string;
  message: string;
  eta: string;
  support: string;
  supportCh: string;
}

export interface PublicGoogleAuthConfig {
  enabled: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface AdminGoogleAuthConfig extends PublicGoogleAuthConfig {
  configured: boolean;
}

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  createdAt: string;
  clientMsgId?: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  cat: 'payment' | 'order' | 'account' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'closed';
  date: string;
  adminReply?: string;
  repliedAt?: string;
  messages?: TicketMessage[];
  lastMessageAt?: string;
  unreadByAdmin?: number;
  unreadByUser?: number;
}

export interface BroadcastEntry {
  id: number;
  message: string;
  recipients: number;
  date: string;
}

export interface CountryOption {
  code: string;
  iso?: string;
  name: string;
  flag: string;
  price: number;
  stock: number;
  retry?: boolean;
  source?: 'api' | 'manual';
}

export interface TgAccountOption {
  id: string;
  source: 'api' | 'manual';
  title: string;
  countryCode: string;
  countryIso?: string;
  countryName: string;
  flag: string;
  price: number;
  origin: string;
  resaleOrigin?: string;
  spamStatus: 'Spam Free' | 'Temporary Spam' | 'Geo Spamblock' | 'Spam Blocked' | 'Not Checked';
  spamBlocked: boolean;
  isPremium: boolean;
  premiumEndsAt?: string | null;
  twofa: string;
  dcId?: string;
  emailLinked?: boolean;
  channelsCount?: number;
  chatsCount?: number;
  conversationsCount?: number;
  contactsCount?: number;
  adminCount?: number;
  adminSubsCount?: number;
  starsCount?: number;
  giftsCount?: number;
  nftGiftsCount?: number;
  lastSeenAt?: string | null;
  sessionCreatedAt?: string | null;
  uploadedAt?: string | null;
  dialCode?: string;
  year?: string;
  categoryLabel?: string;
}

export interface TgAccountsPageResponse {
  accounts: TgAccountOption[];
  totalItems: number | null;
  page: number;
  perPage: number;
  hasNextPage: boolean;
  nextPage: number | null;
  nextPmin?: number;
  nextPmax?: number;
  configured: boolean;
  error?: string;
}

export interface WorldCountryMeta {
  code: string;
  iso: string;
  name: string;
  flag: string;
}

export interface AppOtpServiceOption {
  code: string;
  name: string;
  stock: number;
  minPrice: number | null;
}

export interface PublicStoreState {
  user: UserAccount;
  orders: OrderRecord[];
  deposits: DepositRecord[];
  tickets: SupportTicket[];
  digital: DigitalProduct[];
  smm: {
    cats: SmmCategory[];
    services: SmmService[];
  };
  payments: PaymentSettings;
  settings: StoreSettings;
  imapAutoVerifyEnabled?: boolean;
  bharatpeAutoVerifyEnabled?: boolean;
  broadcasts?: BroadcastEntry[];
  serverStatus: {
    no: 1 | 2 | 3;
    configured: boolean;
    hasApi?: boolean;
    manualStockCount?: number;
    margin?: number;
  }[];
}

export interface AdminStoreData {
  users: UserAccount[];
  orders: OrderRecord[];
  deposits: DepositRecord[];
  stock: StockItem[];
  digital: DigitalProduct[];
  redeem: RedeemCode[];
  apikeys: ApiKeyItem[];
  admins: AdminAccount[];
  servers: ServerConfigView[];
  smm: {
    url: string;
    keyConfigured: boolean;
    keyMask: string;
    cats: SmmCategory[];
    services: SmmService[];
  };
  payments: PaymentSettings;
  imap: ImapSettingsView;
  googleAuth: AdminGoogleAuthConfig;
  githubBackup: GithubBackupSettingsView;
  settings: StoreSettings;
  tickets: SupportTicket[];
  broadcasts: BroadcastEntry[];
}
