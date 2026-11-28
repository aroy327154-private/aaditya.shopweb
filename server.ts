import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getFirebaseAdminAuth } from 'firebase-admin/auth';
import {
  hashPassword,
  nowTimestamp,
  signSessionToken,
  validateExternalApiUrl,
  verifyPassword,
  verifySessionToken,
} from './server/security.ts';
import {
  exportFullDbBackup,
  getAdminPayload,
  getDb,
  getPublicGoogleAuthConfig,
  getPublicUserPayload,
  normalizeTicket,
  normalizeUtr,
  restoreDbFromBackup,
  sanitizeDepositForUser,
  sanitizeOrderForUser,
  sanitizeUser,
  saveDb,
  type ServerDeposit,
  type ServerOrder,
  type ServerTicket,
  type ServerTicketMessage,
  type ServerUser,
} from './server/store.ts';
import {
  buyLolzteamTelegram,
  buyTigerNumber,
  cancelTigerOtp,
  checkTigerOtp,
  fetchLolzteamAccountsPage,
  fetchLolzteamCountries,
  fetchLolzteamLoginCode,
  fetchLolzteamSessionString,
  fetchSmmPanelServices,
  fetchTigerCountries,
  fetchTigerServices,
  getAllWorldCountries,
  placeSmmPanelOrder,
  resetLolzteamAuthorizations,
  resolveCountryMeta,
  retryTigerOtp,
  testLolzteam,
  testSmmPanel,
  testTigerSms,
  type ProviderCountryItem,
  type ProviderTgAccount,
  type TgAccountFilters,
} from './server/providers.ts';
import {
  resolveGithubBackupToken,
  runGithubFullBackup,
  validateGithubBackupConfig,
} from './server/githubBackup.ts';
import {
  doesEmailMatchPayment,
  extractPaymentIdentifiers,
  fetchRecentPaymentEmails,
  testImapConnection,
  verifySingleDepositViaImap,
} from './server/imapVerifier.ts';
import {
  doesBharatpeTxMatchDeposit,
  fetchBharatpeTransactions,
  testBharatpeConnection,
  verifySingleDepositViaBharatpe,
} from './server/bharatpeVerifier.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

function getFirebaseProjectId(): string | null {
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectId?: string };
    const projectId = (raw.projectId || '').trim();
    if (!projectId || projectId === 'remixed-project-id') return null;
    return projectId;
  } catch {
    return null;
  }
}

function getFirebaseAdminVerifier() {
  const db = getDb();
  const configuredProjectId = (db.googleAuth?.projectId || '').trim();
  const projectId = configuredProjectId || getFirebaseProjectId();
  if (!projectId) {
    throw new Error('Google sign-in is not configured on the server');
  }
  const appName = `gauth-${projectId}`;
  const existing = getApps().find((a) => a.name === appName);
  const adminApp = existing || initializeApp({ projectId }, appName);
  return getFirebaseAdminAuth(adminApp);
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// ============================================================
// AUTH HELPERS
// ============================================================
function extractBearerToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function getRequestUser(req: express.Request): ServerUser | null {
  const token = extractBearerToken(req);
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const db = getDb();
  if (payload.role === 'user' && payload.userId) {
    return db.users.find((u) => u.id === payload.userId) || null;
  }
  return null;
}

function getRequestAdmin(req: express.Request): string | null {
  const token = extractBearerToken(req);
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== 'admin' || !payload.adminUsername) return null;
  return payload.adminUsername;
}

function requireUser(req: express.Request, res: express.Response): ServerUser | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  if (user.banned) {
    res.status(403).json({ error: 'Account is suspended' });
    return null;
  }
  return user;
}

function requireAdmin(req: express.Request, res: express.Response): string | null {
  const admin = getRequestAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Admin authentication required' });
    return null;
  }
  return admin;
}

function isAdminSetupRequired(): boolean {
  const db = getDb();
  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  return !envPass && !db.primaryAdmin;
}

function getPublicMaintenancePayload() {
  const db = getDb();
  return {
    enabled: Boolean(db.settings.maintenanceMode),
    title: db.settings.maintenanceTitle || 'Store Under Maintenance',
    message:
      db.settings.maintenanceMessage ||
      'AadityaTg.Store is currently undergoing maintenance. Please check back shortly.',
    eta: db.settings.maintenanceEta || '',
    support: db.settings.support || '',
    supportCh: db.settings.supportCh || '',
  };
}

function rejectIfMaintenance(req: express.Request, res: express.Response): boolean {
  const db = getDb();
  if (!db.settings.maintenanceMode) return false;
  if (getRequestAdmin(req)) return false;
  res.status(503).json({
    error: db.settings.maintenanceMessage || 'Store is currently under maintenance. Please try again later.',
    maintenance: true,
  });
  return true;
}

// ============================================================
// PUBLIC AUTH & ACCOUNT ENDPOINTS
// ============================================================
app.get('/api/bootstrap', (req, res) => {
  const user = getRequestUser(req);
  const adminUsername = getRequestAdmin(req);
  res.json({
    adminSetupRequired: isAdminSetupRequired(),
    maintenance: getPublicMaintenancePayload(),
    googleAuth: getPublicGoogleAuthConfig(),
    userState: user && !user.banned ? getPublicUserPayload(user) : null,
    adminState: adminUsername ? { adminUsername, data: getAdminPayload() } : null,
  });
});

app.get('/api/public/maintenance', (_req, res) => {
  res.json({ maintenance: getPublicMaintenancePayload() });
});

app.get('/api/public/auth-config', (_req, res) => {
  res.json({ googleAuth: getPublicGoogleAuthConfig() });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();
  const rawPass = String(password || '');

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }
  if (rawPass.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser: ServerUser = {
    id: Math.floor(100000 + Math.random() * 899999),
    name: cleanName || cleanEmail.split('@')[0],
    username: cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, ''),
    email: cleanEmail,
    passwordHash: hashPassword(rawPass),
    balance: 0,
    deposited: 0,
    joined: new Date().toISOString().slice(0, 10),
    banned: false,
    frozen: false,
  };

  db.users.unshift(newUser);
  saveDb();

  const token = signSessionToken({ role: 'user', userId: newUser.id });
  return res.status(201).json({ token, state: getPublicUserPayload(newUser) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = String(email || '').trim().toLowerCase();
  const rawPass = String(password || '');

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || !verifyPassword(rawPass, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.banned) {
    return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  }

  const token = signSessionToken({ role: 'user', userId: user.id });
  return res.json({ token, state: getPublicUserPayload(user) });
});

app.post('/api/auth/google', async (req, res) => {
  const googleCfg = getPublicGoogleAuthConfig();
  if (!googleCfg.enabled) {
    return res.status(403).json({
      error: 'Google sign-in is currently disabled by the store administrator.',
    });
  }

  const { idToken } = req.body as { idToken?: string };
  const rawToken = typeof idToken === 'string' ? idToken.trim() : '';
  if (!rawToken || rawToken.length < 20) {
    return res.status(400).json({ error: 'Valid Google ID token is required' });
  }

  try {
    const adminAuth = getFirebaseAdminVerifier();
    const decoded = await adminAuth.verifyIdToken(rawToken);
    const cleanEmail = String(decoded.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || decoded.email_verified !== true) {
      return res.status(401).json({ error: 'A verified Google email address is required' });
    }

    const db = getDb();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    let isNewUser = false;

    if (user) {
      if (user.banned) {
        return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
      }
      if (!user.name && decoded.name) {
        user.name = String(decoded.name).trim().slice(0, 80);
        saveDb();
      }
    } else {
      isNewUser = true;
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '') || 'user';
      let nextId = Math.floor(100000 + Math.random() * 899999);
      while (db.users.some((u) => u.id === nextId)) {
        nextId = Math.floor(100000 + Math.random() * 899999);
      }
      user = {
        id: nextId,
        name: String(decoded.name || baseUsername).trim().slice(0, 80) || baseUsername,
        username: baseUsername,
        email: cleanEmail,
        passwordHash: '',
        authProvider: 'google',
        balance: 0,
        deposited: 0,
        joined: new Date().toISOString().slice(0, 10),
        banned: false,
        frozen: false,
      };
      db.users.unshift(user);
      saveDb();
    }

    const token = signSessionToken({ role: 'user', userId: user.id });
    return res.status(isNewUser ? 201 : 200).json({
      token,
      isNewUser,
      state: getPublicUserPayload(user),
    });
  } catch {
    return res.status(401).json({
      error: 'Google sign-in could not be verified. Please try again or use email login.',
    });
  }
});

// User Profile Update (Name, Username, Gmail/Email)
app.put('/api/account/profile', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { name, username, email } = req.body as { name?: string; username?: string; email?: string };
  const cleanName = String(name || '').trim();
  const cleanUsername = String(username || '').trim().replace(/^@/, '');
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanName) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid Gmail / email address is required' });
  }

  const db = getDb();
  const duplicate = db.users.find((u) => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
  if (duplicate) {
    return res.status(409).json({ error: 'Another account is already using this email' });
  }

  user.name = cleanName;
  user.username = cleanUsername || user.username;
  user.email = cleanEmail;
  saveDb();

  return res.json({ user: sanitizeUser(user) });
});

// User Password Update (requires Old Password if already set + New Password + Confirm Password)
app.put('/api/account/password', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { oldPassword, newPassword, confirmPassword } = req.body as {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (user.passwordHash) {
    if (!oldPassword || !verifyPassword(String(oldPassword), user.passwordHash)) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirm password do not match' });
  }

  user.passwordHash = hashPassword(String(newPassword));
  saveDb();

  return res.json({ ok: true, user: sanitizeUser(user) });
});

// ============================================================
// STOREFRONT LIVE PROVIDER & ORDER ROUTES
// ============================================================
app.get('/api/store/state', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  res.json(getPublicUserPayload(user));
});

// Strict allowlist sanitizer: 0% provider / API details ever reach end users
function sanitizeUserServiceError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();
  if (/no_numbers|no_activation|no telegram accounts|out of stock|no longer available/i.test(lower)) {
    return 'Currently out of stock for this country. Please choose another country.';
  }
  if (/no_balance|insufficient|balance/i.test(lower)) {
    return 'Service temporarily unavailable. Please try again later or contact support.';
  }
  if (/login code.*not.*received|code not received|no.*code.*found|sms.*not.*received/i.test(lower)) {
    return 'Login code not received yet. Request the code in Telegram, then try again.';
  }
  if (/early_cancel|wait.*minute|2 minute|cooldown|too early/i.test(lower)) {
    return 'Please wait a moment before cancelling this order.';
  }
  if (/already_finish|already_cancel|already completed/i.test(lower)) {
    return 'This order has already been completed or cancelled.';
  }
  if (/session string.*not available|session.*unavailable/i.test(lower)) {
    return 'Session string is not available for this account. Use Get Login Code to sign in via OTP.';
  }
  return fallback;
}

// Atomic concurrency locks to prevent double-spend, double-refund, and double-UTR credit
const inFlightUserBuys = new Set<number>();
const inFlightOrderLocks = new Set<string>();
const inFlightDepositLocks = new Set<number>();
const inFlightUtrLocks = new Set<string>();

// Active order lock applies ONLY to TG, WhatsApp, and AppOTP (NOT Digital or SMM)
const ACTIVE_LOCKED_ORDER_KINDS = new Set<ServerOrder['kind']>(['TG', 'WhatsApp', 'AppOTP']);

function findActiveLockedOrder(userId: number): ServerOrder | undefined {
  const db = getDb();
  return db.orders.find(
    (o) =>
      o.userId === userId &&
      ACTIVE_LOCKED_ORDER_KINDS.has(o.kind) &&
      (o.status === 'WAIT_CODE' || o.status === 'WAIT_RETRY'),
  );
}

function refundOrderOnce(order: ServerOrder, user: ServerUser | undefined): boolean {
  if (order.refunded || order.status === 'CANCELLED' || order.status === 'DONE') {
    return false;
  }
  order.refunded = true;
  order.status = 'CANCELLED';
  if (user && Number.isFinite(order.price) && order.price > 0) {
    user.balance = Number((user.balance + order.price).toFixed(2));
  }
  saveDb();
  return true;
}

function creditDepositOnce(
  dep: ServerDeposit,
  verifiedBy: 'imap' | 'bharatpe' | 'admin',
  opts?: {
    matchedEmailUid?: number;
    matchedBharatpeTxId?: string;
    extraUtrs?: string[];
  },
): boolean {
  const db = getDb();
  if (dep.status !== 'pending' || dep.isRedeem) return false;

  const canonUtr = normalizeUtr(dep.utr);
  if (!canonUtr) return false;

  if (!Array.isArray(db.usedUtrs)) db.usedUtrs = [];
  if (!Array.isArray(db.usedEmailUids)) db.usedEmailUids = [];
  if (!Array.isArray(db.usedInvoiceIds)) db.usedInvoiceIds = [];
  if (!Array.isArray(db.usedBharatpeTxIds)) db.usedBharatpeTxIds = [];

  if (db.usedUtrs.includes(canonUtr)) {
    return false;
  }
  if (typeof opts?.matchedEmailUid === 'number' && db.usedEmailUids.includes(opts.matchedEmailUid)) {
    return false;
  }
  const normBpTx = opts?.matchedBharatpeTxId ? normalizeUtr(opts.matchedBharatpeTxId) : '';
  if (normBpTx && db.usedBharatpeTxIds.includes(normBpTx)) {
    return false;
  }
  const normInv = dep.invoiceId ? normalizeUtr(dep.invoiceId) : '';
  if (normInv && db.usedInvoiceIds.includes(normInv)) {
    return false;
  }

  dep.status = 'success';
  dep.verifiedBy = verifiedBy;
  if (typeof opts?.matchedEmailUid === 'number') {
    dep.matchedEmailUid = opts.matchedEmailUid;
    db.usedEmailUids.push(opts.matchedEmailUid);
  }
  if (normBpTx) {
    dep.matchedBharatpeTxId = normBpTx;
    db.usedBharatpeTxIds.push(normBpTx);
  }
  if (normInv) {
    db.usedInvoiceIds.push(normInv);
  }
  db.usedUtrs.push(canonUtr);
  if (Array.isArray(opts?.extraUtrs)) {
    for (const rawId of opts.extraUtrs) {
      const normExtra = normalizeUtr(rawId);
      if (normExtra.length >= 6 && !db.usedUtrs.includes(normExtra)) {
        db.usedUtrs.push(normExtra);
      }
    }
  }

  const u = db.users.find((x) => x.id === dep.userId);
  if (u && Number.isFinite(dep.amount) && dep.amount > 0) {
    u.balance = Number((u.balance + dep.amount).toFixed(2));
    u.deposited = Number((u.deposited + dep.amount).toFixed(2));
  }
  saveDb();
  return true;
}

