import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { ServerImapSettings } from './store.ts';

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

export function doesEmailMatchPayment(
  email: ParsedPaymentEmail,
  targetUtr: string,
  targetAmount: number,
  senderFilter: string,
): boolean {
  const cleanUtr = targetUtr.trim();
  const canonicalUtr = cleanUtr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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

  // Exact standalone UTR / Reference ID match (also allows spaces or dashes inside formatted UTRs while preventing substring spoofing)
  const utrRegex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(cleanUtr)}([^a-z0-9]|$)`, 'i');
  let utrMatched = utrRegex.test(email.bodyText);
  if (!utrMatched) {
    // Allow formatted tokens like "1234 5678 9012" or "1234-5678-9012" matching "123456789012"
    const spacedPattern = canonicalUtr
      .split('')
      .map((ch) => escapeRegExp(ch))
      .join('[\\s\\-]?');
    const spacedRegex = new RegExp(`(^|[^a-z0-9])${spacedPattern}([^a-z0-9]|$)`, 'i');
    utrMatched = spacedRegex.test(email.bodyText);
  }
  if (!utrMatched) {
    return false;
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
): Promise<{ matched: boolean; matchedSubject?: string; matchedUid?: number }> {
  const emails = await fetchRecentPaymentEmails(cfg, 55);
  const found = emails.find(
    (e) =>
      (!excludeUids || !excludeUids.has(e.uid)) &&
      doesEmailMatchPayment(e, utr, amount, cfg.senderFilter || ''),
  );
  return found ? { matched: true, matchedSubject: found.subject, matchedUid: found.uid } : { matched: false };
}
