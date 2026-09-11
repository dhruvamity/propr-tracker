import { describe, it, expect } from "vitest";

type Stage = "PURCHASED" | "EVALUATION" | "PASSED" | "FUNDED" | "REVIEW_PENDING" | "FAILED" | "BREACHED" | "CLOSED" | "UNKNOWN";

function deriveStage(attemptStatus?: string, issuanceStatus?: string): Stage {
  if (issuanceStatus) {
    if (issuanceStatus === "active") return "FUNDED";
    if (issuanceStatus === "closed") return "CLOSED";
    if (issuanceStatus === "review_pending") return "REVIEW_PENDING";
    return "UNKNOWN";
  }
  if (attemptStatus) {
    if (attemptStatus === "active") return "EVALUATION";
    if (attemptStatus === "passed") return "PASSED";
    if (attemptStatus === "failed") return "FAILED";
    return "UNKNOWN";
  }
  return "UNKNOWN";
}

describe("Account Lifecycle & State Machine Transitions", () => {
  it("correctly derives stage from authoritative status", () => {
    expect(deriveStage("active", undefined)).toBe("EVALUATION");
    expect(deriveStage("passed", undefined)).toBe("PASSED");
    expect(deriveStage("failed", undefined)).toBe("FAILED");
    expect(deriveStage(undefined, "active")).toBe("FUNDED");
    expect(deriveStage(undefined, "closed")).toBe("CLOSED");
    expect(deriveStage(undefined, "review_pending")).toBe("REVIEW_PENDING");
  });

  it("prioritizes funded issuance over historical evaluation attempt", () => {
    // An account that was passed and now has an active funded issuance
    expect(deriveStage("passed", "active")).toBe("FUNDED");
    expect(deriveStage("passed", "closed")).toBe("CLOSED");
  });

  it("disallows invalid state transitions", () => {
    const validTransitions: Record<Stage, Stage[]> = {
      PURCHASED: ["EVALUATION"],
      EVALUATION: ["PASSED", "FAILED", "BREACHED"],
      PASSED: ["FUNDED", "REVIEW_PENDING"],
      FUNDED: ["ACTIVE" as Stage, "CLOSED", "REVIEW_PENDING"],
      REVIEW_PENDING: ["FUNDED", "CLOSED"],
      FAILED: ["CLOSED"],
      BREACHED: ["CLOSED"],
      CLOSED: [],
      UNKNOWN: ["EVALUATION", "FUNDED"],
    };

    function canTransition(from: Stage, to: Stage): boolean {
      return (validTransitions[from] || []).includes(to);
    }

    // Valid transitions
    expect(canTransition("PURCHASED", "EVALUATION")).toBe(true);
    expect(canTransition("EVALUATION", "PASSED")).toBe(true);
    expect(canTransition("PASSED", "FUNDED")).toBe(true);

    // Invalid transitions
    expect(canTransition("FUNDED", "EVALUATION")).toBe(false);
    expect(canTransition("CLOSED", "EVALUATION")).toBe(false);
    expect(canTransition("FAILED", "FUNDED")).toBe(false);
  });
});