function sanitizeScreenshotDataUrl(val: unknown): { ok: true; value?: string } | { ok: false; error: string } {
  if (val === undefined || val === null || val === '') return { ok: true, value: undefined };
  if (typeof val !== 'string') {
    return { ok: false, error: 'Invalid payment screenshot format' };
  }
  const s = val.trim();
  if (!s) return { ok: true, value: undefined };
  if (s.length > 750_000) {
    return { ok: false, error: 'Payment screenshot is too large. Please choose a smaller image.' };
  }
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s)) {
    return { ok: false, error: 'Payment screenshot must be a valid PNG, JPG, or WebP image' };
  }
  return { ok: true, value: s };
}

app.get('/api/providers/apps', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const srv = db.servers.find((s) => s.no === 3);
  const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
  const apiKey = srv?.key || s2Key;

  if (!srv || !srv.url || !apiKey) {
    return res.json({ apps: [], configured: false });
  }

  try {
    const apps = await fetchTigerServices(srv.url, apiKey, srv.margin, db.settings.usdtRate);
    return res.json({ apps, configured: true });
  } catch (err) {
    return res.status(502).json({
      error: sanitizeUserServiceError(err, 'Unable to load available apps right now. Please try again.'),
      apps: [],
      configured: true,
    });
  }
});

function parseTgFilters(raw: Record<string, unknown>): TgAccountFilters {
  const catRaw = String(raw.category || '').toLowerCase();
  const spamRaw = String(raw.spam || 'any').toLowerCase();
  const originRaw = String(raw.origin || 'any').toLowerCase();
  const premiumRaw = String(raw.premium || 'any').toLowerCase();
  const emailRaw = String(raw.email || 'any').toLowerCase();
  const sortRaw = String(raw.sort || 'low').toLowerCase();

  const category: TgAccountFilters['category'] =
    catRaw === 'all' || catRaw === 'pushing' || catRaw === 'premium' || catRaw === 'autoreg'
      ? catRaw
      : null;
  const spam: TgAccountFilters['spam'] =
    spamRaw === 'free' || spamRaw === 'blocked' || spamRaw === 'temp' ? spamRaw : 'any';
  const origin: TgAccountFilters['origin'] =
    originRaw === 'pushing' ||
    originRaw === 'autoreg' ||
    originRaw === 'resale' ||
    originRaw === 'stealer' ||
    originRaw === 'brute' ||
    originRaw === 'personal' ||
    originRaw === 'self_registration' ||
    originRaw === 'mixed' ||
    originRaw === 'fresh'
      ? originRaw
      : 'any';
  const premium: TgAccountFilters['premium'] =
    premiumRaw === 'premium' || premiumRaw === 'non_premium' ? premiumRaw : 'any';
  const email: TgAccountFilters['email'] = emailRaw === 'required' ? 'required' : 'any';
  const sort: TgAccountFilters['sort'] = sortRaw === 'high' ? 'high' : 'low';

  return { category, spam, origin, premium, email, sort };
}

function matchesManualStockFilters(
  st: { cat: string; origin?: 'pushing' | 'autoreg' | 'resale'; isPremium?: boolean; spamBlocked?: boolean },
  filters: TgAccountFilters,
): boolean {
  const catLower = (st.cat || '').toLowerCase();
  const inferredOrigin: 'pushing' | 'autoreg' | 'resale' =
    st.origin ||
    (catLower.includes('autoreg') ? 'autoreg' : catLower.includes('resale') ? 'resale' : 'pushing');
  const inferredPremium = typeof st.isPremium === 'boolean' ? st.isPremium : catLower.includes('premium');
  const inferredSpamBlocked = typeof st.spamBlocked === 'boolean' ? st.spamBlocked : catLower.includes('spam');

  if (filters.category === 'pushing' && inferredOrigin !== 'pushing') return false;
  if (filters.category === 'autoreg' && inferredOrigin !== 'autoreg') return false;
  if (filters.category === 'premium' && !inferredPremium) return false;

  if (filters.origin && filters.origin !== 'any' && inferredOrigin !== filters.origin) {
    return false;
  }
  if (filters.premium === 'premium' && !inferredPremium) return false;
  if (filters.premium === 'non_premium' && inferredPremium) return false;
  if (filters.spam === 'free' && inferredSpamBlocked) return false;
  if ((filters.spam === 'blocked' || filters.spam === 'temp') && !inferredSpamBlocked) return false;
  return true;
}

app.get('/api/providers/countries', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const serverNo = Number(req.query.server) as 1 | 2 | 3;
  const appCode = String(req.query.service || (serverNo === 2 ? 'wa' : 'tg')).trim() || 'tg';
  const filters = parseTgFilters(req.query as Record<string, unknown>);
  const db = getDb();
  const srv = db.servers.find((s) => s.no === serverNo);
  if (!srv) return res.status(400).json({ error: 'Invalid server' });

  const items: ProviderCountryItem[] = [];

  // Include manual stock items for Server 1
  if (serverNo === 1) {
    const manualByCountry = new Map<string, { price: number; count: number }>();
    for (const st of db.stock) {
      if (!st.available) continue;
      if (!matchesManualStockFilters(st, filters)) continue;
      const cur = manualByCountry.get(st.country);
      if (!cur) manualByCountry.set(st.country, { price: st.price, count: 1 });
      else {
        cur.count += 1;
        if (st.price < cur.price) cur.price = st.price;
      }
    }
    for (const [countryName, info] of manualByCountry.entries()) {
      const meta = resolveCountryMeta({ name: countryName });
      items.push({
        code: countryName,
        iso: meta.iso || undefined,
        name: meta.name || countryName,
        flag: meta.flag,
        price: info.price,
        stock: info.count,
        source: 'manual',
      });
    }
  }

  const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
  const apiKey = srv.key || (serverNo === 3 ? s2Key : '');

  if (srv.url && apiKey) {
    try {
      if (serverNo === 1) {
        const apiItems = await fetchLolzteamCountries(srv.url, apiKey, srv.margin, db.settings.usdtRate, filters);
        items.push(...apiItems);
      } else {
        const apiItems = await fetchTigerCountries(srv.url, apiKey, appCode, srv.margin, db.settings.usdtRate);
        items.push(...apiItems);
      }
    } catch (err) {
      if (items.length === 0) {
        return res.status(502).json({
          error: sanitizeUserServiceError(err, 'Unable to load available countries right now. Please try again.'),
          countries: [],
        });
      }
    }
  }

  let finalCountries = items;
  if (serverNo === 1 && items.length > 1) {
    const merged = new Map<string, ProviderCountryItem>();
    for (const c of items) {
      const key = (c.iso || c.name || c.code).toUpperCase();
      const prev = merged.get(key);
      if (!prev) {
        merged.set(key, { ...c });
      } else {
        prev.stock += c.stock;
        if (c.price > 0 && c.price < prev.price) prev.price = c.price;
        if (!prev.iso && c.iso) prev.iso = c.iso;
        if (c.source === 'api') prev.source = 'api';
      }
    }
    finalCountries = Array.from(merged.values()).sort((a, b) =>
      filters.sort === 'high' ? b.price - a.price : a.price - b.price,
    );
  } else if (serverNo === 1) {
    finalCountries.sort((a, b) => (filters.sort === 'high' ? b.price - a.price : a.price - b.price));
  }

  return res.json({
    countries: finalCountries,
    configured: Boolean((srv.url && apiKey) || finalCountries.length > 0),
  });
});

app.get('/api/providers/world-countries', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return res.json({ countries: getAllWorldCountries() });
});

app.get('/api/providers/tg-accounts', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const rawCountry = String(req.query.country || '').trim();
  const countryIso = String(req.query.iso || '').trim();
  const hasCountryFilter = Boolean(
    (rawCountry && rawCountry.toUpperCase() !== 'ALL') || countryIso,
  );
  const pageRaw = Number(req.query.page);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const pminRaw = Number(req.query.pmin);
  const pmin = Number.isFinite(pminRaw) && pminRaw > 0 ? pminRaw : undefined;
  const pmaxRaw = Number(req.query.pmax);
  const pmax = Number.isFinite(pmaxRaw) && pmaxRaw > 0 ? pmaxRaw : undefined;

  const filters = parseTgFilters(req.query as Record<string, unknown>);
  const db = getDb();
  const srv = db.servers.find((s) => s.no === 1);
  if (!srv) return res.status(400).json({ error: 'Service unavailable', accounts: [] });

  const targetMeta = hasCountryFilter
    ? resolveCountryMeta({ code: countryIso || rawCountry, name: rawCountry })
    : null;
  const targetKey = targetMeta ? (targetMeta.iso || targetMeta.code || rawCountry).toUpperCase() : '';

  const manualAccounts: ProviderTgAccount[] = [];
  const includeManual = page === 1 && !pmin && !pmax;

  if (includeManual) {
    for (const st of db.stock) {
      if (!st.available) continue;
      if (!matchesManualStockFilters(st, filters)) continue;
      const stMeta = resolveCountryMeta({ name: st.country });
      const stKey = (stMeta.iso || stMeta.code || st.country).toUpperCase();
      if (
        hasCountryFilter &&
        stKey !== targetKey &&
        st.country.toLowerCase() !== rawCountry.toLowerCase()
      ) {
        continue;
      }

      const catLower = (st.cat || '').toLowerCase();
      const inferredOrigin =
        st.origin ||
        (catLower.includes('autoreg') ? 'autoreg' : catLower.includes('resale') ? 'resale' : 'pushing');
      const originLabel =
        inferredOrigin === 'autoreg' ? 'Autoreg' : inferredOrigin === 'resale' ? 'Resale' : 'Pushing';
      const isPremium = typeof st.isPremium === 'boolean' ? st.isPremium : catLower.includes('premium');
      const spamBlocked = typeof st.spamBlocked === 'boolean' ? st.spamBlocked : catLower.includes('spam');

      manualAccounts.push({
        id: st.id,
        source: 'manual',
        title: 'Telegram Account',
        countryCode: st.country,
        countryIso: stMeta.iso || undefined,
        countryName: stMeta.name,
        flag: stMeta.flag,
        price: st.price,
        origin: originLabel,
        spamStatus: spamBlocked ? 'Spam Blocked' : 'Spam Free',
        spamBlocked,
        isPremium,
        premiumEndsAt: null,
        twofa: st.twofa || 'None',
        year: st.year,
        categoryLabel: st.cat,
      });
    }
  }

  let apiAccounts: ProviderTgAccount[] = [];
  let apiTotalItems: number | null = null;
  let apiPerPage = 40;
  let hasNextPage = false;
  let nextPage: number | null = null;
  let nextPmin: number | undefined;
  let nextPmax: number | undefined;

  if (srv.url && srv.key) {
    try {
      const apiRes = await fetchLolzteamAccountsPage(
        srv.url,
        srv.key,
        srv.margin,
        db.settings.usdtRate,
        {
          countryCode: hasCountryFilter ? rawCountry || countryIso : undefined,
          countryIsoHint: hasCountryFilter ? countryIso || undefined : undefined,
          filters,
          page,
          pmin,
          pmax,
        },
      );
      apiAccounts = apiRes.accounts;
      apiTotalItems = apiRes.totalItems;
      apiPerPage = apiRes.perPage;
      hasNextPage = apiRes.hasNextPage;
      nextPage = apiRes.nextPage;
      nextPmin = apiRes.nextPmin;
      nextPmax = apiRes.nextPmax;
    } catch (err) {
      if (manualAccounts.length === 0) {
        return res.status(502).json({
          error: sanitizeUserServiceError(err, 'Unable to load available accounts right now. Please try again.'),
          accounts: [],
          totalItems: null,
          page,
          perPage: apiPerPage,
          hasNextPage: false,
          nextPage: null,
          configured: true,
        });
      }
    }
  }

  const combined = manualAccounts.length > 0 ? [...manualAccounts, ...apiAccounts] : apiAccounts;
  if (manualAccounts.length > 0) {
    combined.sort((a, b) => (filters.sort === 'high' ? b.price - a.price : a.price - b.price));
  }

  const totalItems =
    apiTotalItems !== null
      ? apiTotalItems + manualAccounts.length
      : !srv.url || !srv.key
        ? manualAccounts.length
        : null;

  return res.json({
    accounts: combined,
    totalItems,
    page,
    perPage: apiPerPage,
    hasNextPage,
    nextPage,
    nextPmin,
    nextPmax,
    configured: Boolean((srv.url && srv.key) || combined.length > 0),
  });
});

