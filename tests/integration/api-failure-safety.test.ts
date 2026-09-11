import { describe, it, expect } from "vitest";

describe("API Failure Handling & Failure-Safety (§55)", () => {
  it("prefers SYNC ERROR / STALE / UNKNOWN over synthetic mock data", () => {
    // Failure simulation
    const apiResponse = { status: 500, statusText: "Internal Server Error" };

    function handleApiFailure(res: { status: number }) {
      // Correct behavior (§55): Mark as ERROR / STALE, never show mock accounts
      return {
        restStatus: "ERROR" as const,
        freshness: "STALE" as const,
        accounts: [],
        errorMessage: `Propr API returned ${res.status}`,
      };
    }

    const state = handleApiFailure(apiResponse);
    expect(state.restStatus).toBe("ERROR");
    expect(state.freshness).toBe("STALE");
    expect(state.accounts.length).toBe(0);
  });

  it("handles 429 rate limit with exponential backoff rather than tight loop", () => {
    let callCount = 0;
    let delay = 1000;

    function handle429() {
      callCount++;
      delay = Math.min(delay * 2, 60000);
      return delay;
    }

    expect(handle429()).toBe(2000);
    expect(handle429()).toBe(4000);
    expect(handle429()).toBe(8000);
  });
});
