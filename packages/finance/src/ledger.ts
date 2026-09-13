// ─── Finance Ledger ───────────────────────────────────────────────────────────
// CSV import, payout ingestion, and ledger management.

import type {
  FinanceTransaction,
  PayoutRecord,
  DecimalString,
} from "@propr/data-model";
import { ds, toDecimal } from "@propr/data-model";

/**
 * Parse a purchase history CSV (Propr export format) into FinanceTransactions.
 *
 * Expected CSV format:
 * Date,Challenge,Amount,Currency,Invoice Number,Purchase ID
 * "Sep 8, 2026, 07:08 PM","Explorer 1-Step Turbo","50.00","USD","INV-xxx","urn:prp-purchase:xxx"
 */
export function parsePurchaseHistoryCsv(
  csvContent: string
): FinanceTransaction[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header
  const transactions: FinanceTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with quoted fields
    const fields = parseCSVLine(line);
    if (fields.length < 6) continue;

    const [date, challenge, amount, currency, invoiceNumber, purchaseId] =
      fields;

    transactions.push({
      id: purchaseId || `purchase-${i}`,
      date: normalizeDate(date),
      firm: "Propr",
      challengeName: challenge,
      type: "purchase",
      amountUSD: ds(amount) as DecimalString,
      bankVerified: false, // Default to unverified; user can mark as verified
      invoiceNumber,
      purchaseId,
      notes: `${challenge} (${currency})`,
    });
  }

  return transactions;
}

/**
 * Convert processed Propr payouts into FinanceTransactions.
 * Only processed payouts count as actual withdrawn cash.
 */
export function payoutsToTransactions(
  payouts: PayoutRecord[]
): FinanceTransaction[] {
  return payouts
    .filter((p) => p.status === "processed")
    .map((p) => ({
      id: p.payoutId,
      date: p.processedAt || p.createdAt,
      firm: "Propr",
      accountId: p.accountId,
      type: "payout" as const,
      amountUSD: (p.userAmount || p.amount) as DecimalString,
      bankVerified: true, // On-chain payouts are verified
      payoutId: p.payoutId,
      notes: `Payout ${p.reason} (tx: ${p.txHash || "N/A"})`,
    }));
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

/**
 * Normalize various date formats to ISO 8601.
 */
function normalizeDate(dateStr: string): string {
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toISOString();
  } catch {
    return dateStr;
  }
}

/**
 * Initial seed data from purchase history CSV.
 * Baseline purchases; the user can add more via the UI.
 */
