// ─── Finance Ledger ───────────────────────────────────────────────────────────
// CSV import, payout ingestion, and ledger management.

import type {
  FinanceTransaction,
  PayoutRecord,
  DecimalString,
} from "@propr/data-model";
import { ds } from "@propr/data-model";

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
      bankVerified: true, // On-chain payouts are inherently verified
      payoutId: p.payoutId,
      notes: `Payout ${p.reason} — tx: ${p.txHash || "N/A"}`,
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
 * The initial seed data from the user's purchase history CSV.
 * This is hardcoded as the baseline — the user can add more via the UI.
 */
export const SEED_PURCHASES: FinanceTransaction[] = [
  {
    id: "urn:prp-purchase:2nwaphFeke3u",
    date: "2026-08-24T18:05:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("17.50"),
    bankVerified: true,
    invoiceNumber: "INV-2nwaphFeke3u",
    purchaseId: "urn:prp-purchase:2nwaphFeke3u",
  },
  {
    id: "urn:prp-purchase:BJGShMyjjAxc",
    date: "2026-08-28T04:25:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("25.00"),
    bankVerified: true,
    invoiceNumber: "INV-BJGShMyjjAxc",
    purchaseId: "urn:prp-purchase:BJGShMyjjAxc",
  },
  {
    id: "urn:prp-purchase:QHGq75m2TujF",
    date: "2026-08-29T19:30:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("18.75"),
    bankVerified: true,
    invoiceNumber: "INV-QHGq75m2TujF",
    purchaseId: "urn:prp-purchase:QHGq75m2TujF",
  },
  {
    id: "urn:prp-purchase:xyER4EuvX8mz",
    date: "2026-08-29T19:32:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("18.75"),
    bankVerified: true,
    invoiceNumber: "INV-xyER4EuvX8mz",
    purchaseId: "urn:prp-purchase:xyER4EuvX8mz",
  },
  {
    id: "urn:prp-purchase:kFEec3h7ALkd",
    date: "2026-08-29T19:52:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("18.75"),
    bankVerified: true,
    invoiceNumber: "INV-kFEec3h7ALkd",
    purchaseId: "urn:prp-purchase:kFEec3h7ALkd",
  },
  {
    id: "urn:prp-purchase:LnHF1xAbJvGd",
    date: "2026-08-30T18:08:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Classic",
    type: "purchase",
    amountUSD: ds("45.00"),
    bankVerified: true,
    invoiceNumber: "INV-LnHF1xAbJvGd",
    purchaseId: "urn:prp-purchase:LnHF1xAbJvGd",
  },
  {
    id: "urn:prp-purchase:PPWG9RNxz4eF",
    date: "2026-09-05T19:56:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("25.00"),
    bankVerified: true,
    invoiceNumber: "INV-PPWG9RNxz4eF",
    purchaseId: "urn:prp-purchase:PPWG9RNxz4eF",
  },
  {
    id: "urn:prp-purchase:72VSRitse27t",
    date: "2026-09-08T13:38:00.000Z",
    firm: "Propr",
    challengeName: "Explorer 1-Step Turbo",
    type: "purchase",
    amountUSD: ds("50.00"),
    bankVerified: true,
    invoiceNumber: "INV-72VSRitse27t",
    purchaseId: "urn:prp-purchase:72VSRitse27t",
  },
];

export { parsePurchaseHistoryCsv as parseCSV };
