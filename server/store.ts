import fs from 'node:fs';
import path from 'node:path';
import { maskSecret, validateExternalApiUrl } from './security.ts';

export interface ServerUser {
  id: number;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  balance: number;
  deposited: number;
  joined: string;
  banned: boolean;
  frozen: boolean;
  authProvider?: 'password' | 'google';
}

export interface ServerOrder {
  id: string;
  userId: number;
  kind: 'TG' | 'WhatsApp' | 'AppOTP' | 'Digital' | 'SMM';
  country?: string;
  name?: string;
  phone?: string;
  price: number;
  status: 'WAIT_CODE' | 'WAIT_RETRY' | 'DONE' | 'DELIVERED' | 'CANCELLED';
  code?: string;
  date: string;
  target?: string;
  quantity?: number;
  provider?: 'lolzteam' | 'tiger' | 'smm' | 'manual';
  activationId?: string;
  providerOrderId?: string;
  credentials?: string;
  otherSessionsTerminated?: boolean;
  refunded?: boolean;
}

export interface ServerDeposit {
  id: number;
  userId: number;
  amount: number;
  method: string;
  utr: string;
  status: 'pending' | 'success' | 'rejected';
  date: string;
  isRedeem?: boolean;
  verifiedBy?: 'admin' | 'imap';
  screenshot?: string;
  matchedEmailUid?: number;
}

export interface ServerStockItem {
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

export interface ServerDigitalProduct {
  id: number;
  name: string;
  desc: string;
  price: number;
  active: boolean;
}

export interface ServerRedeemCode {
  code: string;
  amount: number;
  used: number;
  max: number;
  active: boolean;
  usedBy: number[];
}

export interface ServerApiKeyItem {
  id: number;
  owner: number;
  prefix: string;
  fullKey: string;
  status: 'active' | 'suspended';
  expires: string;
}

export interface ServerSubAdmin {
  id: number;
  username: string;
  passwordHash: string;
  p_add_stock: boolean;
  p_manage_stock: boolean;
  p_stats: boolean;
  p_bal: boolean;
  p_settings: boolean;
}

export interface ServerProviderConfig {
  no: 1 | 2 | 3;
  label: string;
  about: string;
  url: string;
  key: string;
  margin: number;
  lowbal: number;
}

export interface ServerSmmCategory {
  id: number;
  name: string;
}

export interface ServerSmmService {
  id: number;
  cat: number;
  name: string;
  rate: number;
  min: number;
  max: number;
  desc: string;
}

export interface ServerPaymentSettings {
  manualUpi: string;
  manualName: string;
  manualEnabled: boolean;
  manualQr: string;
  manualMin: number;
  manualMax: number;
  fampayUpi: string;
  fampayName: string;
  fampayEnabled: boolean;
  fampayQr: string;
  fampayMin: number;
  fampayMax: number;
  bharatpeUpi: string;
  bharatpeMid: string;
  bharatpeEnabled: boolean;
  bharatpeQr: string;
  bharatpeMin: number;
  bharatpeMax: number;
  usdtAddr: string;
  usdtNet: string;
  usdtEnabled: boolean;
  usdtQr: string;
  usdtMin: number;
  usdtMax: number;
}

export interface ServerImapSettings {
  enabled: boolean;
  host: string;
  port: number;
  email: string;
  appPassword: string;
  senderFilter: string;
  autoApproveOnSubmit: boolean;
  pollIntervalSec: number;
}

export interface ServerGithubBackupSettings {
  enabled: boolean;
  repo: string;
  branch: string;
  filePath: string;
  token: string;
  intervalMinutes: number;
  lastBackupAt: string | null;
  lastStatus: 'idle' | 'ok' | 'error';
  lastMessage: string;
  lastCommitUrl: string;
}

export interface ServerGoogleAuthSettings {
  enabled: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface ServerStoreSettings {
  support: string;
  supportCh: string;
  usdtRate: number;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEta: string;
}

export interface ServerTicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  createdAt: string;
  clientMsgId?: string;
}

export interface ServerTicket {
  id: number;
  userId: number;
  cat: 'payment' | 'order' | 'account' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'closed';
  date: string;
  adminReply?: string;
  repliedAt?: string;
  messages?: ServerTicketMessage[];
  lastMessageAt?: string;
  unreadByAdmin?: number;
  unreadByUser?: number;
}

export interface ServerBroadcast {
  id: number;
  message: string;
  recipients: number;
  date: string;
}

export interface PersistedDb {
  primaryAdmin: { username: string; passwordHash: string } | null;
  users: ServerUser[];
  orders: ServerOrder[];
  deposits: ServerDeposit[];
  stock: ServerStockItem[];
  digital: ServerDigitalProduct[];
  redeem: ServerRedeemCode[];
  apikeys: ServerApiKeyItem[];
  admins: ServerSubAdmin[];
  servers: ServerProviderConfig[];
  smm: {
    url: string;
    key: string;
    cats: ServerSmmCategory[];
    services: ServerSmmService[];
  };
  payments: ServerPaymentSettings;
  imap: ServerImapSettings;
  githubBackup: ServerGithubBackupSettings;
  googleAuth: ServerGoogleAuthSettings;
  settings: ServerStoreSettings;
  tickets: ServerTicket[];
  broadcasts: ServerBroadcast[];
  usedUtrs: string[];
  usedEmailUids: number[];
}

export function normalizeUtr(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function loadDefaultGoogleAuthFromFile(): ServerGoogleAuthSettings {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as {
        apiKey?: string;
        authDomain?: string;
        projectId?: string;
        appId?: string;
      };
      const apiKey = String(parsed.apiKey || '').trim();
      const authDomain = String(parsed.authDomain || '').trim();
      const projectId = String(parsed.projectId || '').trim();
      const appId = String(parsed.appId || '').trim();
      return {
        enabled: Boolean(apiKey && projectId),
        apiKey,
        authDomain,
        projectId,
        appId,
      };
    }
  } catch {
    // fallback to disabled blank config
  }
  return {
    enabled: false,
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  };
}

