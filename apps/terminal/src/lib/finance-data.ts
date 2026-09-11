// ─── Seed Finance Data ────────────────────────────────────────────────────────
// Hardcoded purchase history from the user's CSV export.

export interface FinanceTransaction {
  id: string;
  date: string;
  firm: string;
  challengeName?: string;
  type: "purchase" | "payout" | "refund" | "adjustment";
  amountUSD: string;
  bankVerified: boolean;
  invoiceNumber?: string;
  purchaseId?: string;
}

export const SEED_PURCHASES: FinanceTransaction[] = [
  {
    id: "urn:prp-purchase:2nwaphFeke3u",
    date: "2026-08-24T18:05:00.000Z",
    firm: "Propr",
    challengeName: "Starter 1-Step Turbo",
    type: "purchase",
    amountUSD: "17.50",
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
    amountUSD: "25.00",
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
    amountUSD: "18.75",
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
    amountUSD: "18.75",
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
    amountUSD: "18.75",
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
    amountUSD: "45.00",
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
    amountUSD: "25.00",
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
    amountUSD: "50.00",
    bankVerified: true,
    invoiceNumber: "INV-72VSRitse27t",
    purchaseId: "urn:prp-purchase:72VSRitse27t",
  },
];
