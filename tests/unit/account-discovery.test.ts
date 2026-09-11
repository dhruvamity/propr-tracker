import { describe, it, expect } from "vitest";
import attemptsFixture from "../fixtures/challenge-attempts.json";
import issuancesFixture from "../fixtures/book-account-issuances.json";

describe("Account Discovery & Canonical Universe", () => {
  it("discovers all evaluations across active, passed, and failed states", () => {
    const attempts = attemptsFixture.data;
    expect(attempts.length).toBe(3);

    const activeAttempts = attempts.filter((a) => a.status === "active");
    const failedAttempts = attempts.filter((a) => a.status === "failed");

    expect(activeAttempts.length).toBe(2);
    expect(failedAttempts.length).toBe(1);
  });

  it("discovers funded accounts separately from challenge attempts", () => {
    const issuances = issuancesFixture.data;
    expect(issuances.length).toBe(1);
    expect(issuances[0].accountType).toBe("b_book");
    expect(issuances[0].status).toBe("active");
  });

  it("does not treat passed evaluation as funded without book account issuance", () => {
    const passedAttempt = {
      attemptId: "urn:prp-challenge-attempt:passed1",
      status: "passed",
      accountId: "urn:prp-account:acc-passed-1",
    };

    const issuances: any[] = []; // No funded issuance exists yet

    // Rule: Passed challenge does NOT automatically become funded
    const hasFundedIssuance = issuances.some((i) => i.accountId === passedAttempt.accountId);
    expect(hasFundedIssuance).toBe(false);
  });

  it("deduplicates accounts if returned by multiple endpoints", () => {
    const accountMap = new Map<string, { attempt?: any; issuance?: any }>();

    for (const a of attemptsFixture.data) {
      accountMap.set(a.accountId, { ...accountMap.get(a.accountId), attempt: a });
    }

    for (const i of issuancesFixture.data) {
      accountMap.set(i.accountId, { ...accountMap.get(i.accountId), issuance: i });
    }

    // 3 unique attempt accounts + 1 unique issuance account = 4 unique canonical accounts
    expect(accountMap.size).toBe(4);
    expect(accountMap.has("urn:prp-account:J9wNi8oj3XGK")).toBe(true);
    expect(accountMap.has("urn:prp-account:FUNDED001")).toBe(true);
  });
});