export const SEED_PURCHASES: FinanceTransaction[] = [
  {
    id: "urn:prp-purchase:2nwaphFeke3u",
    date: "2026-08-24T18:05:00.000Z",
    cashTransactionDate: "2026-08-24",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("17.50"),
    purchaseFaceValueUSD: ds("17.50"),
    amountINR: ds("1734.40"),
    actualCashCostINR: ds("1734.40"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/24-08-2026",
    invoiceNumber: "INV-2nwaphFeke3u",
    purchaseId: "urn:prp-purchase:2nwaphFeke3u",
    accountId: "urn:prp-account:B7KaXYv9iAqi",
  },
  {
    id: "urn:prp-purchase:BJGShMyjjAxc",
    date: "2026-08-28T04:25:00.000Z",
    cashTransactionDate: "2026-08-28",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("25.00"),
    purchaseFaceValueUSD: ds("25.00"),
    amountINR: ds("2472.88"),
    actualCashCostINR: ds("2472.88"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/28-08-2026",
    invoiceNumber: "INV-BJGShMyjjAxc",
    purchaseId: "urn:prp-purchase:BJGShMyjjAxc",
    accountId: "urn:prp-account:dSkvRiZ3y9rs",
  },
  {
    id: "urn:prp-purchase:QHGq75m2TujF",
    date: "2026-08-29T19:30:00.000Z",
    cashTransactionDate: "2026-08-29",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("18.75"),
    purchaseFaceValueUSD: ds("18.75"),
    amountINR: ds("1854.83"),
    actualCashCostINR: ds("1854.83"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/29-08-2026-1",
    invoiceNumber: "INV-QHGq75m2TujF",
    purchaseId: "urn:prp-purchase:QHGq75m2TujF",
    accountId: "urn:prp-account:aqVC1mX1uN2G",
  },
  {
    id: "urn:prp-purchase:xyER4EuvX8mz",
    date: "2026-08-29T19:32:00.000Z",
    cashTransactionDate: "2026-08-29",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("18.75"),
    purchaseFaceValueUSD: ds("18.75"),
    amountINR: ds("1854.83"),
    actualCashCostINR: ds("1854.83"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/29-08-2026-2",
    invoiceNumber: "INV-xyER4EuvX8mz",
    purchaseId: "urn:prp-purchase:xyER4EuvX8mz",
    accountId: "urn:prp-account:f5GC6SREBdAJ",
  },
  {
    id: "urn:prp-purchase:kFEec3h7ALkd",
    date: "2026-08-29T19:52:00.000Z",
    cashTransactionDate: "2026-08-30",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("18.75"),
    purchaseFaceValueUSD: ds("18.75"),
    amountINR: ds("1854.83"),
    actualCashCostINR: ds("1854.83"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-1",
    invoiceNumber: "INV-kFEec3h7ALkd",
    purchaseId: "urn:prp-purchase:kFEec3h7ALkd",
    accountId: "urn:prp-account:qeBHuFFg5gMw",
  },
  {
    id: "urn:prp-purchase:LnHF1xAbJvGd",
    date: "2026-08-30T18:08:00.000Z",
    cashTransactionDate: "2026-08-30",
    firm: "Propr",
    challengeName: "Starter 1-Step Classic",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("45.00"),
    purchaseFaceValueUSD: ds("45.00"),
    amountINR: ds("4451.62"),
    actualCashCostINR: ds("4451.62"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-2",
    invoiceNumber: "INV-LnHF1xAbJvGd",
    purchaseId: "urn:prp-purchase:LnHF1xAbJvGd",
    accountId: "urn:prp-account:R5gEZ1R363NC",
  },
  {
    id: "urn:prp-purchase:PPWG9RNxz4eF",
    date: "2026-09-05T19:56:00.000Z",
    cashTransactionDate: "2026-09-06",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("25.00"),
    purchaseFaceValueUSD: ds("25.00"),
    amountINR: ds("2445.95"),
    actualCashCostINR: ds("2445.95"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/06-09-2026",
    invoiceNumber: "INV-PPWG9RNxz4eF",
    purchaseId: "urn:prp-purchase:PPWG9RNxz4eF",
    accountId: "urn:prp-account:4D8XWuQ3fju6",
  },
  {
    id: "urn:brk-purchase:20260907",
    date: "2026-09-07T11:00:00.000Z",
    cashTransactionDate: "2026-09-07",
    firm: "Breakout",
    challengeName: "Breakout Evaluation",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("0.00"),
    purchaseFaceValueUSD: ds("0.00"),
    amountINR: ds("3835.25"),
    actualCashCostINR: ds("3835.25"),
    bankVerified: true,
    bankReference: "PRCR/BREAKOUTPROP.COM/Wilmington/07-09-2026",
    invoiceNumber: "INV-BRK-20260907",
    purchaseId: "urn:brk-purchase:20260907",
    accountId: "HISTORICAL / UNIDENTIFIED",
    notes: "Breakout Evaluation (Verified Bank Debit)",
  },
  {
    id: "urn:prp-purchase:72VSRitse27t",
    date: "2026-09-08T13:38:00.000Z",
    cashTransactionDate: "2026-09-08",
    firm: "Propr",
    challengeName: "Explorer 1-Step Turbo",
    type: "purchase",
    transactionType: "purchase",
    amountUSD: ds("50.00"),
    purchaseFaceValueUSD: ds("50.00"),
    amountINR: ds("4890.24"),
    actualCashCostINR: ds("4890.24"),
    bankVerified: true,
    bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/08-09-2026",
    invoiceNumber: "INV-72VSRitse27t",
    purchaseId: "urn:prp-purchase:72VSRitse27t",
    accountId: "urn:prp-account:J9wNi8oj3XGK",
  },
];

/**
 * Dynamic reconciliation of raw Propr API purchases with challenge attempts and verified bank transactions.
 */
export function reconcileDynamicPurchases(
  purchasesRaw: Array<Record<string, unknown>>,
  attemptsRaw: Array<Record<string, unknown>>,
  effectiveRate: string = "97.82",
  verifiedTransactions: FinanceTransaction[] = SEED_PURCHASES
): FinanceTransaction[] {
  if (!purchasesRaw || purchasesRaw.length === 0) {
    return verifiedTransactions;
  }

  const verifiedByPurchaseId = new Map<string, FinanceTransaction>();
  for (const tx of verifiedTransactions) {
    if (tx.purchaseId) verifiedByPurchaseId.set(tx.purchaseId, tx);
    if (tx.id) verifiedByPurchaseId.set(tx.id, tx);
  }

  // Attempt lookup: purchaseId -> attempt
  const attemptByPurchaseId = new Map<string, Record<string, unknown>>();
  for (const a of attemptsRaw) {
    if (a.purchaseId) {
      attemptByPurchaseId.set(a.purchaseId as string, a);
    }
  }

  const dynamicLedger: FinanceTransaction[] = [];
  const processedPurchaseIds = new Set<string>();

  for (const p of purchasesRaw) {
    const purchaseId = p.purchaseId as string;
    if (!purchaseId) continue;
    processedPurchaseIds.add(purchaseId);

    const verified = verifiedByPurchaseId.get(purchaseId);
    const attempt = attemptByPurchaseId.get(purchaseId);
    const accountId = (attempt?.accountId as string) || verified?.accountId;

    const challenge = (p.product as Record<string, unknown> | undefined)?.challenge as Record<string, unknown> | undefined;
    const rawName = challenge?.name || (p.product as Record<string, unknown> | undefined)?.name;
    const challengeName =
      typeof rawName === "object" && rawName !== null
        ? (rawName as Record<string, string>).en || Object.values(rawName as Record<string, string>)[0]
        : (rawName as string) || verified?.challengeName || "Starter 1-Step Turbo";

    const subtotal = String(p.subtotal ?? (p.price as Record<string, unknown> | undefined)?.price ?? verified?.purchaseFaceValueUSD ?? "0");
    const discount = String(p.discount ?? "0");
    const total = String(p.total ?? verified?.amountUSD ?? subtotal);
    const invoiceNumber = (p.invoiceNumber as string) || (p.invoiceId as string) || verified?.invoiceNumber || `INV-${purchaseId.replace("urn:prp-purchase:", "")}`;
    const date = normalizeDate((p.createdAt as string) || verified?.date || new Date().toISOString());

    if (verified && verified.bankVerified) {
      // Historical verified purchase: preserve exact bank statement debits
      dynamicLedger.push({
        ...verified,
        purchaseId,
        accountId: accountId || verified.accountId,
        challengeName: challengeName || verified.challengeName,
        purchaseFaceValueUSD: ds(subtotal) as DecimalString,
        amountUSD: ds(total) as DecimalString,
        invoiceNumber,
      });
    } else {
      // Dynamically ingested purchase using calibrated effective Paysagi rate
      const paidUSD = ds(total) as DecimalString;
      const faceUSD = ds(subtotal) as DecimalString;
      const computedINR = (toDecimal(total).times(toDecimal(effectiveRate))).toFixed(2) as DecimalString;

      dynamicLedger.push({
        id: purchaseId,
        date,
        cashTransactionDate: date.slice(0, 10),
        firm: "Propr",
        accountId,
        challengeName,
        type: "purchase",
        transactionType: "purchase",
        amountUSD: paidUSD,
        purchaseFaceValueUSD: faceUSD,
        amountINR: computedINR,
        actualCashCostINR: computedINR,
        bankVerified: false,
        invoiceNumber,
        purchaseId,
        notes: `${challengeName} (${toDecimal(discount).gt(0) ? `$${discount} discount applied - ` : ""}$${total} USD via Paysagi @ ₹${effectiveRate}/USD)`,
      });
    }
  }

  // Preserve non-Propr external transactions (e.g. Breakout) and any verified transactions not returned in the API list
  for (const tx of verifiedTransactions) {
    const isPropr = tx.firm.toLowerCase() === "propr";
    if (!isPropr || (tx.purchaseId && !processedPurchaseIds.has(tx.purchaseId) && !processedPurchaseIds.has(tx.id))) {
      dynamicLedger.push(tx);
    }
  }

  return dynamicLedger;
}

export { parsePurchaseHistoryCsv as parseCSV };
