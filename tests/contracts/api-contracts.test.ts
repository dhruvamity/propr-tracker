// ─── API Contracts Test Suite ──────────────────────────────────────────────────
// Validates Zod runtime schema contracts for Propr REST and WebSocket APIs.
// Ensures that missing fields, unexpected types, or payload mutations fail loudly.

import { describe, it, expect } from "vitest";
import {
  ProprChallengeAttemptSchema,
  ProprFundedIssuanceSchema,
  ProprPositionSchema,
  ProprOrderSchema,
  ProprPayoutSchema,
} from "@propr/data-model";
import challengeAttemptsFixture from "../fixtures/challenge-attempts.json";
import bookAccountIssuancesFixture from "../fixtures/book-account-issuances.json";
import positionsFixture from "../fixtures/positions.json";
import ordersFixture from "../fixtures/orders.json";
import payoutsFixture from "../fixtures/payouts.json";

describe("API Contract Verification: Zod Runtime Schemas", () => {
  it("validates all challenge attempts against ProprChallengeAttemptSchema", () => {
    for (const attempt of challengeAttemptsFixture.data) {
      const parsed = ProprChallengeAttemptSchema.safeParse(attempt);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(typeof parsed.data.attemptId).toBe("string");
        expect(typeof parsed.data.status).toBe("string");
      }
    }
  });

  it("validates all funded issuances against ProprFundedIssuanceSchema", () => {
    for (const issuance of bookAccountIssuancesFixture.data) {
      const parsed = ProprFundedIssuanceSchema.safeParse(issuance);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(typeof parsed.data.issuanceId).toBe("string");
        expect(typeof parsed.data.status).toBe("string");
      }
    }
  });

  it("validates positions against ProprPositionSchema", () => {
    for (const position of positionsFixture.data) {
      const parsed = ProprPositionSchema.safeParse(position);
      expect(parsed.success).toBe(true);
    }
  });

  it("validates orders against ProprOrderSchema", () => {
    for (const order of ordersFixture.data) {
      const parsed = ProprOrderSchema.safeParse(order);
      expect(parsed.success).toBe(true);
    }
  });

  it("validates payouts against ProprPayoutSchema", () => {
    for (const payout of payoutsFixture.data) {
      const parsed = ProprPayoutSchema.safeParse(payout);
      expect(parsed.success).toBe(true);
    }
  });

  it("fails loudly when contract is violated (e.g. attemptId missing)", () => {
    const corruptedAttempt = {
      ...challengeAttemptsFixture.data[0],
      attemptId: undefined, // required field removed
    };
    const parsed = ProprChallengeAttemptSchema.safeParse(corruptedAttempt);
    expect(parsed.success).toBe(false);
  });
});