app.post('/api/orders/buy', async (req, res) => {
  if (rejectIfMaintenance(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;
  if (user.frozen) return res.status(403).json({ error: 'Your wallet is currently frozen' });

  if (inFlightUserBuys.has(user.id)) {
    return res.status(409).json({ error: 'Another order is already being processed. Please wait a moment.' });
  }

  // Single active order lock for TG, WhatsApp, and AppOTP orders
  const activeOrder = findActiveLockedOrder(user.id);
  if (activeOrder) {
    return res.status(409).json({
      error: `You already have an active ${activeOrder.kind} order (${activeOrder.id}). Please receive OTP or cancel it before placing a new order.`,
      activeOrderId: activeOrder.id,
    });
  }

  const {
    server,
    countryCode,
    countryName,
    price,
    source,
    serviceCode,
    filters: rawFilters,
    itemId,
    stockId,
  } = req.body as {
    server: 1 | 2 | 3;
    countryCode: string;
    countryName: string;
    price: number;
    source?: 'api' | 'manual';
    serviceCode?: string;
    filters?: TgAccountFilters;
    itemId?: string;
    stockId?: string;
  };

  const filters = parseTgFilters((rawFilters || {}) as Record<string, unknown>);
  const orderPrice = Number(price);
  if (!Number.isFinite(orderPrice) || orderPrice <= 0) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  if (user.balance < orderPrice) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  inFlightUserBuys.add(user.id);
  try {
    const db = getDb();

    // Manual stock purchase for Server 1
    if (server === 1 && source === 'manual') {
      const stockItem = stockId
        ? db.stock.find((s) => s.id === stockId && s.available)
        : db.stock.find(
            (s) =>
              s.available &&
              s.country.toLowerCase() === String(countryName).toLowerCase() &&
              matchesManualStockFilters(s, filters),
          );
      if (!stockItem) {
        return res.status(409).json({ error: 'Selected account is no longer available' });
      }
      if (user.balance < stockItem.price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      stockItem.available = false;
      user.balance = Number((user.balance - stockItem.price).toFixed(2));
      const catLower = (stockItem.cat || '').toLowerCase();
      const originLabel =
        stockItem.origin === 'autoreg' || catLower.includes('autoreg')
          ? 'Autoreg'
          : stockItem.origin === 'resale' || catLower.includes('resale')
            ? 'Resale'
            : 'Pushing';
      const isPrem =
        typeof stockItem.isPremium === 'boolean' ? stockItem.isPremium : catLower.includes('premium');
      const isSpamBlocked =
        typeof stockItem.spamBlocked === 'boolean' ? stockItem.spamBlocked : catLower.includes('spam');
      const order: ServerOrder = {
        id: `T-${Date.now().toString(36).slice(-5).toUpperCase()}`,
        userId: user.id,
        kind: 'TG',
        country: stockItem.country,
        phone: stockItem.phone,
        price: stockItem.price,
        status: 'DONE',
        code: stockItem.twofa !== 'None' ? `2FA: ${stockItem.twofa}` : 'Ready',
        credentials: `Origin: ${originLabel} · ${isSpamBlocked ? 'Spam Blocked' : 'Spam Free'} · Premium: ${isPrem ? 'Yes' : 'No'} · Year: ${stockItem.year} · 2FA: ${stockItem.twofa}`,
        provider: 'manual',
        date: nowTimestamp(),
      };
      db.orders.unshift(order);
      saveDb();
      return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
    }

    const srv = db.servers.find((s) => s.no === server);
    const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
    const apiKey = srv?.key || (server === 3 ? s2Key : '');
    if (!srv || !srv.url || !apiKey) {
      return res.status(400).json({ error: 'This service is currently unavailable. Please try again later.' });
    }

    // Reserve balance BEFORE calling external provider to prevent concurrent double-spend
    user.balance = Number((user.balance - orderPrice).toFixed(2));
    saveDb();

    try {
      if (server === 1) {
        const purchased = await buyLolzteamTelegram(srv.url, apiKey, countryCode, filters, itemId);
        const order: ServerOrder = {
          id: `T-${Date.now().toString(36).slice(-5).toUpperCase()}`,
          userId: user.id,
          kind: 'TG',
          country: countryName,
          phone: purchased.phone,
          price: orderPrice,
          status: 'DONE',
          credentials: purchased.credentials,
          provider: 'lolzteam',
          providerOrderId: purchased.itemId,
          date: nowTimestamp(),
        };
        db.orders.unshift(order);
        saveDb();
        return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
      } else {
        const svc = serviceCode || (server === 2 ? 'wa' : 'tg');
        const issued = await buyTigerNumber(srv.url, apiKey, svc, countryCode);
        const order: ServerOrder = {
          id: `${server === 2 ? 'W' : 'A'}-${Date.now().toString(36).slice(-5).toUpperCase()}`,
          userId: user.id,
          kind: server === 2 ? 'WhatsApp' : 'AppOTP',
          country: countryName,
          phone: issued.phone,
          price: orderPrice,
          status: 'WAIT_CODE',
          provider: 'tiger',
          activationId: issued.activationId,
          date: nowTimestamp(),
        };
        db.orders.unshift(order);
        saveDb();
        return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
      }
    } catch (err) {
      // Cleanly restore reserved balance on provider failure
      user.balance = Number((user.balance + orderPrice).toFixed(2));
      saveDb();
      return res.status(502).json({
        error: sanitizeUserServiceError(err, 'Unable to complete order right now. Please try again.'),
      });
    }
  } finally {
    inFlightUserBuys.delete(user.id);
  }
});

app.post('/api/orders/:id/check-otp', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if ((order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY') || !order.activationId) {
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  }

  if (inFlightOrderLocks.has(order.id)) {
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  }

  const serverNo = order.kind === 'WhatsApp' ? 2 : 3;
  const srv = db.servers.find((s) => s.no === serverNo);
  const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
  const apiKey = srv?.key || (serverNo === 3 ? s2Key : '');
  if (!srv?.url || !apiKey) {
    return res.status(400).json({ error: 'Service temporarily unavailable. Please contact support.' });
  }

  inFlightOrderLocks.add(order.id);
  try {
    if (order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY') {
      return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
    }
    const result = await checkTigerOtp(srv.url, apiKey, order.activationId);
    if (result.code && (result.status === 'DONE' || result.status === 'WAIT_RETRY')) {
      // Auto-complete immediately when OTP is received so user can place their next order
      order.status = 'DONE';
      order.code = result.code;
      saveDb();
    } else if (result.status === 'WAIT_RETRY') {
      order.status = 'WAIT_RETRY';
      saveDb();
    } else if (result.status === 'CANCELLED') {
      refundOrderOnce(order, user);
    }
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  } catch (err) {
    return res.status(502).json({
      error: sanitizeUserServiceError(err, 'Unable to check OTP right now. Please try again.'),
    });
  } finally {
    inFlightOrderLocks.delete(order.id);
  }
});

app.post('/api/orders/:id/retry-otp', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if ((order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY') || !order.activationId) {
    return res.status(400).json({ error: 'Retry SMS is not available for this order.' });
  }
  if (inFlightOrderLocks.has(order.id)) {
    return res.status(409).json({ error: 'Order is currently updating. Please wait a second.' });
  }

  const serverNo = order.kind === 'WhatsApp' ? 2 : 3;
  const srv = db.servers.find((s) => s.no === serverNo);
  const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
  const apiKey = srv?.key || (serverNo === 3 ? s2Key : '');
  if (!srv?.url || !apiKey) {
    return res.status(400).json({ error: 'Service temporarily unavailable. Please contact support.' });
  }

  inFlightOrderLocks.add(order.id);
  try {
    await retryTigerOtp(srv.url, apiKey, order.activationId);
    order.status = 'WAIT_CODE';
    order.code = undefined;
    saveDb();
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  } catch (err) {
    return res.status(502).json({
      error: sanitizeUserServiceError(err, 'Unable to request another SMS right now.'),
    });
  } finally {
    inFlightOrderLocks.delete(order.id);
  }
});

app.post('/api/orders/:id/cancel', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY') {
    return res.status(400).json({ error: 'Only pending OTP orders can be cancelled' });
  }
  if (inFlightOrderLocks.has(order.id)) {
    return res.status(409).json({ error: 'Cancellation is already in progress. Please wait.' });
  }

  inFlightOrderLocks.add(order.id);
  try {
    if (order.status !== 'WAIT_CODE' && order.status !== 'WAIT_RETRY') {
      return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
    }

    if (order.activationId) {
      const serverNo = order.kind === 'WhatsApp' ? 2 : 3;
      const srv = db.servers.find((s) => s.no === serverNo);
      const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
      const apiKey = srv?.key || (serverNo === 3 ? s2Key : '');
      if (srv?.url && apiKey) {
        try {
          const result = await cancelTigerOtp(srv.url, apiKey, order.activationId);
          if (result.outcome === 'DONE' && result.code) {
            order.status = 'DONE';
            order.code = result.code;
            saveDb();
            return res.json({
              order: sanitizeOrderForUser(order),
              state: getPublicUserPayload(user),
              alreadyReceived: true,
            });
          }
        } catch (err) {
          return res.status(400).json({
            error: sanitizeUserServiceError(
              err,
              'Cancellation could not be confirmed yet. Please wait a moment and try again.',
            ),
          });
        }
      }
    }

    // Atomic single-refund guard prevents duplicate balance credits
    refundOrderOnce(order, user);
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  } finally {
    inFlightOrderLocks.delete(order.id);
  }
});

app.post('/api/orders/:id/tg-code', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order || order.kind !== 'TG' || order.provider !== 'lolzteam' || !order.providerOrderId) {
    return res.status(404).json({ error: 'Login code lookup is not available for this order.' });
  }

  const srv = db.servers.find((s) => s.no === 1);
  if (!srv?.url || !srv.key) {
    return res.status(400).json({ error: 'Service temporarily unavailable. Please contact support.' });
  }

  try {
    const { code } = await fetchLolzteamLoginCode(srv.url, srv.key, order.providerOrderId);
    order.code = code;
    order.status = 'DONE';
    saveDb();
    return res.json({ code, order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  } catch (err) {
    return res.status(400).json({
      error: sanitizeUserServiceError(
        err,
        'Login code not received yet. Request the code in Telegram, then try again.',
      ),
    });
  }
});

app.post('/api/orders/:id/tg-session', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order || order.kind !== 'TG' || order.provider !== 'lolzteam' || !order.providerOrderId) {
    return res.status(404).json({ error: 'Session string is not available for this order.' });
  }

  const srv = db.servers.find((s) => s.no === 1);
  if (!srv?.url || !srv.key) {
    return res.status(400).json({ error: 'Service temporarily unavailable. Please contact support.' });
  }

  try {
    const result = await fetchLolzteamSessionString(srv.url, srv.key, order.providerOrderId);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      error: sanitizeUserServiceError(
        err,
        'Session string is not available for this account. Use Get Login Code to sign in via OTP.',
      ),
    });
  }
});

app.post('/api/orders/:id/tg-reset-sessions', async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === user.id);
  if (!order || order.kind !== 'TG' || order.provider !== 'lolzteam' || !order.providerOrderId) {
    return res.status(404).json({ error: 'Session reset is not available for this order.' });
  }

  const srv = db.servers.find((s) => s.no === 1);
  if (!srv?.url || !srv.key) {
    return res.status(400).json({ error: 'Service temporarily unavailable. Please contact support.' });
  }

  try {
    await resetLolzteamAuthorizations(srv.url, srv.key, order.providerOrderId);
    order.otherSessionsTerminated = true;
    saveDb();
    return res.json({
      ok: true,
      order: sanitizeOrderForUser(order),
      state: getPublicUserPayload(user),
    });
  } catch (err) {
    return res.status(400).json({
      error: sanitizeUserServiceError(
        err,
        'Could not terminate other sessions right now. You can reset sessions inside Telegram Settings.',
      ),
    });
  }
});

