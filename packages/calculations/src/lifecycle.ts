// ─── Account Lifecycle Engine ──────────────────────────────────────────────────
// Determines the AccountStage for an account based on challenge attempt
// and funded issuance data. Never infers "funded" from challenge status alone.

import type {
  AccountStage,
  AccountSource,
  ProprChallengeAttempt,
  ProprFundedIssuance,
} from "@propr/data-model";

/**
 * Derive the account stage from a challenge attempt.
 * Does NOT infer FUNDED; use funded issuance data for that.
 */
export function deriveChallengeStage(
  attempt: Pick<ProprChallengeAttempt, "status">
): AccountStage {
  switch (attempt.status) {
    case "active":
      return "EVALUATION";
    case "passed":
      return "PASSED";
    case "failed":
      return "FAILED";
    default:
      return "UNKNOWN";
  }
}

/**
 * Derive the account stage from a funded account issuance.
 */
export function deriveFundedStage(
  issuance: Pick<ProprFundedIssuance, "status">
): AccountStage {
  switch (issuance.status) {
    case "active":
      return "FUNDED";
    case "closed":
      return "CLOSED";
    case "review_pending":
      return "REVIEW_PENDING";
    default:
      return "UNKNOWN";
  }
}

/**
 * Determine the primary stage and source for an account.
 *
 * An account can appear in both challenge attempts (as PASSED)
 * and funded issuances (as FUNDED/CLOSED). The funded issuance
 * takes precedence because it represents the current state.
 *
 * Priority:
 *   1. Funded issuance (if exists) → FUNDED / CLOSED / REVIEW_PENDING
 *   2. Challenge attempt → EVALUATION / PASSED / FAILED
 */
export function deriveAccountStage(
  challengeAttempt?: Pick<ProprChallengeAttempt, "status"> | null,
  fundedIssuance?: Pick<ProprFundedIssuance, "status"> | null
): { stage: AccountStage; source: AccountSource } {
  // Funded issuance takes precedence
  if (fundedIssuance) {
    return {
      stage: deriveFundedStage(fundedIssuance),
      source: "funded_issuance",
    };
  }

  // Fall back to challenge attempt
  if (challengeAttempt) {
    return {
      stage: deriveChallengeStage(challengeAttempt),
      source: "challenge_attempt",
    };
  }

  return { stage: "UNKNOWN", source: "challenge_attempt" };
}

/**
 * Determine the display status for an evaluation account.
 * Uses configurable thresholds for "near breach" / "near target".
 */
export function deriveEvaluationStatus(
  stage: AccountStage,
  drawdownUsedPercent: number,
  profitTargetProgress: number,
  nearBreachThreshold: number = 80, // configurable, default 80%
  nearTargetThreshold: number = 80
):
  | "ACTIVE"
  | "NEAR_TARGET"
  | "NEAR_BREACH"
  | "PASSED"
  | "FAILED"
  | "BREACHED" {
  if (stage === "PASSED") return "PASSED";
  if (stage === "FAILED" || stage === "BREACHED") return "FAILED";

  // Check near-breach first (more critical)
  if (drawdownUsedPercent >= nearBreachThreshold) return "NEAR_BREACH";
  if (profitTargetProgress >= nearTargetThreshold) return "NEAR_TARGET";

  return "ACTIVE";
}

/**
 * Sort accounts by lifecycle priority.
 * Returns a sort key (lower = higher priority).
 */
export function getAccountSortPriority(stage: AccountStage): number {
  const priorities: Record<AccountStage, number> = {
    FUNDED: 0,
    EVALUATION: 1,
    PASSED: 2,
    REVIEW_PENDING: 3,
    FAILED: 4,
    BREACHED: 5,
    CLOSED: 6,
    UNKNOWN: 7,
  };
  return priorities[stage] ?? 99;
}
