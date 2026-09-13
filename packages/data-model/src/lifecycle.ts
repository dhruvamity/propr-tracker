import type { AccountStage } from "./types";

/**
 * Predicate for accounts that are actively tradeable in the UI
 * (placing orders, open positions, live monitor, rules).
 * Only EVALUATION and FUNDED accounts allow active trading.
 */
export function isTradingActive(stage: AccountStage | string): boolean {
  return stage === "EVALUATION" || stage === "FUNDED";
}

/**
 * Predicate for accounts that represent deployed, active financial capital
 * (not yet realized as a loss/sunk cost or closed).
 * Includes EVALUATION, FUNDED, PASSED (pending funded issuance), and REVIEW_PENDING.
 */
export function isCashExposed(stage: AccountStage | string): boolean {
  return (
    stage === "EVALUATION" ||
    stage === "FUNDED" ||
    stage === "PASSED" ||
    stage === "REVIEW_PENDING"
  );
}

/**
 * Predicate for accounts that have reached a terminal failure or breach state.
 * Includes FAILED, BREACHED, and CLOSED.
 */
export function isAccountFailed(stage: AccountStage | string): boolean {
  return stage === "FAILED" || stage === "BREACHED" || stage === "CLOSED";
}

/** Specific single-stage predicates for explicit semantic intent */
export function isEvaluation(stage: AccountStage | string): boolean {
  return stage === "EVALUATION";
}

export function isFunded(stage: AccountStage | string): boolean {
  return stage === "FUNDED";
}

export function isPassed(stage: AccountStage | string): boolean {
  return stage === "PASSED";
}

export function isReviewPending(stage: AccountStage | string): boolean {
  return stage === "REVIEW_PENDING";
}

export function isClosed(stage: AccountStage | string): boolean {
  return stage === "CLOSED";
}
