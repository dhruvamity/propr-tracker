import { describe, it, expect } from "vitest";
import { reconcileDynamicPurchases, SEED_PURCHASES } from "@propr/finance";
import type { FinanceTransaction } from "@propr/data-model";

describe("Dynamic Purchase Ingestion & Reconciliation", () => {
  it("falls back to verified transactions when purchases list is empty", () => {
    const ledger = reconcileDynamicPurchases([], []);
    expect(ledger.length).toBe(SEED_PURCHASES.length);
    expect(ledger).toEqual(SEED_PURCHASES);
  });

  it("reconciles historical purchases with bank-verified amounts while ingesting new purchases dynamically", () => {
    const rawPurchases = [
      // Historical verified purchase
      {
        purchaseId: "urn:prp-purchase:2nwaphFeke3u",
        createdAt: "2026-08-24T18:05:59.509Z",
        status: "completed",
        subtotal: "25",
        discount: "7.5",
        total: "17.5",
        product: { challenge: { name: { en: "Starter 1-Step Turbo" } } },
      },
      // Brand new purchase from Sep 12 with 20% discount ($5 off $25)
      {
        purchaseId: "urn:prp-purchase:ekYYtJ2H9dBB",
        createdAt: "2026-09-12T20:19:58.735Z",
        status: "completed",
        subtotal: "25",
        discount: "5",
        total: "20",
        product: { challenge: { name: { en: "Starter 1-Step Turbo" } } },
      },
      // Brand new purchase from Sep 13 with 20% discount ($5 off $25)
      {
        purchaseId: "urn:prp-purchase:tbvMvV15PoGu",
        createdAt: "2026-09-13T08:00:01.903Z",
        status: "completed",
        subtotal: "25",
        discount: "5",
        total: "20",
        product: { challenge: { name: { en: "Starter 1-Step Turbo" } } },
      },
    ];

    const rawAttempts = [
      {
        accountId: "urn:prp-account:B7KaXYv9iAqi",
        purchaseId: "urn:prp-purchase:2nwaphFeke3u",
        status: "failed",
      },
      {
        accountId: "urn:prp-account:HADQVVKUPxqx",
        purchaseId: "urn:prp-purchase:ekYYtJ2H9dBB",
        status: "active",
      },
      {
        accountId: "urn:prp-account:EaHZWRRSmqaX",
        purchaseId: "urn:prp-purchase:tbvMvV15PoGu",
        status: "active",
      },
    ];

    const effectiveRate = "97.82";
    const ledger = reconcileDynamicPurchases(
      rawPurchases,
      rawAttempts,
      effectiveRate,
      SEED_PURCHASES
    );

    // 1. Verify historical purchase retains exact verified bank debit (1734.40)
    const historicalTx = ledger.find((t) => t.id === "urn:prp-purchase:2nwaphFeke3u");
    expect(historicalTx).toBeDefined();
    expect(historicalTx?.bankVerified).toBe(true);
    expect(historicalTx?.actualCashCostINR).toBe(SEED_PURCHASES[0].actualCashCostINR);
    expect(historicalTx?.amountUSD).toBe("17.5");
    expect(historicalTx?.purchaseFaceValueUSD).toBe("25");
    expect(historicalTx?.accountId).toBe("urn:prp-account:B7KaXYv9iAqi");

    // 2. Verify new purchase 1 (ekYYtJ2H9dBB) calculates dynamic INR: 20 * 97.82 = 1956.40
    const newTx1 = ledger.find((t) => t.id === "urn:prp-purchase:ekYYtJ2H9dBB");
    expect(newTx1).toBeDefined();
    expect(newTx1?.bankVerified).toBe(false);
    expect(newTx1?.amountUSD).toBe("20");
    expect(newTx1?.purchaseFaceValueUSD).toBe("25");
    expect(newTx1?.actualCashCostINR).toBe("1956.40");
    expect(newTx1?.amountINR).toBe("1956.40");
    expect(newTx1?.accountId).toBe("urn:prp-account:HADQVVKUPxqx");
    expect(newTx1?.notes).toContain("$5 discount applied");

    // 3. Verify new purchase 2 (tbvMvV15PoGu) calculates dynamic INR: 20 * 97.82 = 1956.40
    const newTx2 = ledger.find((t) => t.id === "urn:prp-purchase:tbvMvV15PoGu");
    expect(newTx2).toBeDefined();
    expect(newTx2?.bankVerified).toBe(false);
    expect(newTx2?.amountUSD).toBe("20");
    expect(newTx2?.purchaseFaceValueUSD).toBe("25");
    expect(newTx2?.actualCashCostINR).toBe("1956.40");
    expect(newTx2?.accountId).toBe("urn:prp-account:EaHZWRRSmqaX");

    // 4. Verify Breakout external transaction is preserved
    const breakoutTx = ledger.find((t) => t.firm.toLowerCase() === "breakout");
    expect(breakoutTx).toBeDefined();
    expect(breakoutTx?.actualCashCostINR).toBe("3835.25");
  });

  it("handles unallocated/pending purchases without crashing", () => {
    const rawPurchases = [
      {
        purchaseId: "urn:prp-purchase:kqS36N56d3A5",
        createdAt: "2026-09-12T20:18:24.934Z",
        status: "completed",
        subtotal: "50",
        discount: "10",
        total: "40",
        product: { challenge: { name: { en: "Explorer 1-Step Turbo" } } },
      },
    ];

    // No attempt exists yet for this purchase
    const ledger = reconcileDynamicPurchases(rawPurchases, [], "97.82", []);
    expect(ledger.length).toBe(1);
    expect(ledger[0].purchaseId).toBe("urn:prp-purchase:kqS36N56d3A5");
    expect(ledger[0].accountId).toBeUndefined();
    expect(ledger[0].amountUSD).toBe("40");
    expect(ledger[0].purchaseFaceValueUSD).toBe("50");
    expect(ledger[0].actualCashCostINR).toBe("3912.80"); // 40 * 97.82
  });
});