app.post('/api/orders/digital', (req, res) => {
  if (rejectIfMaintenance(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;
  if (user.frozen) return res.status(403).json({ error: 'Your wallet is currently frozen' });

  const productId = Number((req.body as { productId?: number }).productId);
  const db = getDb();
  const product = db.digital.find((p) => p.id === productId && p.active);
  if (!product) return res.status(404).json({ error: 'Product unavailable' });
  if (user.balance < product.price) return res.status(400).json({ error: 'Insufficient wallet balance' });

  user.balance = Number((user.balance - product.price).toFixed(2));
  const order: ServerOrder = {
    id: `DIG-${Date.now().toString(36).slice(-5).toUpperCase()}`,
    userId: user.id,
    kind: 'Digital',
    name: product.name,
    phone: 'Delivered to account & email',
    price: product.price,
    status: 'DELIVERED',
    date: nowTimestamp(),
  };
  db.orders.unshift(order);
  saveDb();
  return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
});

app.post('/api/orders/smm', async (req, res) => {
  if (rejectIfMaintenance(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;
  if (user.frozen) return res.status(403).json({ error: 'Your wallet is currently frozen' });
  if (inFlightUserBuys.has(user.id)) {
    return res.status(409).json({ error: 'Another order is already being processed. Please wait a moment.' });
  }

  const { serviceId, link, quantity } = req.body as { serviceId?: number; link?: string; quantity?: number };
  const cleanLink = String(link || '').trim();
  const qty = Number(quantity);

  const db = getDb();
  const svc = db.smm.services.find((s) => s.id === Number(serviceId));
  if (!svc) return res.status(404).json({ error: 'SMM service not found' });
  if (!cleanLink) return res.status(400).json({ error: 'Target link or username is required' });
  if (!qty || qty < svc.min || qty > svc.max) {
    return res.status(400).json({ error: `Quantity must be between ${svc.min} and ${svc.max}` });
  }

  const total = Number(((qty / 1000) * svc.rate).toFixed(2));
  if (user.balance < total) return res.status(400).json({ error: 'Insufficient wallet balance' });

  if (!db.smm.url || !db.smm.key) {
    return res.status(400).json({ error: 'This service is temporarily unavailable. Please contact support.' });
  }

  inFlightUserBuys.add(user.id);
  user.balance = Number((user.balance - total).toFixed(2));
  saveDb();

  try {
    const placed = await placeSmmPanelOrder(db.smm.url, db.smm.key, svc.id, cleanLink, qty);
    const order: ServerOrder = {
      id: `SMM-${Date.now().toString(36).slice(-5).toUpperCase()}`,
      userId: user.id,
      kind: 'SMM',
      name: `${svc.name} (×${qty})`,
      phone: cleanLink,
      target: cleanLink,
      quantity: qty,
      price: total,
      status: 'DONE',
      provider: 'smm',
      providerOrderId: placed.orderId,
      date: nowTimestamp(),
    };
    db.orders.unshift(order);
    saveDb();
    return res.json({ order: sanitizeOrderForUser(order), state: getPublicUserPayload(user) });
  } catch (err) {
    user.balance = Number((user.balance + total).toFixed(2));
    saveDb();
    return res.status(502).json({
      error: sanitizeUserServiceError(err, 'Unable to place order right now. Please try again later.'),
    });
  } finally {
    inFlightUserBuys.delete(user.id);
  }
});

app.post('/api/deposits', async (req, res) => {
  if (rejectIfMaintenance(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  const { method, amount, utr, screenshot, invoiceId } = req.body as {
    method?: string;
    amount?: number;
    utr?: string;
    screenshot?: string;
    invoiceId?: string;
  };
  const numAmount = Number(amount);
  const cleanUtr = String(utr || '').trim();
  const canonUtr = normalizeUtr(cleanUtr);
  const cleanMethod = String(method || 'UPI Manual').trim();

  const db = getDb();
  const p = db.payments;
  const methodLower = cleanMethod.toLowerCase();
  const methodCfg = methodLower.includes('fampay')
    ? { key: 'fampay' as const, label: 'Fampay UPI', enabled: Boolean(p.fampayEnabled), min: Number(p.fampayMin) || 10, max: Number(p.fampayMax) || 50000 }
    : methodLower.includes('bharatpe')
      ? { key: 'bharatpe' as const, label: 'BharatPe UPI', enabled: Boolean(p.bharatpeEnabled), min: Number(p.bharatpeMin) || 10, max: Number(p.bharatpeMax) || 50000 }
      : methodLower.includes('usdt')
        ? { key: 'usdt' as const, label: 'USDT (TRC20)', enabled: Boolean(p.usdtEnabled), min: Number(p.usdtMin) || 100, max: Number(p.usdtMax) || 500000 }
        : { key: 'manual' as const, label: 'UPI Manual', enabled: Boolean(p.manualEnabled), min: Number(p.manualMin) || 10, max: Number(p.manualMax) || 50000 };

  if (!methodCfg.enabled) {
    return res.status(400).json({ error: `${methodCfg.label} is currently disabled` });
  }
  if (!Number.isFinite(numAmount) || numAmount < methodCfg.min) {
    return res.status(400).json({
      error: `Minimum deposit for ${methodCfg.label} is ₹${methodCfg.min.toLocaleString('en-IN')}`,
    });
  }
  if (numAmount > methodCfg.max) {
    return res.status(400).json({
      error: `Maximum deposit for ${methodCfg.label} is ₹${methodCfg.max.toLocaleString('en-IN')}`,
    });
  }
  if (!cleanUtr || canonUtr.length < 6) {
    return res.status(400).json({ error: 'Valid UTR / Payment ID (min 6 chars) is required' });
  }

  let cleanInvoiceId = '';
  if (methodCfg.key === 'fampay' && typeof invoiceId === 'string' && invoiceId.trim()) {
    const normalizedInv = invoiceId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
    if (normalizedInv.length >= 6) {
      cleanInvoiceId = normalizedInv;
    }
  }

  const shotCheck = sanitizeScreenshotDataUrl(screenshot);
  if (!shotCheck.ok) {
    return res.status(400).json({ error: shotCheck.error });
  }

  if (inFlightUtrLocks.has(canonUtr)) {
    return res.status(409).json({ error: 'This UTR / Payment ID is already being processed' });
  }

  const usedAlready = Array.isArray(db.usedUtrs) && db.usedUtrs.includes(canonUtr);
  const duplicate = db.deposits.find(
    (d) => !d.isRedeem && d.status !== 'rejected' && normalizeUtr(d.utr) === canonUtr,
  );
  if (usedAlready || duplicate) {
    return res.status(409).json({ error: 'This UTR / Payment ID has already been used or submitted' });
  }

  if (cleanInvoiceId) {
    const normInv = normalizeUtr(cleanInvoiceId);
    const invUsed =
      (Array.isArray(db.usedInvoiceIds) && db.usedInvoiceIds.includes(normInv)) ||
      db.deposits.some(
        (d) => !d.isRedeem && d.status !== 'rejected' && d.invoiceId && normalizeUtr(d.invoiceId) === normInv,
      );
    if (invUsed) {
      return res.status(409).json({ error: 'This FamPay Invoice ID has already been used. Please generate a new one.' });
    }
  }

  const nextId = db.deposits.reduce((m, d) => Math.max(m, d.id), 0) + 1;
  const deposit: ServerDeposit = {
    id: nextId,
    userId: user.id,
    amount: numAmount,
    method: methodCfg.label,
    utr: cleanUtr,
    ...(cleanInvoiceId ? { invoiceId: cleanInvoiceId } : {}),
    status: 'pending',
    date: nowTimestamp(),
    ...(shotCheck.value ? { screenshot: shotCheck.value } : {}),
  };
  db.deposits.unshift(deposit);
  saveDb();

  let autoVerified = false;
  const isFampayAutoReady =
    methodCfg.key === 'fampay' &&
    Boolean(db.imap.enabled && db.imap.email && db.imap.appPassword);
  const isBharatpeAutoReady =
    methodCfg.key === 'bharatpe' &&
    Boolean(db.payments.bharatpeAutoVerify && db.payments.bharatpeMid.trim() && db.payments.bharatpeToken.trim());

  // STRICT ROUTING:
  // - Fampay UPI -> Gmail IMAP auto-verify ONLY
  // - BharatPe UPI -> BharatPe Merchant API auto-verify ONLY
  // - UPI Manual & USDT -> 100% Admin manual review ONLY (NEVER auto-verified)
  if (isFampayAutoReady && db.imap.autoApproveOnSubmit) {
    inFlightDepositLocks.add(deposit.id);
    inFlightUtrLocks.add(canonUtr);
    try {
      const excludeUids = new Set<number>(Array.isArray(db.usedEmailUids) ? db.usedEmailUids : []);
      const check = await verifySingleDepositViaImap(
        db.imap,
        cleanUtr,
        numAmount,
        excludeUids,
        deposit.invoiceId,
      );
      if (check.matched && deposit.status === 'pending') {
        autoVerified = creditDepositOnce(deposit, 'imap', {
          matchedEmailUid: check.matchedUid,
          extraUtrs: check.extractedIds,
        });
      }
    } catch {
      // Leave pending for repeated background polling or admin review
    } finally {
      inFlightDepositLocks.delete(deposit.id);
      inFlightUtrLocks.delete(canonUtr);
    }
  } else if (isBharatpeAutoReady) {
    inFlightDepositLocks.add(deposit.id);
    inFlightUtrLocks.add(canonUtr);
    try {
      const excludeTxIds = new Set<string>(
        Array.isArray(db.usedBharatpeTxIds) ? db.usedBharatpeTxIds : [],
      );
      const check = await verifySingleDepositViaBharatpe(
        { merchantId: db.payments.bharatpeMid, token: db.payments.bharatpeToken },
        cleanUtr,
        numAmount,
        excludeTxIds,
      );
      if (check.matched && deposit.status === 'pending') {
        autoVerified = creditDepositOnce(deposit, 'bharatpe', {
          matchedBharatpeTxId: check.matchedTxId,
          extraUtrs: [check.matchedBankRef || '', check.matchedTxId || ''],
        });
      }
    } catch {
      // Leave pending for repeated background polling or admin review
    } finally {
      inFlightDepositLocks.delete(deposit.id);
      inFlightUtrLocks.delete(canonUtr);
    }
  }

  const autoCheckActive = isFampayAutoReady || isBharatpeAutoReady;

  return res.status(201).json({
    deposit: sanitizeDepositForUser(deposit),
    autoVerified,
    autoCheckActive,
    isManualMethod: methodCfg.key === 'manual' || methodCfg.key === 'usdt',
    state: getPublicUserPayload(user),
  });
});

async function handleVerifyDepositRequest(req: express.Request, res: express.Response) {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const dep = db.deposits.find((d) => d.id === Number(req.params.id) && d.userId === user.id);
  if (!dep || dep.isRedeem) {
    return res.status(404).json({ error: 'Deposit not found' });
  }
  if (dep.status === 'success') {
    return res.json({
      verified: true,
      alreadyVerified: true,
      deposit: sanitizeDepositForUser(dep),
      state: getPublicUserPayload(user),
    });
  }
  if (dep.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending deposits can be verified' });
  }

  const mLower = dep.method.toLowerCase();
  const isFampay = mLower.includes('fampay');
  const isBharatpe = mLower.includes('bharatpe');

  if (!isFampay && !isBharatpe) {
    return res.status(400).json({
      error: 'UPI Manual & USDT deposits are verified manually by our admin team.',
    });
  }

  if (isFampay && (!db.imap.enabled || !db.imap.email || !db.imap.appPassword)) {
    return res.status(400).json({
      error: 'FamPay automatic verification is currently paused. Admin will review your deposit shortly.',
    });
  }
  if (
    isBharatpe &&
    (!db.payments.bharatpeAutoVerify || !db.payments.bharatpeMid.trim() || !db.payments.bharatpeToken.trim())
  ) {
    return res.status(400).json({
      error: 'BharatPe automatic verification is currently paused. Admin will review your deposit shortly.',
    });
  }

  const canonUtr = normalizeUtr(dep.utr);
  if (inFlightDepositLocks.has(dep.id) || inFlightUtrLocks.has(canonUtr)) {
    return res.json({
      verified: false,
      deposit: sanitizeDepositForUser(dep),
      state: getPublicUserPayload(user),
    });
  }

  if (Array.isArray(db.usedUtrs) && db.usedUtrs.includes(canonUtr)) {
    return res.status(409).json({ error: 'This UTR / Payment ID has already been verified and credited.' });
  }

  inFlightDepositLocks.add(dep.id);
  inFlightUtrLocks.add(canonUtr);
  try {
    if (isFampay) {
      const excludeUids = new Set<number>(Array.isArray(db.usedEmailUids) ? db.usedEmailUids : []);
      const check = await verifySingleDepositViaImap(
        db.imap,
        dep.utr,
        dep.amount,
        excludeUids,
        dep.invoiceId,
      );
      if (check.matched && dep.status === 'pending') {
        const credited = creditDepositOnce(dep, 'imap', {
          matchedEmailUid: check.matchedUid,
          extraUtrs: check.extractedIds,
        });
        return res.json({
          verified: credited,
          deposit: sanitizeDepositForUser(dep),
          state: getPublicUserPayload(user),
        });
      }
    } else if (isBharatpe) {
      const excludeTxIds = new Set<string>(
        Array.isArray(db.usedBharatpeTxIds) ? db.usedBharatpeTxIds : [],
      );
      const check = await verifySingleDepositViaBharatpe(
        { merchantId: db.payments.bharatpeMid, token: db.payments.bharatpeToken },
        dep.utr,
        dep.amount,
        excludeTxIds,
      );
      if (check.matched && dep.status === 'pending') {
        const credited = creditDepositOnce(dep, 'bharatpe', {
          matchedBharatpeTxId: check.matchedTxId,
          extraUtrs: [check.matchedBankRef || '', check.matchedTxId || ''],
        });
        return res.json({
          verified: credited,
          deposit: sanitizeDepositForUser(dep),
          state: getPublicUserPayload(user),
        });
      }
    }

    return res.json({
      verified: false,
      deposit: sanitizeDepositForUser(dep),
      state: getPublicUserPayload(user),
    });
  } catch {
    return res.status(502).json({
      error: 'Unable to verify payment right now. We will keep checking automatically.',
    });
  } finally {
    inFlightDepositLocks.delete(dep.id);
    inFlightUtrLocks.delete(canonUtr);
  }
}

app.post('/api/deposits/:id/verify-imap', handleVerifyDepositRequest);
app.post('/api/deposits/:id/verify', handleVerifyDepositRequest);

app.post('/api/redeem', (req, res) => {
  if (rejectIfMaintenance(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  const code = String((req.body as { code?: string }).code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Enter a redeem code' });

  const db = getDb();
  const found = db.redeem.find((r) => r.code.toUpperCase() === code);
  if (!found || !found.active || found.used >= found.max) {
    return res.status(404).json({ error: 'Invalid or expired redeem code' });
  }
  if (found.usedBy.includes(user.id)) {
    return res.status(409).json({ error: 'You have already redeemed this code' });
  }

  found.used += 1;
  found.usedBy.push(user.id);
  user.balance = Number((user.balance + found.amount).toFixed(2));
  const nextId = db.deposits.reduce((m, d) => Math.max(m, d.id), 0) + 1;
  db.deposits.unshift({
    id: nextId,
    userId: user.id,
    amount: found.amount,
    method: `Redeem · ${found.code}`,
    utr: found.code,
    status: 'success',
    date: nowTimestamp(),
    isRedeem: true,
  });
  saveDb();

  return res.json({ amount: found.amount, state: getPublicUserPayload(user) });
});

app.post('/api/tickets', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { cat, message } = req.body as { cat?: ServerDeposit['method']; message?: string };
  const cleanMsg = String(message || '').trim();
  if (cleanMsg.length < 5) return res.status(400).json({ error: 'Please write at least 5 characters' });

  const db = getDb();
  const openCount = db.tickets.filter((t) => t.userId === user.id && t.status === 'open').length;
  if (openCount >= 3) return res.status(400).json({ error: 'Maximum 3 open tickets allowed' });

  const allowedCats = ['payment', 'order', 'account', 'other'] as const;
  const safeCat = allowedCats.includes(cat as (typeof allowedCats)[number])
    ? (cat as (typeof allowedCats)[number])
    : 'other';

  const ticketId = db.tickets.reduce((m, t) => Math.max(m, t.id), 8000) + 1;
  const createdAt = nowTimestamp();
  const initialMsg: ServerTicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sender: 'user',
    senderName: user.name || user.username || `User #${user.id}`,
    text: cleanMsg,
    createdAt,
  };

  const newTicket: ServerTicket = {
    id: ticketId,
    userId: user.id,
    cat: safeCat,
    subject: cleanMsg.slice(0, 48) + (cleanMsg.length > 48 ? '…' : ''),
    message: cleanMsg,
    status: 'open',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    messages: [initialMsg],
    lastMessageAt: createdAt,
    unreadByAdmin: 1,
    unreadByUser: 0,
  };

  db.tickets.unshift(newTicket);
  saveDb();

  const normalized = normalizeTicket(newTicket);
  broadcastTicketEvent(normalized, 'ticket:created');

  return res.status(201).json({ ticket: normalized, state: getPublicUserPayload(user) });
});

app.post('/api/tickets/:id/messages', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const ticketId = Number(req.params.id);
  const { text, clientMsgId } = req.body as { text?: string; clientMsgId?: string };
  const result = appendTicketMessage({
    ticketId,
    sender: 'user',
    senderName: user.name || user.username || `User #${user.id}`,
    text: String(text || ''),
    clientMsgId,
    userIdCheck: user.id,
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(201).json({
    message: result.message,
    ticket: result.ticket,
    state: getPublicUserPayload(user),
  });
});

app.post('/api/tickets/:id/reopen', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const ticket = db.tickets.find((t) => t.id === Number(req.params.id) && t.userId === user.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (ticket.status !== 'open') {
    const openCount = db.tickets.filter((t) => t.userId === user.id && t.status === 'open').length;
    if (openCount >= 3) {
      return res.status(400).json({ error: 'Maximum 3 open tickets allowed' });
    }
    ticket.status = 'open';
    saveDb();
    const normalized = normalizeTicket(ticket);
    broadcastTicketEvent(normalized, 'ticket:updated');
  }

  return res.json({ ticket: normalizeTicket(ticket), state: getPublicUserPayload(user) });
});

app.post('/api/tickets/:id/read', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const db = getDb();
  const ticket = db.tickets.find((t) => t.id === Number(req.params.id) && t.userId === user.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if ((ticket.unreadByUser || 0) > 0) {
    ticket.unreadByUser = 0;
    saveDb();
    broadcastTicketEvent(normalizeTicket(ticket), 'ticket:updated');
  }

  return res.json({ state: getPublicUserPayload(user) });
});

// ============================================================
// ADMIN AUTH & MANAGEMENT ENDPOINTS
// ============================================================
app.post('/api/admin/claim', (req, res) => {
  if (!isAdminSetupRequired()) {
    return res.status(403).json({ error: 'Primary admin has already been configured' });
  }
  const { username, password } = req.body as { username?: string; password?: string };
  const cleanUser = String(username || '').trim();
  const rawPass = String(password || '');
  if (!cleanUser || rawPass.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 chars) are required' });
  }

  const db = getDb();
  db.primaryAdmin = { username: cleanUser, passwordHash: hashPassword(rawPass) };
  saveDb();

  const token = signSessionToken({ role: 'admin', adminUsername: cleanUser });
  return res.status(201).json({ token, adminUsername: cleanUser, data: getAdminPayload() });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const cleanUser = String(username || '').trim();
  const rawPass = String(password || '');

  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  const envUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const db = getDb();

  let authorizedUser: string | null = null;
  if (envPass) {
    if (cleanUser === envUser && rawPass === envPass) authorizedUser = envUser;
  } else if (db.primaryAdmin) {
    if (cleanUser === db.primaryAdmin.username && verifyPassword(rawPass, db.primaryAdmin.passwordHash)) {
      authorizedUser = db.primaryAdmin.username;
    }
  }

  if (!authorizedUser) {
    const sub = db.admins.find((a) => a.username === cleanUser);
    if (sub && verifyPassword(rawPass, sub.passwordHash)) {
      authorizedUser = sub.username;
    }
  }

  if (!authorizedUser) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = signSessionToken({ role: 'admin', adminUsername: authorizedUser });
  return res.json({ token, adminUsername: authorizedUser, data: getAdminPayload() });
});

app.get('/api/admin/state', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  res.json({ adminUsername: admin, data: getAdminPayload() });
});

app.post('/api/admin/view-as/:userId', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const db = getDb();
  const target = db.users.find((u) => u.id === Number(req.params.userId));
  if (!target) return res.status(404).json({ error: 'User not found' });
  return res.json({ userState: getPublicUserPayload(target) });
});

app.put('/api/admin/users/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const u = db.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'User not found' });

  const { name, username, email, password, balance, banned, frozen } = req.body as {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    balance?: number;
    banned?: boolean;
    frozen?: boolean;
  };

  if (typeof name === 'string') u.name = name.trim();
  if (typeof username === 'string') u.username = username.trim();
  if (typeof email === 'string' && email.includes('@')) u.email = email.trim().toLowerCase();
  if (typeof password === 'string' && password.length >= 6) u.passwordHash = hashPassword(password);
  if (typeof balance === 'number' && !Number.isNaN(balance)) u.balance = Math.max(0, Number(balance.toFixed(2)));
  if (typeof banned === 'boolean') u.banned = banned;
  if (typeof frozen === 'boolean') u.frozen = frozen;

  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/users/:id/balance', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const u = db.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'User not found' });

  const expr = String((req.body as { expr?: string }).expr || '').trim();
  if (expr.startsWith('+')) u.balance += parseFloat(expr.slice(1)) || 0;
  else if (expr.startsWith('-')) u.balance = Math.max(0, u.balance - (parseFloat(expr.slice(1)) || 0));
  else u.balance = Math.max(0, parseFloat(expr) || 0);
  u.balance = Number(u.balance.toFixed(2));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/deposits/:id/approve', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const dep = db.deposits.find((d) => d.id === Number(req.params.id));
  if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Deposit is not pending' });
  if (inFlightDepositLocks.has(dep.id)) {
    return res.status(409).json({ error: 'Deposit is currently being verified' });
  }
  inFlightDepositLocks.add(dep.id);
  try {
    const credited = creditDepositOnce(dep, 'admin');
    if (!credited) {
      return res.status(409).json({ error: 'This UTR has already been credited or deposit is no longer pending' });
    }
    return res.json({ data: getAdminPayload() });
  } finally {
    inFlightDepositLocks.delete(dep.id);
  }
});

app.post('/api/admin/deposits/:id/reject', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const dep = db.deposits.find((d) => d.id === Number(req.params.id));
  if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Deposit is not pending' });
  dep.status = 'rejected';
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/orders/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status, code, credentials, refund } = req.body as {
    status?: ServerOrder['status'];
    code?: string;
    credentials?: string;
    refund?: boolean;
  };

  if (typeof code === 'string') order.code = code.trim();
  if (typeof credentials === 'string') order.credentials = credentials.trim();

  if (status === 'CANCELLED' && refund) {
    const u = db.users.find((x) => x.id === order.userId);
    refundOrderOnce(order, u);
  } else if (status && ['WAIT_CODE', 'DONE', 'DELIVERED', 'CANCELLED'].includes(status)) {
    order.status = status;
  }

  saveDb();
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/orders/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.orders = db.orders.filter((o) => o.id !== req.params.id);
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/stock', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { phone, country, year, cat, price, twofa, origin, isPremium, spamBlocked } = req.body as Record<
    string,
    string | number | boolean | undefined
  >;
  const safeOrigin =
    origin === 'pushing' || origin === 'autoreg' || origin === 'resale' ? origin : undefined;
  db.stock.unshift({
    id: `stk-${Date.now()}`,
    phone: String(phone || '').trim(),
    country: String(country || 'India').trim(),
    year: String(year || '2024').trim(),
    cat: String(cat || 'Good').trim(),
    price: Number(price) || 0,
    twofa: String(twofa || 'None'),
    available: true,
    ...(safeOrigin ? { origin: safeOrigin } : {}),
    ...(typeof isPremium === 'boolean' ? { isPremium } : {}),
    ...(typeof spamBlocked === 'boolean' ? { spamBlocked } : {}),
  });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/stock/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const item = db.stock.find((s) => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Stock item not found' });
  const { phone, country, year, cat, price, twofa, available, origin, isPremium, spamBlocked } = req.body as Record<
    string,
    unknown
  >;
  if (typeof phone === 'string' && phone.trim()) item.phone = phone.trim();
  if (typeof country === 'string' && country.trim()) item.country = country.trim();
  if (typeof year === 'string' && year.trim()) item.year = year.trim();
  if (typeof cat === 'string' && cat.trim()) item.cat = cat.trim();
  if (typeof price === 'number' && !Number.isNaN(price)) item.price = Math.max(0, price);
  if (typeof twofa === 'string') item.twofa = twofa;
  if (typeof available === 'boolean') item.available = available;
  if (origin === 'pushing' || origin === 'autoreg' || origin === 'resale') item.origin = origin;
  if (typeof isPremium === 'boolean') item.isPremium = isPremium;
  if (typeof spamBlocked === 'boolean') item.spamBlocked = spamBlocked;
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/stock/bulk', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { items } = req.body as {
    items?: {
      phone: string;
      country?: string;
      year?: string;
      cat?: string;
      price?: number;
      twofa?: string;
      origin?: 'pushing' | 'autoreg' | 'resale';
      isPremium?: boolean;
      spamBlocked?: boolean;
    }[];
  };
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Provide at least one stock row' });
  }
  let added = 0;
  for (const row of items) {
    const cleanPhone = String(row.phone || '').trim();
    if (!cleanPhone) continue;
    const safeOrigin =
      row.origin === 'pushing' || row.origin === 'autoreg' || row.origin === 'resale' ? row.origin : undefined;
    db.stock.unshift({
      id: `stk-${Date.now()}-${added}`,
      phone: cleanPhone,
      country: String(row.country || 'India').trim(),
      year: String(row.year || '2024').trim(),
      cat: String(row.cat || 'Good').trim(),
      price: Math.max(0, Number(row.price) || 0),
      twofa: String(row.twofa || 'None'),
      available: true,
      ...(safeOrigin ? { origin: safeOrigin } : {}),
      ...(typeof row.isPremium === 'boolean' ? { isPremium: row.isPremium } : {}),
      ...(typeof row.spamBlocked === 'boolean' ? { spamBlocked: row.spamBlocked } : {}),
    });
    added += 1;
  }
  saveDb();
  res.json({ added, data: getAdminPayload() });
});

app.post('/api/admin/stock/:id/toggle', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const item = db.stock.find((s) => s.id === req.params.id);
  if (item) {
    item.available = !item.available;
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/stock/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.stock = db.stock.filter((s) => s.id !== req.params.id);
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/digital', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { name, desc, price } = req.body as { name?: string; desc?: string; price?: number };
  const nextId = db.digital.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  db.digital.unshift({
    id: nextId,
    name: String(name || '').trim(),
    desc: String(desc || 'Instant digital delivery').trim(),
    price: Number(price) || 0,
    active: true,
  });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/digital/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const item = db.digital.find((p) => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Product not found' });
  const { name, desc, price, active } = req.body as { name?: string; desc?: string; price?: number; active?: boolean };
  if (typeof name === 'string' && name.trim()) item.name = name.trim();
  if (typeof desc === 'string') item.desc = desc.trim();
  if (typeof price === 'number' && !Number.isNaN(price)) item.price = Math.max(0, price);
  if (typeof active === 'boolean') item.active = active;
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/digital/:id/toggle', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const item = db.digital.find((p) => p.id === Number(req.params.id));
  if (item) {
    item.active = !item.active;
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/digital/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.digital = db.digital.filter((p) => p.id !== Number(req.params.id));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/redeem', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { code, amount, max } = req.body as { code?: string; amount?: number; max?: number };
  const upper = String(code || '').trim().toUpperCase();
  if (!upper || !Number(amount)) return res.status(400).json({ error: 'Valid code and amount required' });
  if (db.redeem.some((r) => r.code.toUpperCase() === upper)) {
    return res.status(409).json({ error: 'Redeem code already exists' });
  }
  db.redeem.unshift({ code: upper, amount: Number(amount), used: 0, max: Math.max(1, Number(max) || 1), active: true, usedBy: [] });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/redeem/:code/toggle', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const item = db.redeem.find((r) => r.code === req.params.code);
  if (item) {
    item.active = !item.active;
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/redeem/:code', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.redeem = db.redeem.filter((r) => r.code !== req.params.code);
  saveDb();
  res.json({ data: getAdminPayload() });
});

function sanitizeQrValue(val: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const s = String(val || '').trim();
  if (!s) return { ok: true, value: '' };
  if (s.length > 600_000) {
    return { ok: false, error: 'QR image is too large (max ~450 KB)' };
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(s)) {
    return { ok: true, value: s };
  }
  if (/^https?:\/\/\S+$/i.test(s)) {
    return { ok: true, value: s };
  }
  return { ok: false, error: 'QR must be a valid image upload or https:// image URL' };
}

app.put('/api/admin/payments', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const body = req.body as Record<string, unknown>;

  const stringFields = [
    'manualUpi',
    'manualName',
    'fampayUpi',
    'fampayName',
    'bharatpeUpi',
    'bharatpeMid',
    'usdtAddr',
    'usdtNet',
  ] as const;
  const boolFields = [
    'manualEnabled',
    'fampayEnabled',
    'bharatpeEnabled',
    'bharatpeAutoVerify',
    'usdtEnabled',
  ] as const;
  const qrFields = ['manualQr', 'fampayQr', 'bharatpeQr', 'usdtQr'] as const;
  const limitPairs = [
    { minKey: 'manualMin', maxKey: 'manualMax', label: 'UPI Manual' },
    { minKey: 'fampayMin', maxKey: 'fampayMax', label: 'Fampay' },
    { minKey: 'bharatpeMin', maxKey: 'bharatpeMax', label: 'BharatPe' },
    { minKey: 'usdtMin', maxKey: 'usdtMax', label: 'USDT' },
  ] as const;

  for (const k of stringFields) {
    if (typeof body[k] === 'string') {
      db.payments[k] = body[k].trim().slice(0, 200);
    }
  }
  if (body.clearBharatpeToken === true) {
    db.payments.bharatpeToken = '';
  } else if (typeof body.bharatpeToken === 'string' && body.bharatpeToken.trim()) {
    db.payments.bharatpeToken = body.bharatpeToken.trim().slice(0, 2000);
  }
  for (const k of boolFields) {
    if (typeof body[k] === 'boolean') {
      db.payments[k] = body[k];
    }
  }
  for (const k of qrFields) {
    if (k in body && body[k] !== undefined) {
      const check = sanitizeQrValue(body[k]);
      if (!check.ok) return res.status(400).json({ error: check.error });
      db.payments[k] = check.value;
    }
  }
  for (const pair of limitPairs) {
    const hasMin = pair.minKey in body && body[pair.minKey] !== undefined;
    const hasMax = pair.maxKey in body && body[pair.maxKey] !== undefined;
    if (!hasMin && !hasMax) continue;
    const nextMin = hasMin ? Number(body[pair.minKey]) : Number(db.payments[pair.minKey]) || 10;
    const nextMax = hasMax ? Number(body[pair.maxKey]) : Number(db.payments[pair.maxKey]) || 50000;
    if (!Number.isFinite(nextMin) || nextMin < 1 || nextMin > 10_000_000) {
      return res.status(400).json({ error: `${pair.label} minimum deposit must be at least ₹1` });
    }
    if (!Number.isFinite(nextMax) || nextMax < nextMin || nextMax > 10_000_000) {
      return res.status(400).json({
        error: `${pair.label} maximum deposit must be greater than or equal to minimum deposit (₹${nextMin})`,
      });
    }
    db.payments[pair.minKey] = Math.round(nextMin * 100) / 100;
    db.payments[pair.maxKey] = Math.round(nextMax * 100) / 100;
  }

  saveDb();
  res.json({ data: getAdminPayload() });
});

let imapSyncRunning = false;
async function syncPendingDepositsViaImap(): Promise<{ checked: number; approved: number }> {
  if (imapSyncRunning) return { checked: 0, approved: 0 };
  const db = getDb();
  if (!db.imap.enabled || !db.imap.email || !db.imap.appPassword) {
    return { checked: 0, approved: 0 };
  }
  // ONLY check pending FamPay UPI deposits (NEVER UPI Manual or BharatPe or USDT)
  const pending = db.deposits.filter(
    (d) => d.status === 'pending' && !d.isRedeem && d.method.toLowerCase().includes('fampay'),
  );
  if (pending.length === 0) return { checked: 0, approved: 0 };

  imapSyncRunning = true;
  try {
    const emails = await fetchRecentPaymentEmails(db.imap, 55);
    let approved = 0;
    const usedUids = new Set<number>(Array.isArray(db.usedEmailUids) ? db.usedEmailUids : []);
    const requireInvoice = db.imap.requireInvoiceMatch !== false;

    for (const dep of pending) {
      if (dep.status !== 'pending') continue;
      const canonUtr = normalizeUtr(dep.utr);
      if (!canonUtr) continue;
      if (inFlightDepositLocks.has(dep.id) || inFlightUtrLocks.has(canonUtr)) continue;
      if (Array.isArray(db.usedUtrs) && db.usedUtrs.includes(canonUtr)) continue;

      const matchedEmail = emails.find(
        (e) =>
          !usedUids.has(e.uid) &&
          doesEmailMatchPayment(
            e,
            dep.utr,
            dep.amount,
            db.imap.senderFilter || '',
            dep.invoiceId,
            requireInvoice,
          ),
      );
      if (matchedEmail) {
        inFlightDepositLocks.add(dep.id);
        inFlightUtrLocks.add(canonUtr);
        try {
          const extraUtrs = extractPaymentIdentifiers(matchedEmail.bodyText);
          if (creditDepositOnce(dep, 'imap', { matchedEmailUid: matchedEmail.uid, extraUtrs })) {
            usedUids.add(matchedEmail.uid);
            approved += 1;
          }
        } finally {
          inFlightDepositLocks.delete(dep.id);
          inFlightUtrLocks.delete(canonUtr);
        }
      }
    }
    return { checked: pending.length, approved };
  } finally {
    imapSyncRunning = false;
  }
}

let bharatpeSyncRunning = false;
async function syncPendingDepositsViaBharatpe(): Promise<{ checked: number; approved: number }> {
  if (bharatpeSyncRunning) return { checked: 0, approved: 0 };
  const db = getDb();
  const mid = db.payments.bharatpeMid.trim();
  const token = db.payments.bharatpeToken.trim();
  if (!db.payments.bharatpeEnabled || !db.payments.bharatpeAutoVerify || !mid || !token) {
    return { checked: 0, approved: 0 };
  }
  const pending = db.deposits.filter(
    (d) => d.status === 'pending' && !d.isRedeem && d.method.toLowerCase().includes('bharatpe'),
  );
  if (pending.length === 0) return { checked: 0, approved: 0 };

  bharatpeSyncRunning = true;
  try {
    const txs = await fetchBharatpeTransactions({ merchantId: mid, token }, 3);
    let approved = 0;
    const usedTxIds = new Set<string>(
      Array.isArray(db.usedBharatpeTxIds) ? db.usedBharatpeTxIds : [],
    );

    for (const dep of pending) {
      if (dep.status !== 'pending') continue;
      const canonUtr = normalizeUtr(dep.utr);
      if (!canonUtr) continue;
      if (inFlightDepositLocks.has(dep.id) || inFlightUtrLocks.has(canonUtr)) continue;
      if (Array.isArray(db.usedUtrs) && db.usedUtrs.includes(canonUtr)) continue;

      const matchedTx = txs.find((tx) => {
        const normId = normalizeUtr(tx.txId);
        if (normId && usedTxIds.has(normId)) return false;
        return doesBharatpeTxMatchDeposit(tx, dep.utr, dep.amount);
      });

      if (matchedTx) {
        const normTxId = normalizeUtr(matchedTx.txId) || normalizeUtr(matchedTx.bankReferenceNo);
        inFlightDepositLocks.add(dep.id);
        inFlightUtrLocks.add(canonUtr);
        try {
          if (
            creditDepositOnce(dep, 'bharatpe', {
              matchedBharatpeTxId: normTxId,
              extraUtrs: [matchedTx.bankReferenceNo, matchedTx.txId],
            })
          ) {
            if (normTxId) usedTxIds.add(normTxId);
            approved += 1;
          }
        } finally {
          inFlightDepositLocks.delete(dep.id);
          inFlightUtrLocks.delete(canonUtr);
        }
      }
    }
    return { checked: pending.length, approved };
  } finally {
    bharatpeSyncRunning = false;
  }
}

app.post('/api/admin/bharatpe/test', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const draft = (req.body || {}) as { merchantId?: string; token?: string };
  const merchantId = (draft.merchantId?.trim() || db.payments.bharatpeMid || '').trim();
  const token = (draft.token?.trim() || db.payments.bharatpeToken || '').trim();
  if (!merchantId || !token) {
    return res.status(400).json({ error: 'BharatPe Merchant ID and API Token are required' });
  }
  try {
    const result = await testBharatpeConnection({ merchantId, token });
    return res.json(result);
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'BharatPe connection test failed',
    });
  }
});

