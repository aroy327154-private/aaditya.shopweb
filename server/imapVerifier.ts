import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { normalizeUtr, type ServerImapSettings } from './store.ts';

export interface ParsedPaymentEmail {
  uid: number;
  subject: string;
  from: string;
  date: string;
  bodyText: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createImapClient(cfg: ServerImapSettings): ImapFlow {
  return new ImapFlow({
    host: cfg.host || 'imap.gmail.com',
    port: Number(cfg.port) || 993,
    secure: true,
    auth: {
      user: cfg.email,
      pass: cfg.appPassword,
    },
    logger: false,
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  });
}

export async function testImapConnection(
  cfg: ServerImapSettings,
): Promise<{ ok: true; detail: string }> {
  if (!cfg.email || !cfg.appPassword) {
    throw new Error('Gmail address and Google App Password are required');
  }
  const client = createImapClient(cfg);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      const total = status && typeof status === 'object' ? (status.messages ?? 0) : 0;
      const unseen = status && typeof status === 'object' ? (status.unseen ?? 0) : 0;
      return {
        ok: true,
        detail: `Connected to ${cfg.host}:${cfg.port} · INBOX (${total} emails, ${unseen} unread)`,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function fetchRecentPaymentEmails(
  cfg: ServerImapSettings,
  maxMessages = 55,
): Promise<ParsedPaymentEmail[]> {
  if (!cfg.email || !cfg.appPassword) {
    return [];
  }

  const client = createImapClient(cfg);
  const emails: ParsedPaymentEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const uidsResult = await client.search({ since }, { uid: true });
      if (!Array.isArray(uidsResult) || uidsResult.length === 0) {
        return [];
      }

      const recentUids = uidsResult.slice(-maxMessages).reverse();
      for await (const msg of client.fetch(recentUids, { source: true }, { uid: true })) {
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || '';
        const from = parsed.from?.text || '';
        const textBody = parsed.text || '';
        const htmlBody = typeof parsed.html === 'string' ? stripHtml(parsed.html) : '';
        const bodyText = `${subject}\n${from}\n${textBody}\n${htmlBody}`.replace(/\s+/g, ' ').trim();

        emails.push({
          uid: msg.uid,
          subject,
          from,
          date: parsed.date ? parsed.date.toISOString() : '',
          bodyText,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  return emails.sort((a, b) => b.uid - a.uid);
}

/**
 * Extracts all bank UTRs (12-digit numeric) and FamPay/UPI Payment IDs from an email
 * so every identifier linked to a verified FamPay receipt is permanently marked used
 * (preventing the same email from ever being verified twice using a different ID).
 */
export function extractPaymentIdentifiers(bodyText: string): string[] {
  const found = new Set<string>();
  const text = String(bodyText || '');

  // 12-digit standard UPI UTR / RRN
  const twelveDigitRegex = /(?:^|[^0-9])([0-9]{12})(?:[^0-9]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = twelveDigitRegex.exec(text)) !== null) {
    const norm = normalizeUtr(m[1]);
    if (norm.length === 12) found.add(norm);
  }

  // Labeled UTR / RRN / Payment ID / Transaction ID / Reference ID fields in FamPay receipts
  const labeledRegex =
    /(?:utr|rrn|payment\s*id|transaction\s*id|txn\s*id|ref(?:erence)?\s*(?:id|no\.?|number)?|order\s*id)\s*[:#\-]?\s*([A-Z0-9][A-Z0-9\-_]{5,34})/gi;
  while ((m = labeledRegex.exec(text)) !== null) {
    const norm = normalizeUtr(m[1]);
    if (norm.length >= 6 && /\d/.test(norm)) {
      found.add(norm);
    }
  }

  // Common FamPay / UPI prefixed transaction tokens (FMP..., FP..., FAM..., UPI..., T24..., P2M...)
  const prefixedRegex = /(?:^|[^A-Za-z0-9])((?:FMP|FAM|FP|UPI|P2M|TXN|T2\d)[A-Z0-9\-_]{5,30})(?:[^A-Za-z0-9]|$)/gi;
  while ((m = prefixedRegex.exec(text)) !== null) {
    const norm = normalizeUtr(m[1]);
    if (norm.length >= 8 && /\d/.test(norm)) {
      found.add(norm);
    }
  }

  return Array.from(found);
}

function matchStandaloneToken(bodyText: string, rawToken: string): boolean {
  const clean = rawToken.trim();
  const canonical = normalizeUtr(clean);
  if (canonical.length < 6) return false;

  const exactRegex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(clean)}([^a-z0-9]|$)`, 'i');
  if (exactRegex.test(bodyText)) return true;

  // Allow formatted tokens with spaces, dashes, or underscores (e.g. "FMP-1234 5678") without substring spoofing
  const flexiblePattern = canonical
    .split('')
    .map((ch) => escapeRegExp(ch))
    .join('[\\s\\-_]?');
  const flexibleRegex = new RegExp(`(^|[^a-z0-9])${flexiblePattern}([^a-z0-9]|$)`, 'i');
  return flexibleRegex.test(bodyText);
}

export function doesEmailMatchPayment(
  email: ParsedPaymentEmail,
  targetUtr: string,
  targetAmount: number,
  senderFilter: string,
  targetInvoiceId?: string,
  requireInvoiceMatch = false,
): boolean {
  const canonicalUtr = normalizeUtr(targetUtr);
  if (canonicalUtr.length < 6 || targetAmount <= 0) return false;

  const filterKeywords = senderFilter
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (filterKeywords.length > 0) {
    const haystack = `${email.from} ${email.subject} ${email.bodyText}`.toLowerCase();
    const matchedFilter = filterKeywords.some((kw) => haystack.includes(kw));
    if (!matchedFilter) return false;
  }

  // Exact standalone UTR / FamPay Payment ID match
  if (!matchStandaloneToken(email.bodyText, targetUtr)) {
    return false;
  }

  // Invoice ID / Payment Note verification for FamPay
  const cleanInv = normalizeUtr(targetInvoiceId || '');
  if (cleanInv.length >= 6) {
    const hasExpectedInvoice = matchStandaloneToken(email.bodyText, cleanInv);
    if (!hasExpectedInvoice) {
      if (requireInvoiceMatch) {
        return false;
      }
      // Even when soft-mode is enabled, reject if the email explicitly carries a DIFFERENT ATG invoice ID
      const otherInvoiceMatch = email.bodyText.match(/(?:^|[^A-Z0-9])(ATG[A-Z0-9]{5,14})(?:[^A-Z0-9]|$)/i);
      if (otherInvoiceMatch && normalizeUtr(otherInvoiceMatch[1]) !== cleanInv) {
        return false;
      }
    }
  }

  // Exact INR / payment amount match near currency symbol or payment keywords
  const amountPatterns = [
    /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
    /(?:amount|amt|credited|received|paid|deposited|payment of|sum of)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
  ];

  for (const regex of amountPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(email.bodyText)) !== null) {
      const numeric = parseFloat(match[1].replace(/,/g, ''));
      if (!Number.isNaN(numeric) && Math.abs(numeric - targetAmount) < 0.01) {
        return true;
      }
    }
  }

  return false;
}

export async function verifySingleDepositViaImap(
  cfg: ServerImapSettings,
  utr: string,
  amount: number,
  excludeUids?: Set<number>,
  invoiceId?: string,
): Promise<{
  matched: boolean;
  matchedSubject?: string;
  matchedUid?: number;
  extractedIds?: string[];
}> {
  const emails = await fetchRecentPaymentEmails(cfg, 55);
  const found = emails.find(
    (e) =>
      (!excludeUids || !excludeUids.has(e.uid)) &&
      doesEmailMatchPayment(
        e,
        utr,
        amount,
        cfg.senderFilter || '',
        invoiceId,
        Boolean(cfg.requireInvoiceMatch),
      ),
  );
  return found
    ? {
        matched: true,
        matchedSubject: found.subject,
        matchedUid: found.uid,
        extractedIds: extractPaymentIdentifiers(found.bodyText),
      }
    : { matched: false };
}
