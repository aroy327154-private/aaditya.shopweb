import { normalizeUtr } from './store.ts';

export interface BharatpeTransaction {
  txId: string;
  bankReferenceNo: string;
  amount: number;
  status: string;
  payerName: string;
  timestamp: string;
}

export interface BharatpeCredentials {
  merchantId: string;
  token: string;
}

const BHARATPE_TRANSACTIONS_ENDPOINT =
  'https://payments-tesseract.bharatpe.in/api/v1/merchant/transactions';

function isSuccessfulStatus(rawStatus: unknown): boolean {
  if (rawStatus === true) return true;
  const norm = String(rawStatus || '')
    .trim()
    .toUpperCase();
  if (!norm) return true; // Some BharatPe responses omit status on settled QR credit entries
  return (
    norm === 'SUCCESS' ||
    norm === 'SUCCESSFUL' ||
    norm === 'COMPLETED' ||
    norm === 'SETTLED' ||
    norm === 'CREDITED' ||
    norm === 'PAID' ||
    norm === 'CAPTURED'
  );
}

function parseTransactionItem(raw: unknown): BharatpeTransaction | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const rawRef =
    item.bankReferenceNo ??
    item.utr ??
    item.rrn ??
    item.upiRefNo ??
    item.referenceNumber ??
    item.bankRefNo ??
    '';
  const rawTxId =
    item.id ??
    item.transactionId ??
    item.txnId ??
    item.paymentId ??
    item.orderId ??
    rawRef ??
    '';
  const rawAmount = item.amount ?? item.txnAmount ?? item.transactionAmount ?? item.value ?? 0;
  const numericAmount =
    typeof rawAmount === 'number'
      ? rawAmount
      : parseFloat(String(rawAmount).replace(/[^0-9.]/g, ''));

  const bankReferenceNo = String(rawRef || '').trim();
  const txId = String(rawTxId || '').trim();
  if ((!bankReferenceNo && !txId) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  return {
    txId: txId || bankReferenceNo,
    bankReferenceNo,
    amount: Math.round(numericAmount * 100) / 100,
    status: String(item.status ?? item.txnStatus ?? 'SUCCESS').trim(),
    payerName: String(item.payerName ?? item.customerName ?? item.senderName ?? '').trim(),
    timestamp: String(item.paymentTimestamp ?? item.createdAt ?? item.transactionTime ?? '').trim(),
  };
}

function extractTransactionList(payload: unknown): BharatpeTransaction[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : null;

  const candidates: unknown[] = [];
  if (data && Array.isArray(data.transactions)) {
    candidates.push(...data.transactions);
  } else if (Array.isArray(root.transactions)) {
    candidates.push(...root.transactions);
  } else if (data && Array.isArray(data.list)) {
    candidates.push(...data.list);
  } else if (Array.isArray(root.data)) {
    candidates.push(...root.data);
  }

  const parsed: BharatpeTransaction[] = [];
  for (const row of candidates) {
    const tx = parseTransactionItem(row);
    if (tx) parsed.push(tx);
  }
  return parsed;
}

export async function fetchBharatpeTransactions(
  creds: BharatpeCredentials,
  lookbackDays = 3,
): Promise<BharatpeTransaction[]> {
  const mid = String(creds.merchantId || '').trim();
  const token = String(creds.token || '').trim();
  if (!mid || !token) {
    throw new Error('BharatPe Merchant ID and API Token are required');
  }

  const nowMs = Date.now();
  const sDate = nowMs - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000;
  const eDate = nowMs + 5 * 60 * 1000;

  const url = new URL(BHARATPE_TRANSACTIONS_ENDPOINT);
  url.searchParams.set('module', 'PAYMENT_QR');
  url.searchParams.set('merchantId', mid);
  url.searchParams.set('sDate', String(sDate));
  url.searchParams.set('eDate', String(eDate));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        token,
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('BharatPe token is invalid or expired. Please paste a fresh Merchant Token.');
    }
    if (!res.ok) {
      const msg =
        (typeof parsed.message === 'string' && parsed.message) ||
        (typeof parsed.error === 'string' && parsed.error) ||
        `BharatPe API returned HTTP ${res.status}`;
      throw new Error(msg);
    }

    if (parsed.status === false || parsed.responseCode === 401 || parsed.responseCode === 403) {
      const msg =
        (typeof parsed.message === 'string' && parsed.message) ||
        'BharatPe rejected the request — check Merchant ID and Token.';
      throw new Error(msg);
    }

    return extractTransactionList(parsed);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('BharatPe verification timed out. Please retry.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function testBharatpeConnection(
  creds: BharatpeCredentials,
): Promise<{ ok: true; count: number; detail: string }> {
  const list = await fetchBharatpeTransactions(creds, 3);
  return {
    ok: true,
    count: list.length,
    detail: `Connected to BharatPe Merchant ${creds.merchantId.trim()} · ${list.length} recent QR transaction(s) found`,
  };
}

export function doesBharatpeTxMatchDeposit(
  tx: BharatpeTransaction,
  targetUtr: string,
  targetAmount: number,
): boolean {
  if (!isSuccessfulStatus(tx.status)) return false;
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return false;
  if (Math.abs(tx.amount - targetAmount) >= 0.01) return false;

  const normTarget = normalizeUtr(targetUtr);
  if (normTarget.length < 6) return false;

  const normRef = normalizeUtr(tx.bankReferenceNo);
  const normTxId = normalizeUtr(tx.txId);

  return (Boolean(normRef) && normRef === normTarget) || (Boolean(normTxId) && normTxId === normTarget);
}

export async function verifySingleDepositViaBharatpe(
  creds: BharatpeCredentials,
  utr: string,
  amount: number,
  excludeTxIds?: Set<string>,
): Promise<{
  matched: boolean;
  matchedTxId?: string;
  matchedBankRef?: string;
  payerName?: string;
}> {
  const list = await fetchBharatpeTransactions(creds, 3);
  const found = list.find((tx) => {
    const normId = normalizeUtr(tx.txId);
    if (excludeTxIds && normId && excludeTxIds.has(normId)) return false;
    return doesBharatpeTxMatchDeposit(tx, utr, amount);
  });

  if (!found) return { matched: false };
  return {
    matched: true,
    matchedTxId: normalizeUtr(found.txId) || normalizeUtr(found.bankReferenceNo),
    matchedBankRef: found.bankReferenceNo || found.txId,
    payerName: found.payerName,
  };
}