app.post('/api/admin/bharatpe/sync', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  if (!db.payments.bharatpeMid.trim() || !db.payments.bharatpeToken.trim()) {
    return res.status(400).json({ error: 'Save BharatPe Merchant ID and Token first' });
  }
  try {
    const summary = await syncPendingDepositsViaBharatpe();
    return res.json({ ...summary, data: getAdminPayload() });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'BharatPe sync failed',
    });
  }
});

app.put('/api/admin/imap', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const body = req.body as {
    enabled?: boolean;
    host?: string;
    port?: number;
    email?: string;
    appPassword?: string;
    senderFilter?: string;
    autoApproveOnSubmit?: boolean;
    requireInvoiceMatch?: boolean;
    pollIntervalSec?: number;
  };

  if (typeof body.enabled === 'boolean') db.imap.enabled = body.enabled;
  if (typeof body.host === 'string' && body.host.trim()) {
    const cleanHost = body.host.trim().toLowerCase();
    const hostCheck = validateExternalApiUrl(`https://${cleanHost}`);
    if (!hostCheck.ok) return res.status(400).json({ error: 'Invalid IMAP host' });
    db.imap.host = cleanHost;
  }
  if (typeof body.port === 'number' && !Number.isNaN(body.port)) {
    db.imap.port = Math.min(65535, Math.max(1, Math.round(body.port)));
  }
  if (typeof body.email === 'string') {
    const cleanEmail = body.email.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid Gmail address required' });
    }
    db.imap.email = cleanEmail;
  }
  if (typeof body.appPassword === 'string' && body.appPassword.trim()) {
    db.imap.appPassword = body.appPassword.replace(/\s+/g, '').trim();
  }
  if (typeof body.senderFilter === 'string') {
    db.imap.senderFilter = body.senderFilter.trim().slice(0, 200);
  }
  if (typeof body.autoApproveOnSubmit === 'boolean') {
    db.imap.autoApproveOnSubmit = body.autoApproveOnSubmit;
  }
  if (typeof body.requireInvoiceMatch === 'boolean') {
    db.imap.requireInvoiceMatch = body.requireInvoiceMatch;
  }
  if (typeof body.pollIntervalSec === 'number' && !Number.isNaN(body.pollIntervalSec)) {
    db.imap.pollIntervalSec = Math.min(300, Math.max(15, Math.round(body.pollIntervalSec)));
  }

  saveDb();
  return res.json({ data: getAdminPayload() });
});