const DEFAULT_GOOGLE_AUTH = loadDefaultGoogleAuthFromFile();

const DATA_DIR = path.resolve(
  process.env.STORE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data'),
);
const DB_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_DB: PersistedDb = {
  primaryAdmin: null,
  users: [],
  orders: [],
  deposits: [],
  stock: [],
  digital: [
    {
      id: 1,
      name: 'Telegram Premium 1 Month',
      desc: 'Official Telegram Premium activation',
      price: 199,
      active: true,
    },
    {
      id: 2,
      name: 'Canva Pro 1 Year',
      desc: 'Full workspace design tool access',
      price: 149,
      active: true,
    },
    {
      id: 3,
      name: 'ChatGPT Plus Account',
      desc: 'Ready-to-use dedicated credentials',
      price: 399,
      active: true,
    },
  ],
  redeem: [],
  apikeys: [],
  admins: [],
  servers: [
    {
      no: 1,
      label: 'Server 1 · TG Accounts',
      about: 'Accounts (Lolzteam Market API). Paste Bearer Access Token with market scope.',
      url: 'https://api.lzt.market',
      key: '',
      margin: 10,
      lowbal: 100,
    },
    {
      no: 2,
      label: 'Server 2 · WhatsApp OTP',
      about: 'WhatsApp OTP numbers (Tiger SMS API).',
      url: 'https://api.tiger-sms.com',
      key: '',
      margin: 15,
      lowbal: 50,
    },
    {
      no: 3,
      label: 'Server 3 · All App OTP',
      about: 'OTP numbers for all apps. If key is empty, the Server 2 key is used.',
      url: 'https://api.tiger-sms.com',
      key: '',
      margin: 12,
      lowbal: 0,
    },
  ],
  smm: {
    url: '',
    key: '',
    cats: [
      { id: 1, name: 'Telegram' },
      { id: 2, name: 'Instagram' },
      { id: 3, name: 'YouTube' },
    ],
    services: [],
  },
  payments: {
    manualUpi: '',
    manualName: 'AadityaTg.Store',
    manualEnabled: true,
    manualQr: '',
    manualMin: 10,
    manualMax: 50000,
    fampayUpi: '',
    fampayName: 'AadityaTg.Store',
    fampayEnabled: false,
    fampayQr: '',
    fampayMin: 10,
    fampayMax: 50000,
    bharatpeUpi: '',
    bharatpeMid: '',
    bharatpeEnabled: false,
    bharatpeQr: '',
    bharatpeMin: 10,
    bharatpeMax: 50000,
    usdtAddr: '',
    usdtNet: 'TRC20',
    usdtEnabled: false,
    usdtQr: '',
    usdtMin: 100,
    usdtMax: 500000,
  },
  imap: {
    enabled: false,
    host: 'imap.gmail.com',
    port: 993,
    email: '',
    appPassword: '',
    senderFilter: 'fampay,famapp',
    autoApproveOnSubmit: true,
    pollIntervalSec: 30,
  },
  githubBackup: {
    enabled: false,
    repo: '',
    branch: 'main',
    filePath: 'backups/aadityatg-store-latest-backup.json',
    token: '',
    intervalMinutes: 120,
    lastBackupAt: null,
    lastStatus: 'idle',
    lastMessage: '',
    lastCommitUrl: '',
  },
  googleAuth: DEFAULT_GOOGLE_AUTH,
  settings: {
    support: 'https://t.me/AADITYAXOFFICAL',
    supportCh: 'https://t.me/+yhaYNpSyF5U3Y2Q9',
    usdtRate: 92,
    maintenanceMode: false,
    maintenanceTitle: 'Store Under Maintenance',
    maintenanceMessage:
      'AadityaTg.Store is currently upgrading servers and live inventory. We will be back online shortly.',
    maintenanceEta: '~15 minutes',
  },
  tickets: [],
  broadcasts: [],
  usedUtrs: [],
  usedEmailUids: [],
};