app.post('/api/admin/imap/test', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const draft = req.body as {
    host?: string;
    port?: number;
    email?: string;
    appPassword?: string;
  };
  const cfg = {
    ...db.imap,
    ...(draft.host?.trim() ? { host: draft.host.trim().toLowerCase() } : {}),
    ...(draft.port ? { port: Number(draft.port) || 993 } : {}),
    ...(draft.email?.trim() ? { email: draft.email.trim().toLowerCase() } : {}),
    ...(draft.appPassword?.trim() ? { appPassword: draft.appPassword.replace(/\s+/g, '').trim() } : {}),
  };

  if (cfg.host) {
    const hostCheck = validateExternalApiUrl(`https://${cfg.host}`);
    if (!hostCheck.ok) return res.status(400).json({ error: 'Invalid IMAP host' });
  }

  try {
    const result = await testImapConnection(cfg);
    return res.json(result);
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'IMAP login failed. Check Gmail & App Password.',
    });
  }
});

app.post('/api/admin/imap/sync', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const summary = await syncPendingDepositsViaImap();
    return res.json({ ...summary, data: getAdminPayload() });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'IMAP sync failed',
    });
  }
});

app.post('/api/admin/broadcast', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const msg = String((req.body as { message?: string }).message || '').trim();
  if (!msg) return res.status(400).json({ error: 'Message is required' });
  db.broadcasts.unshift({ id: Date.now(), message: msg, recipients: db.users.length, date: nowTimestamp() });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/broadcast/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.broadcasts = db.broadcasts.filter((b) => b.id !== Number(req.params.id));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/tickets/:id', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const ticket = db.tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { status, adminReply } = req.body as { status?: 'open' | 'closed'; adminReply?: string };
  if (typeof adminReply === 'string' && adminReply.trim()) {
    const cleanReply = adminReply.trim();
    const ts = nowTimestamp();
    if (!Array.isArray(ticket.messages) || ticket.messages.length === 0) {
      ticket.messages = normalizeTicket(ticket).messages || [];
    }
    if (cleanReply !== ticket.adminReply) {
      ticket.messages.push({
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sender: 'admin',
        senderName: adminUsername,
        text: cleanReply,
        createdAt: ts,
      });
      ticket.lastMessageAt = ts;
      ticket.unreadByUser = (Number(ticket.unreadByUser) || 0) + 1;
      ticket.unreadByAdmin = 0;
    }
    ticket.adminReply = cleanReply;
    ticket.repliedAt = ts;
  }
  if (status === 'open' || status === 'closed') {
    ticket.status = status;
  }
  saveDb();
  broadcastTicketEvent(normalizeTicket(ticket), 'ticket:updated');
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/tickets/:id/messages', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;

  const ticketId = Number(req.params.id);
  const { text, status, clientMsgId } = req.body as {
    text?: string;
    status?: 'open' | 'closed';
    clientMsgId?: string;
  };
  const result = appendTicketMessage({
    ticketId,
    sender: 'admin',
    senderName: adminUsername,
    text: String(text || ''),
    clientMsgId,
    nextStatus: status,
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(201).json({
    message: result.message,
    ticket: result.ticket,
    data: getAdminPayload(),
  });
});

app.post('/api/admin/tickets/:id/read', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const ticket = db.tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if ((ticket.unreadByAdmin || 0) > 0) {
    ticket.unreadByAdmin = 0;
    saveDb();
    broadcastTicketEvent(normalizeTicket(ticket), 'ticket:updated');
  }
  return res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/tickets/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const target = db.tickets.find((t) => t.id === Number(req.params.id));
  db.tickets = db.tickets.filter((t) => t.id !== Number(req.params.id));
  saveDb();
  if (target) {
    broadcastTicketEvent(normalizeTicket(target), 'ticket:deleted');
  }
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/apikeys', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { owner, days } = req.body as { owner?: number; days?: number };
  const exp = new Date();
  exp.setDate(exp.getDate() + Math.max(1, Number(days) || 30));
  const token = Math.random().toString(36).slice(2, 14);
  const fullKey = `ats_${token}`;
  const nextId = db.apikeys.reduce((m, k) => Math.max(m, k.id), 0) + 1;
  db.apikeys.unshift({
    id: nextId,
    owner: Number(owner) || 0,
    prefix: `ats_${token.slice(0, 4)}…`,
    fullKey,
    status: 'active',
    expires: exp.toISOString().slice(0, 10),
  });
  saveDb();
  res.json({ createdKey: fullKey, data: getAdminPayload() });
});