function hydrateIntegrityLists(target: PersistedDb): PersistedDb {
  const utrSet = new Set<string>(
    (Array.isArray(target.usedUtrs) ? target.usedUtrs : []).map((u) => normalizeUtr(u)).filter(Boolean),
  );
  const uidSet = new Set<number>(
    (Array.isArray(target.usedEmailUids) ? target.usedEmailUids : [])
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n > 0),
  );
  for (const dep of target.deposits) {
    if (dep.status === 'success' && !dep.isRedeem && dep.utr) {
      const norm = normalizeUtr(dep.utr);
      if (norm) utrSet.add(norm);
    }
    if (typeof dep.matchedEmailUid === 'number' && dep.matchedEmailUid > 0) {
      uidSet.add(dep.matchedEmailUid);
    }
  }
  for (const ord of target.orders) {
    if (ord.status === 'CANCELLED' && ord.refunded === undefined) {
      ord.refunded = true;
    }
  }
  target.usedUtrs = Array.from(utrSet);
  target.usedEmailUids = Array.from(uidSet);
  return target;
}

function loadDbFromDisk(): PersistedDb {
  try {
    if (!fs.existsSync(DB_FILE)) return structuredClone(INITIAL_DB);
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedDb>;
    const merged: PersistedDb = {
      ...structuredClone(INITIAL_DB),
      ...parsed,
      smm: { ...INITIAL_DB.smm, ...(parsed.smm || {}) },
      payments: { ...INITIAL_DB.payments, ...(parsed.payments || {}) },
      imap: { ...INITIAL_DB.imap, ...(parsed.imap || {}) },
      githubBackup: { ...INITIAL_DB.githubBackup, ...(parsed.githubBackup || {}) },
      googleAuth: { ...INITIAL_DB.googleAuth, ...(parsed.googleAuth || {}) },
      settings: { ...INITIAL_DB.settings, ...(parsed.settings || {}) },
      usedUtrs: Array.isArray(parsed.usedUtrs) ? parsed.usedUtrs : [],
      usedEmailUids: Array.isArray(parsed.usedEmailUids) ? parsed.usedEmailUids : [],
    };
    return hydrateIntegrityLists(merged);
  } catch {
    return structuredClone(INITIAL_DB);
  }
}