app.post('/api/admin/apikeys/:id/toggle', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const k = db.apikeys.find((x) => x.id === Number(req.params.id));
  if (k) {
    k.status = k.status === 'active' ? 'suspended' : 'active';
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/apikeys/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.apikeys = db.apikeys.filter((x) => x.id !== Number(req.params.id));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/admins', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { username, password, perms } = req.body as {
    username?: string;
    password?: string;
    perms?: Record<string, boolean>;
  };
  const cleanUser = String(username || '').trim();
  const rawPass = String(password || '');
  if (!cleanUser || rawPass.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 chars) required' });
  }
  if (db.admins.some((a) => a.username === cleanUser) || db.primaryAdmin?.username === cleanUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  db.admins.push({
    id: Date.now(),
    username: cleanUser,
    passwordHash: hashPassword(rawPass),
    p_add_stock: Boolean(perms?.p_add_stock),
    p_manage_stock: Boolean(perms?.p_manage_stock),
    p_stats: Boolean(perms?.p_stats),
    p_bal: Boolean(perms?.p_bal),
    p_settings: Boolean(perms?.p_settings),
  });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/admins/:id/perm', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const a = db.admins.find((x) => x.id === Number(req.params.id));
  const key = String((req.body as { key?: string }).key || '');
  const allowed = ['p_add_stock', 'p_manage_stock', 'p_stats', 'p_bal', 'p_settings'] as const;
  if (a && allowed.includes(key as (typeof allowed)[number])) {
    const k = key as (typeof allowed)[number];
    a[k] = !a[k];
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/admins/:id/password', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const a = db.admins.find((x) => x.id === Number(req.params.id));
  const pw = String((req.body as { password?: string }).password || '');
  if (!a || pw.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  a.passwordHash = hashPassword(pw);
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/admins/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.admins = db.admins.filter((x) => x.id !== Number(req.params.id));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/servers/:no', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const no = Number(req.params.no) as 1 | 2 | 3;
  const db = getDb();
  const srv = db.servers.find((s) => s.no === no);
  if (!srv) return res.status(404).json({ error: 'Server not found' });

  const { url, key, margin, lowbal } = req.body as { url?: string; key?: string; margin?: number; lowbal?: number };
  if (typeof url === 'string' && url.trim()) {
    const check = validateExternalApiUrl(url);
    if (!check.ok) return res.status(400).json({ error: check.error });
    srv.url = url.trim();
  }
  if (typeof key === 'string' && key.trim()) srv.key = key.trim();
  if (typeof margin === 'number' && !Number.isNaN(margin)) srv.margin = margin;
  if (typeof lowbal === 'number' && !Number.isNaN(lowbal)) srv.lowbal = lowbal;

  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/servers/:no/test', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const no = Number(req.params.no) as 1 | 2 | 3;
  const db = getDb();
  const srv = db.servers.find((s) => s.no === no);
  if (!srv) return res.status(404).json({ error: 'Server not found' });

  const draft = req.body as { url?: string; key?: string };
  const testUrl = (draft.url || srv.url || '').trim();
  const s2Key = db.servers.find((s) => s.no === 2)?.key || '';
  const testKey = (draft.key || srv.key || (no === 3 ? s2Key : '')).trim();

  if (!testUrl || !testKey) return res.status(400).json({ error: 'API URL and API key are required' });

  try {
    const result = no === 1 ? await testLolzteam(testUrl, testKey) : await testTigerSms(testUrl, testKey);
    return res.json(result);
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Live provider check failed' });
  }
});

app.delete('/api/admin/servers/:no', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const no = Number(req.params.no) as 1 | 2 | 3;
  const db = getDb();
  const srv = db.servers.find((s) => s.no === no);
  if (srv) {
    srv.url = '';
    srv.key = '';
    saveDb();
  }
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/smm/api', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { url, key } = req.body as { url?: string; key?: string };
  if (url && url.trim()) {
    const check = validateExternalApiUrl(url);
    if (!check.ok) return res.status(400).json({ error: check.error });
  }
  const db = getDb();
  if (typeof url === 'string') db.smm.url = url.trim();
  if (typeof key === 'string' && key.trim()) db.smm.key = key.trim();
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/smm/test', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const draft = req.body as { url?: string; key?: string };
  const testUrl = (draft.url || db.smm.url || '').trim();
  const testKey = (draft.key || db.smm.key || '').trim();
  if (!testUrl || !testKey) return res.status(400).json({ error: 'SMM API URL and Key are required' });

  try {
    const result = await testSmmPanel(testUrl, testKey);
    return res.json(result);
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'SMM API connection failed' });
  }
});

app.post('/api/admin/smm/categories', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const name = String((req.body as { name?: string }).name || '').trim();
  if (!name) return res.status(400).json({ error: 'Category name required' });
  const db = getDb();
  const nextId = db.smm.cats.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  db.smm.cats.push({ id: nextId, name });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/smm/categories/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  const db = getDb();
  db.smm.cats = db.smm.cats.filter((c) => c.id !== id);
  db.smm.services = db.smm.services.filter((s) => s.cat !== id);
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/smm/services', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { id, cat, name, rate, min, max, desc } = req.body as Record<string, unknown>;
  const idNum = Number(id);
  if (!idNum || !String(name || '').trim()) return res.status(400).json({ error: 'Service ID and name required' });
  if (db.smm.services.some((s) => s.id === idNum)) return res.status(409).json({ error: 'Service ID already exists' });
  db.smm.services.push({
    id: idNum,
    cat: Number(cat),
    name: String(name).trim(),
    rate: Number(rate) || 0,
    min: Number(min) || 10,
    max: Number(max) || 10000,
    desc: String(desc || '').trim(),
  });
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.post('/api/admin/smm/services/bulk', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const { cat, ids, markup } = req.body as { cat?: number; ids?: number[]; markup?: number };
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No valid IDs provided' });

  const mk = Number(markup) || 0;
  let remoteMap = new Map<number, { name: string; rate: number; min: number; max: number; category: string }>();

  if (db.smm.url && db.smm.key) {
    try {
      const remoteServices = await fetchSmmPanelServices(db.smm.url, db.smm.key);
      remoteMap = new Map(remoteServices.map((s) => [s.service, s]));
    } catch {
      // Fallback to ID-only stub if panel unreachable
    }
  }

  let added = 0;
  for (const id of ids) {
    if (db.smm.services.some((s) => s.id === id)) continue;
    const remote = remoteMap.get(id);
    db.smm.services.push({
      id,
      cat: Number(cat),
      name: remote ? remote.name : `Service ${id}`,
      rate: remote ? Number((remote.rate * (1 + mk / 100)).toFixed(2)) : 0,
      min: remote ? remote.min : 10,
      max: remote ? remote.max : 10000,
      desc: remote ? remote.category : '',
    });
    added += 1;
  }
  saveDb();
  res.json({ added, fetchedFromApi: remoteMap.size > 0, data: getAdminPayload() });
});

app.put('/api/admin/smm/services/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const svc = db.smm.services.find((s) => s.id === Number(req.params.id));
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const { name, desc, rate, cat, min, max } = req.body as Record<string, unknown>;
  if (typeof name === 'string' && name.trim()) svc.name = name.trim();
  if (typeof desc === 'string') svc.desc = desc.trim();
  if (typeof rate === 'number') svc.rate = rate;
  if (typeof cat === 'number') svc.cat = cat;
  if (typeof min === 'number') svc.min = min;
  if (typeof max === 'number') svc.max = max;
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.delete('/api/admin/smm/services/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  db.smm.services = db.smm.services.filter((s) => s.id !== Number(req.params.id));
  saveDb();
  res.json({ data: getAdminPayload() });
});

app.put('/api/admin/settings', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  const body = (req.body || {}) as Record<string, unknown>;

  if (typeof body.support === 'string') {
    const clean = body.support.trim().slice(0, 300);
    if (clean && !/^https?:\/\//i.test(clean)) {
      return res.status(400).json({ error: 'Support URL must start with http:// or https://' });
    }
    db.settings.support = clean;
  }
  if (typeof body.supportCh === 'string') {
    const clean = body.supportCh.trim().slice(0, 300);
    if (clean && !/^https?:\/\//i.test(clean)) {
      return res.status(400).json({ error: 'Support channel URL must start with http:// or https://' });
    }
    db.settings.supportCh = clean;
  }
  if (body.usdtRate !== undefined) {
    const rate = Number(body.usdtRate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 10000) {
      return res.status(400).json({ error: 'USDT rate must be a valid positive number' });
    }
    db.settings.usdtRate = Math.round(rate * 100) / 100;
  }
  if (typeof body.maintenanceMode === 'boolean') {
    db.settings.maintenanceMode = body.maintenanceMode;
  }
  if (typeof body.maintenanceTitle === 'string') {
    db.settings.maintenanceTitle = body.maintenanceTitle.trim().slice(0, 120) || 'Store Under Maintenance';
  }
  if (typeof body.maintenanceMessage === 'string') {
    db.settings.maintenanceMessage =
      body.maintenanceMessage.trim().slice(0, 500) ||
      'AadityaTg.Store is currently under maintenance. Please check back shortly.';
  }
  if (typeof body.maintenanceEta === 'string') {
    db.settings.maintenanceEta = body.maintenanceEta.trim().slice(0, 80);
  }

  saveDb();
  res.json({ data: getAdminPayload(), maintenance: getPublicMaintenancePayload() });
});

app.put('/api/admin/google-auth', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const sub = db.admins.find((a) => a.username === adminUsername);
  if (sub && !sub.p_settings) {
    return res.status(403).json({ error: 'Settings permission required for Google Login configuration' });
  }

  const body = (req.body || {}) as Record<string, unknown>;
  if (typeof body.enabled === 'boolean') {
    db.googleAuth.enabled = body.enabled;
  }
  if (typeof body.apiKey === 'string') {
    db.googleAuth.apiKey = body.apiKey.trim().slice(0, 200);
  }
  if (typeof body.authDomain === 'string') {
    const clean = body.authDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').slice(0, 200);
    db.googleAuth.authDomain = clean;
  }
  if (typeof body.projectId === 'string') {
    const clean = body.projectId.trim().slice(0, 120);
    if (clean && !/^[a-z0-9-]+$/i.test(clean)) {
      return res.status(400).json({ error: 'Invalid Firebase Project ID format' });
    }
    db.googleAuth.projectId = clean;
  }
  if (typeof body.appId === 'string') {
    db.googleAuth.appId = body.appId.trim().slice(0, 200);
  }

  saveDb();
  return res.json({ data: getAdminPayload(), googleAuth: getPublicGoogleAuthConfig() });
});