let db: PersistedDb = loadDbFromDisk();

export function getDb(): PersistedDb {
  return db;
}

export function saveDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function sanitizeUser(u: ServerUser) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    balance: u.balance,
    deposited: u.deposited,
    joined: u.joined,
    banned: u.banned,
    frozen: u.frozen,
    hasPassword: Boolean(u.passwordHash),
    authProvider: u.authProvider || 'password',
  };
}

export function sanitizeOrderForUser(o: ServerOrder) {
  const { provider: _p, providerOrderId: _po, activationId: _a, refunded: _r, ...rest } = o;
  return {
    ...rest,
    canFetchTgActions: Boolean(o.kind === 'TG' && o.provider === 'lolzteam' && o.providerOrderId),
  };
}

export function sanitizeDepositForUser(d: ServerDeposit) {
  const { matchedEmailUid: _u, ...rest } = d;
  return rest;
}

export function getPublicGoogleAuthConfig() {
  const cfg = db.googleAuth || DEFAULT_GOOGLE_AUTH;
  const apiKey = (cfg.apiKey || '').trim();
  const authDomain = (cfg.authDomain || '').trim();
  const projectId = (cfg.projectId || '').trim();
  const appId = (cfg.appId || '').trim();
  const configured = Boolean(apiKey && authDomain && projectId && appId);
  const enabled = Boolean(cfg.enabled && configured);
  return {
    enabled,
    configured,
    apiKey: enabled ? apiKey : '',
    authDomain: enabled ? authDomain : '',
    projectId: enabled ? projectId : '',
    appId: enabled ? appId : '',
  };
}

export function normalizeTicket(t: ServerTicket): ServerTicket {
  const user = db.users.find((u) => u.id === t.userId);
  const existing = Array.isArray(t.messages) ? t.messages : [];
  if (existing.length > 0) {
    return {
      ...t,
      messages: existing,
      lastMessageAt: t.lastMessageAt || existing[existing.length - 1]?.createdAt || t.date,
      unreadByAdmin: Number(t.unreadByAdmin) || 0,
      unreadByUser: Number(t.unreadByUser) || 0,
    };
  }
  const initialMessages: ServerTicketMessage[] = [];
  if (t.message) {
    initialMessages.push({
      id: `t_${t.id}_init`,
      sender: 'user',
      senderName: user?.name || user?.username || `User #${t.userId}`,
      text: t.message,
      createdAt: t.date,
    });
  }
  if (t.adminReply) {
    initialMessages.push({
      id: `t_${t.id}_legacy_reply`,
      sender: 'admin',
      senderName: 'Support Team',
      text: t.adminReply,
      createdAt: t.repliedAt || t.date,
    });
  }
  return {
    ...t,
    messages: initialMessages,
    lastMessageAt:
      t.lastMessageAt || initialMessages[initialMessages.length - 1]?.createdAt || t.date,
    unreadByAdmin: Number(t.unreadByAdmin) || 0,
    unreadByUser: Number(t.unreadByUser) || 0,
  };
}

export function getPublicUserPayload(user: ServerUser) {
  return {
    user: sanitizeUser(user),
    orders: db.orders.filter((o) => o.userId === user.id).map(sanitizeOrderForUser),
    deposits: db.deposits.filter((d) => d.userId === user.id).map(sanitizeDepositForUser),
    tickets: db.tickets.filter((t) => t.userId === user.id).map(normalizeTicket),
    digital: db.digital.filter((d) => d.active),
    smm: {
      cats: db.smm.cats,
      services: db.smm.services,
    },
    payments: db.payments,
    settings: db.settings,
    imapAutoVerifyEnabled: Boolean(db.imap.enabled && db.imap.email && db.imap.appPassword),
    broadcasts: db.broadcasts.slice(0, 3),
    serverStatus: db.servers.map((s) => {
      const s2Key = db.servers.find((x) => x.no === 2)?.key || '';
      const hasKey = Boolean(s.key || (s.no === 3 && s2Key));
      const hasManualStock = s.no === 1 && db.stock.some((st) => st.available);
      return {
        no: s.no,
        configured: Boolean((s.url && hasKey) || hasManualStock),
      };
    }),
  };
}

export function getAdminPayload() {
  const s2Key = db.servers.find((x) => x.no === 2)?.key || '';
  return {
    users: db.users.map(sanitizeUser),
    orders: db.orders,
    deposits: db.deposits,
    stock: db.stock,
    digital: db.digital,
    redeem: db.redeem.map(({ usedBy: _u, ...rest }) => rest),
    apikeys: db.apikeys.map(({ fullKey: _k, ...rest }) => rest),
    admins: db.admins.map(({ passwordHash: _p, ...rest }) => rest),
    servers: db.servers.map((s) => ({
      no: s.no,
      label: s.label,
      about: s.about,
      url: s.url,
      keyConfigured: Boolean(s.key || (s.no === 3 && s2Key)),
      keyMask: maskSecret(s.key),
      margin: s.margin,
      lowbal: s.lowbal,
    })),
    smm: {
      url: db.smm.url,
      keyConfigured: Boolean(db.smm.key),
      keyMask: maskSecret(db.smm.key),
      cats: db.smm.cats,
      services: db.smm.services,
    },
    payments: db.payments,
    imap: {
      enabled: db.imap.enabled,
      host: db.imap.host,
      port: db.imap.port,
      email: db.imap.email,
      passConfigured: Boolean(db.imap.appPassword),
      passMask: maskSecret(db.imap.appPassword),
      senderFilter: db.imap.senderFilter,
      autoApproveOnSubmit: db.imap.autoApproveOnSubmit,
      pollIntervalSec: db.imap.pollIntervalSec,
    },
    githubBackup: {
      enabled: db.githubBackup.enabled,
      repo: db.githubBackup.repo,
      branch: db.githubBackup.branch,
      filePath: db.githubBackup.filePath,
      intervalMinutes: db.githubBackup.intervalMinutes,
      tokenConfigured: Boolean(db.githubBackup.token || process.env.GITHUB_BACKUP_TOKEN),
      tokenMask: maskSecret(db.githubBackup.token || process.env.GITHUB_BACKUP_TOKEN || ''),
      lastBackupAt: db.githubBackup.lastBackupAt,
      lastStatus: db.githubBackup.lastStatus,
      lastMessage: db.githubBackup.lastMessage,
      lastCommitUrl: db.githubBackup.lastCommitUrl,
    },
    googleAuth: {
      enabled: Boolean(db.googleAuth?.enabled),
      apiKey: db.googleAuth?.apiKey || '',
      authDomain: db.googleAuth?.authDomain || '',
      projectId: db.googleAuth?.projectId || '',
      appId: db.googleAuth?.appId || '',
      configured: Boolean(
        db.googleAuth?.apiKey &&
          db.googleAuth?.authDomain &&
          db.googleAuth?.projectId &&
          db.googleAuth?.appId,
      ),
    },
    settings: db.settings,
    tickets: db.tickets.map(normalizeTicket),
    broadcasts: db.broadcasts,
  };
}