app.put('/api/admin/github-backup', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const sub = db.admins.find((a) => a.username === adminUsername);
  if (sub && !sub.p_settings) {
    return res.status(403).json({ error: 'Settings permission required for GitHub auto-backup' });
  }

  const body = (req.body || {}) as Record<string, unknown>;
  const nextRepo = typeof body.repo === 'string' ? body.repo : db.githubBackup.repo;
  const nextBranch = typeof body.branch === 'string' ? body.branch : db.githubBackup.branch;
  const nextFilePath = typeof body.filePath === 'string' ? body.filePath : db.githubBackup.filePath;
  const nextEnabled =
    typeof body.enabled === 'boolean' ? body.enabled : db.githubBackup.enabled;

  if (nextRepo.trim() || nextEnabled) {
    const valid = validateGithubBackupConfig({
      repo: nextRepo,
      branch: nextBranch,
      filePath: nextFilePath,
    });
    if (!valid.ok) {
      return res.status(400).json({ error: valid.error });
    }
    db.githubBackup.repo = valid.repo;
    db.githubBackup.branch = valid.branch;
    db.githubBackup.filePath = valid.filePath;
  } else {
    db.githubBackup.repo = '';
    db.githubBackup.branch = nextBranch.trim() || 'main';
    db.githubBackup.filePath = nextFilePath.trim() || 'backups/aadityatg-store-latest-backup.json';
  }

  if (body.intervalMinutes !== undefined) {
    const mins = Math.round(Number(body.intervalMinutes));
    if (!Number.isFinite(mins) || mins < 5 || mins > 1440) {
      return res.status(400).json({ error: 'Backup interval must be between 5 and 1440 minutes' });
    }
    db.githubBackup.intervalMinutes = mins;
  }

  if (body.clearToken === true) {
    db.githubBackup.token = '';
  } else if (typeof body.token === 'string' && body.token.trim()) {
    db.githubBackup.token = body.token.trim().slice(0, 300);
  }

  db.githubBackup.enabled = nextEnabled;
  saveDb();
  return res.json({ data: getAdminPayload() });
});

app.post('/api/admin/github-backup/run', async (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const sub = db.admins.find((a) => a.username === adminUsername);
  if (sub && !sub.p_settings) {
    return res.status(403).json({ error: 'Settings permission required to run GitHub backup' });
  }

  const result = await runGithubFullBackup('manual');
  if (!result.ok) {
    return res.status(400).json({ error: result.message, data: getAdminPayload() });
  }
  return res.json({
    ok: true,
    message: result.message,
    commitUrl: result.commitUrl,
    replacedPrevious: result.replacedPrevious,
    timestamp: result.timestamp,
    data: getAdminPayload(),
  });
});

app.get('/api/admin/backup', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const sub = db.admins.find((a) => a.username === adminUsername);
  if (sub && !sub.p_settings) {
    return res.status(403).json({ error: 'Settings permission required for full database backup' });
  }
  const backup = exportFullDbBackup();
  return res.json({ backup });
});

app.post('/api/admin/restore', (req, res) => {
  const adminUsername = requireAdmin(req, res);
  if (!adminUsername) return;
  const db = getDb();
  const sub = db.admins.find((a) => a.username === adminUsername);
  if (sub && !sub.p_settings) {
    return res.status(403).json({ error: 'Settings permission required to restore database' });
  }
  const payload =
    req.body && typeof req.body === 'object' && 'backup' in req.body
      ? (req.body as { backup: unknown }).backup
      : req.body;
  const result = restoreDbFromBackup(payload);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ ok: true, summary: result.summary, data: getAdminPayload() });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ============================================================
// REAL-TIME SUPPORT WEBSOCKET HUB
// ============================================================
interface SupportWsClient {
  ws: WebSocket;
  role: 'user' | 'admin';
  userId?: number;
  adminUsername?: string;
  joinedTickets: Set<number>;
}

const supportWsClients = new Set<SupportWsClient>();

function safeWsSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastPresence(): void {
  let adminCount = 0;
  const onlineUserIds = new Set<number>();
  for (const client of supportWsClients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (client.role === 'admin') adminCount += 1;
    else if (client.userId) onlineUserIds.add(client.userId);
  }
  const userIdsList = Array.from(onlineUserIds);
  for (const client of supportWsClients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    safeWsSend(client.ws, {
      type: 'support:presence',
      adminOnline: adminCount > 0,
      adminCount,
      onlineUserIds: client.role === 'admin' ? userIdsList : [],
    });
  }
}

function broadcastTicketEvent(
  ticket: ServerTicket,
  eventType: 'ticket:created' | 'ticket:message' | 'ticket:updated' | 'ticket:deleted',
  extra: Record<string, unknown> = {},
): void {
  for (const client of supportWsClients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (client.role === 'admin' || client.userId === ticket.userId) {
      safeWsSend(client.ws, {
        type: eventType,
        ticketId: ticket.id,
        ticket,
        ...extra,
      });
    }
  }
}

function appendTicketMessage(params: {
  ticketId: number;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  clientMsgId?: string;
  userIdCheck?: number;
  nextStatus?: 'open' | 'closed';
}):
  | { ok: true; message: ServerTicketMessage; ticket: ServerTicket }
  | { ok: false; status: number; error: string } {
  const db = getDb();
  const ticket = db.tickets.find((t) => t.id === params.ticketId);
  if (!ticket) {
    return { ok: false, status: 404, error: 'Ticket not found' };
  }
  if (params.userIdCheck !== undefined && ticket.userId !== params.userIdCheck) {
    return { ok: false, status: 403, error: 'Access denied' };
  }
  if (params.sender === 'user' && ticket.status !== 'open') {
    return { ok: false, status: 400, error: 'Ticket is closed — reopen it to continue chatting' };
  }

  const cleanText = params.text.trim();
  if (!cleanText) {
    return { ok: false, status: 400, error: 'Message cannot be empty' };
  }
  if (cleanText.length > 2000) {
    return { ok: false, status: 400, error: 'Message too long (max 2000 characters)' };
  }

  if (!Array.isArray(ticket.messages) || ticket.messages.length === 0) {
    ticket.messages = normalizeTicket(ticket).messages || [];
  }

  const cleanClientId = params.clientMsgId ? String(params.clientMsgId).trim().slice(0, 80) : undefined;
  if (cleanClientId) {
    const duplicate = ticket.messages.find((m) => m.clientMsgId && m.clientMsgId === cleanClientId);
    if (duplicate) {
      return { ok: true, message: duplicate, ticket: normalizeTicket(ticket) };
    }
  }

  const ts = nowTimestamp();
  const newMsg: ServerTicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sender: params.sender,
    senderName: params.senderName,
    text: cleanText,
    createdAt: ts,
    ...(cleanClientId ? { clientMsgId: cleanClientId } : {}),
  };

  ticket.messages.push(newMsg);
  ticket.lastMessageAt = ts;

  if (params.sender === 'admin') {
    ticket.adminReply = cleanText;
    ticket.repliedAt = ts;
    ticket.unreadByAdmin = 0;
    ticket.unreadByUser = (Number(ticket.unreadByUser) || 0) + 1;
    if (params.nextStatus === 'open' || params.nextStatus === 'closed') {
      ticket.status = params.nextStatus;
    }
  } else {
    ticket.unreadByAdmin = (Number(ticket.unreadByAdmin) || 0) + 1;
    ticket.unreadByUser = 0;
  }

  saveDb();

  const normalized = normalizeTicket(ticket);
  broadcastTicketEvent(normalized, 'ticket:message', { message: newMsg });
  return { ok: true, message: newMsg, ticket: normalized };
}

function attachSupportWebSocketServer(httpServer: http.Server): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/support' });

  wss.on('connection', (ws, req) => {
    const reqUrl = new URL(req.url || '/ws/support', `http://${req.headers.host || 'localhost'}`);
    const token = reqUrl.searchParams.get('token');
    const session = verifySessionToken(token);

    if (!session) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const db = getDb();
    let client: SupportWsClient;

    if (session.role === 'admin' && session.adminUsername) {
      client = {
        ws,
        role: 'admin',
        adminUsername: session.adminUsername,
        joinedTickets: new Set<number>(),
      };
    } else if (session.role === 'user' && session.userId) {
      const user = db.users.find((u) => u.id === session.userId);
      if (!user || user.banned) {
        ws.close(4003, 'Forbidden');
        return;
      }
      client = {
        ws,
        role: 'user',
        userId: user.id,
        joinedTickets: new Set<number>(),
      };
    } else {
      ws.close(4001, 'Unauthorized');
      return;
    }

    supportWsClients.add(client);
    safeWsSend(ws, {
      type: 'connected',
      role: client.role,
      userId: client.userId,
      adminUsername: client.adminUsername,
    });
    broadcastPresence();

    ws.on('message', (rawData) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(rawData)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');
      if (type === 'ping') {
        safeWsSend(ws, { type: 'pong' });
        return;
      }

      const ticketId = Number(msg.ticketId);
      if (!ticketId) return;

      const currentDb = getDb();
      const ticket = currentDb.tickets.find((t) => t.id === ticketId);
      if (!ticket) return;
      if (client.role === 'user' && ticket.userId !== client.userId) return;

      if (type === 'ticket:join') {
        client.joinedTickets.add(ticketId);
        safeWsSend(ws, {
          type: 'ticket:sync',
          ticketId,
          ticket: normalizeTicket(ticket),
        });
        return;
      }

      if (type === 'ticket:read') {
        if (client.role === 'admin' && (ticket.unreadByAdmin || 0) > 0) {
          ticket.unreadByAdmin = 0;
          saveDb();
          broadcastTicketEvent(normalizeTicket(ticket), 'ticket:updated');
        } else if (client.role === 'user' && (ticket.unreadByUser || 0) > 0) {
          ticket.unreadByUser = 0;
          saveDb();
          broadcastTicketEvent(normalizeTicket(ticket), 'ticket:updated');
        }
        return;
      }

      if (type === 'ticket:typing') {
        const isTyping = Boolean(msg.isTyping);
        const senderName =
          client.role === 'admin'
            ? 'Support Team'
            : currentDb.users.find((u) => u.id === client.userId)?.name || `User #${client.userId}`;
        for (const other of supportWsClients) {
          if (other.ws.readyState !== WebSocket.OPEN) continue;
          if (client.role === 'user' && other.role === 'admin') {
            safeWsSend(other.ws, {
              type: 'ticket:typing',
              ticketId,
              sender: 'user',
              senderName,
              isTyping,
            });
          } else if (client.role === 'admin' && other.role === 'user' && other.userId === ticket.userId) {
            safeWsSend(other.ws, {
              type: 'ticket:typing',
              ticketId,
              sender: 'admin',
              senderName,
              isTyping,
            });
          }
        }
        return;
      }

      if (type === 'ticket:send') {
        const text = String(msg.text || '');
        const clientMsgId = typeof msg.clientMsgId === 'string' ? msg.clientMsgId : undefined;
        const nextStatus =
          client.role === 'admin' && (msg.status === 'open' || msg.status === 'closed')
            ? msg.status
            : undefined;
        const senderName =
          client.role === 'admin'
            ? client.adminUsername || 'Admin'
            : currentDb.users.find((u) => u.id === client.userId)?.name ||
              currentDb.users.find((u) => u.id === client.userId)?.username ||
              `User #${client.userId}`;

        const res = appendTicketMessage({
          ticketId,
          sender: client.role,
          senderName,
          text,
          clientMsgId,
          userIdCheck: client.role === 'user' ? client.userId : undefined,
          nextStatus,
        });
        if (!res.ok) {
          safeWsSend(ws, { type: 'ticket:error', ticketId, error: res.error });
        }
      }
    });

    ws.on('close', () => {
      supportWsClients.delete(client);
      broadcastPresence();
    });

    ws.on('error', () => {
      supportWsClients.delete(client);
      broadcastPresence();
    });
  });
}

// ============================================================
// VITE DEV MIDDLEWARE / PRODUCTION STATIC HOSTING
// ============================================================
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  let lastImapRun = 0;
  setInterval(() => {
    const db = getDb();
    if (db.imap.enabled && db.imap.email && db.imap.appPassword) {
      const intervalMs = Math.max(15, Number(db.imap.pollIntervalSec) || 20) * 1000;
      if (Date.now() - lastImapRun >= intervalMs) {
        lastImapRun = Date.now();
        void syncPendingDepositsViaImap().catch(() => {});
      }
    }
    if (
      db.payments.bharatpeEnabled &&
      db.payments.bharatpeAutoVerify &&
      db.payments.bharatpeMid.trim() &&
      db.payments.bharatpeToken.trim()
    ) {
      void syncPendingDepositsViaBharatpe().catch(() => {});
    }
  }, 15_000);

  // Automatic scheduled GitHub Full DB Backup (default every 2 hours = 120 mins)
  // Removes the previous backup file and uploads the latest snapshot
  setInterval(() => {
    const db = getDb();
    const cfg = db.githubBackup;
    if (!cfg.enabled || !cfg.repo.trim() || !resolveGithubBackupToken()) return;
    const intervalMs = Math.max(5, Number(cfg.intervalMinutes) || 120) * 60_000;
    const lastMs = cfg.lastBackupAt ? Date.parse(cfg.lastBackupAt) : 0;
    if (Number.isFinite(lastMs) && lastMs > 0 && Date.now() - lastMs < intervalMs) return;
    void runGithubFullBackup('auto').catch(() => {});
  }, 60_000);

  const httpServer = http.createServer(app);
  attachSupportWebSocketServer(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AadityaTg.Store server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