export interface FullDbBackupEnvelope {
  format: 'aaditya-tg-store-full-backup';
  version: 1;
  exportedAt: string;
  db: PersistedDb;
}

export function exportFullDbBackup(): FullDbBackupEnvelope {
  return {
    format: 'aaditya-tg-store-full-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    db: structuredClone(db),
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function restoreDbFromBackup(
  raw: unknown,
): { ok: true; summary: { users: number; orders: number; deposits: number; stock: number } } | { ok: false; error: string } {
  if (!isPlainRecord(raw)) {
    return { ok: false, error: 'Backup payload must be a JSON object' };
  }

  let unpacked: Record<string, unknown> = raw;
  if (
    raw.format === 'aaditya-tg-store-full-backup-encoded' &&
    typeof raw.payloadBase64 === 'string' &&
    raw.payloadBase64.trim()
  ) {
    try {
      const decoded = JSON.parse(
        Buffer.from(raw.payloadBase64.trim(), 'base64').toString('utf8'),
      ) as unknown;
      if (!isPlainRecord(decoded)) {
        return { ok: false, error: 'Invalid encoded backup payload' };
      }
      unpacked = decoded;
    } catch {
      return { ok: false, error: 'Could not decode base64 backup payload' };
    }
  }

  const candidate =
    unpacked.format === 'aaditya-tg-store-full-backup' && isPlainRecord(unpacked.db)
      ? unpacked.db
      : unpacked;

  if (
    !Array.isArray(candidate.users) ||
    !Array.isArray(candidate.orders) ||
    !Array.isArray(candidate.deposits)
  ) {
    return {
      ok: false,
      error: 'Invalid backup file: missing required users, orders, or deposits arrays',
    };
  }

  // Validate users minimally & ensure finite non-negative balances
  for (const item of candidate.users) {
    if (!isPlainRecord(item) || typeof item.id !== 'number' || typeof item.email !== 'string') {
      return { ok: false, error: 'Invalid user record found in backup file' };
    }
    if (
      typeof item.balance !== 'number' ||
      !Number.isFinite(item.balance) ||
      item.balance < 0 ||
      typeof item.deposited !== 'number' ||
      !Number.isFinite(item.deposited) ||
      item.deposited < 0
    ) {
      return { ok: false, error: `Invalid balance values for user ${item.email}` };
    }
  }

  const arrayKeys = [
    'stock',
    'digital',
    'redeem',
    'apikeys',
    'admins',
    'servers',
    'tickets',
    'broadcasts',
  ] as const;

  for (const key of arrayKeys) {
    if (candidate[key] !== undefined && !Array.isArray(candidate[key])) {
      return { ok: false, error: `Invalid backup file: "${key}" must be an array` };
    }
  }

  const defaults = structuredClone(INITIAL_DB);

  const rawSmm = isPlainRecord(candidate.smm) ? candidate.smm : {};
  const smmUrl = typeof rawSmm.url === 'string' ? rawSmm.url.trim() : defaults.smm.url;
  if (smmUrl) {
    const check = validateExternalApiUrl(smmUrl);
    if (!check.ok) return { ok: false, error: `Invalid SMM URL in backup: ${check.error}` };
  }

  const rawServers = Array.isArray(candidate.servers) ? (candidate.servers as ServerProviderConfig[]) : defaults.servers;
  for (const srv of rawServers) {
    if (!isPlainRecord(srv) || ![1, 2, 3].includes(Number(srv.no))) {
      return { ok: false, error: 'Invalid server configuration entry in backup' };
    }
    if (typeof srv.url === 'string' && srv.url.trim()) {
      const check = validateExternalApiUrl(srv.url.trim());
      if (!check.ok) return { ok: false, error: `Invalid Server ${srv.no} URL in backup: ${check.error}` };
    }
  }

  const rawImap = isPlainRecord(candidate.imap) ? (candidate.imap as Partial<ServerImapSettings>) : {};
  if (typeof rawImap.host === 'string' && rawImap.host.trim()) {
    const hostCheck = validateExternalApiUrl(`https://${rawImap.host.trim()}`);
    if (!hostCheck.ok) return { ok: false, error: `Invalid IMAP host in backup: ${hostCheck.error}` };
  }

  const rawPrimary = isPlainRecord(candidate.primaryAdmin) ? candidate.primaryAdmin : null;
  const restoredPrimary =
    rawPrimary &&
    typeof rawPrimary.username === 'string' &&
    rawPrimary.username.trim() &&
    typeof rawPrimary.passwordHash === 'string' &&
    rawPrimary.passwordHash.trim()
      ? {
          username: rawPrimary.username.trim(),
          passwordHash: rawPrimary.passwordHash.trim(),
        }
      : db.primaryAdmin;

  const rawPayments = isPlainRecord(candidate.payments)
    ? (candidate.payments as Partial<ServerPaymentSettings>)
    : {};
  const rawSettings = isPlainRecord(candidate.settings)
    ? (candidate.settings as Partial<ServerStoreSettings>)
    : {};

  // Cleanly re-serialize via JSON round-trip to strip any unexpected prototype keys
  const nextDb: PersistedDb = JSON.parse(
    JSON.stringify({
      primaryAdmin: restoredPrimary,
      users: candidate.users,
      orders: candidate.orders,
      deposits: candidate.deposits,
      stock: Array.isArray(candidate.stock) ? candidate.stock : defaults.stock,
      digital: Array.isArray(candidate.digital) ? candidate.digital : defaults.digital,
      redeem: Array.isArray(candidate.redeem) ? candidate.redeem : defaults.redeem,
      apikeys: Array.isArray(candidate.apikeys) ? candidate.apikeys : defaults.apikeys,
      admins: Array.isArray(candidate.admins) ? candidate.admins : defaults.admins,
      servers: rawServers.length ? rawServers : defaults.servers,
      smm: {
        url: smmUrl,
        key: typeof rawSmm.key === 'string' ? rawSmm.key : defaults.smm.key,
        cats: Array.isArray(rawSmm.cats) ? (rawSmm.cats as ServerSmmCategory[]) : defaults.smm.cats,
        services: Array.isArray(rawSmm.services)
          ? (rawSmm.services as ServerSmmService[])
          : defaults.smm.services,
      },
      payments: { ...defaults.payments, ...rawPayments },
      imap: { ...defaults.imap, ...rawImap },
      githubBackup: {
        ...defaults.githubBackup,
        ...(isPlainRecord(candidate.githubBackup) ? candidate.githubBackup : {}),
        // Preserve existing token if the restored JSON intentionally omitted it
        token:
          isPlainRecord(candidate.githubBackup) &&
          typeof candidate.githubBackup.token === 'string' &&
          candidate.githubBackup.token.trim()
            ? candidate.githubBackup.token.trim()
            : db.githubBackup.token,
      },
      googleAuth: {
        ...defaults.googleAuth,
        ...(isPlainRecord(candidate.googleAuth) ? candidate.googleAuth : {}),
      },
      settings: { ...defaults.settings, ...rawSettings },
      tickets: Array.isArray(candidate.tickets) ? candidate.tickets : defaults.tickets,
      broadcasts: Array.isArray(candidate.broadcasts) ? candidate.broadcasts : defaults.broadcasts,
      usedUtrs: Array.isArray(candidate.usedUtrs) ? candidate.usedUtrs : [],
      usedEmailUids: Array.isArray(candidate.usedEmailUids) ? candidate.usedEmailUids : [],
    }),
  ) as PersistedDb;

  db = hydrateIntegrityLists(nextDb);
  saveDb();

  return {
    ok: true,
    summary: {
      users: db.users.length,
      orders: db.orders.length,
      deposits: db.deposits.length,
      stock: db.stock.length,
    },
  };
}

