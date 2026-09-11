import { describe, it, expect } from "vitest";

describe("REST + WebSocket Reconciliation & Idempotency", () => {
  it("applies incremental WS event to authoritative REST snapshot", () => {
    // Initial REST state
    const accountState = {
      accountId: "acc-1",
      balance: "5000.00",
      unrealizedPnl: "0.00",
      equity: "5000.00",
      version: 1,
    };

    // Incremental WS event
    const wsEvent = {
      type: "position.updated",
      accountId: "acc-1",
      unrealizedPnl: "150.00",
      timestamp: 100,
    };

    // Apply incremental update
    const updatedState = {
      ...accountState,
      unrealizedPnl: wsEvent.unrealizedPnl,
      equity: (parseFloat(accountState.balance) + parseFloat(wsEvent.unrealizedPnl)).toFixed(2),
    };

    expect(updatedState.equity).toBe("5150.00");
  });

  it("handles duplicate WS events idempotently", () => {
    let balance = 5000;
    const processedEvents = new Set<string>();

    function handleEvent(eventId: string, amount: number) {
      if (processedEvents.has(eventId)) {
        return; // Idempotent skip
      }
      processedEvents.add(eventId);
      balance += amount;
    }

    // Emit event twice
    handleEvent("evt-fill-1", 100);
    handleEvent("evt-fill-1", 100); // Duplicate!

    expect(balance).toBe(5100); // Only applied once
  });

  it("reconciles to authoritative REST snapshot upon WS reconnect", () => {
    let currentEquity = "5200.00"; // Stale or drifted state during disconnect

    // Authoritative REST response on reconnect
    const authoritativeRestEquity = "5150.00";

    // Action on reconnect: overwrite with authoritative REST snapshot
    currentEquity = authoritativeRestEquity;
    expect(currentEquity).toBe("5150.00");
  });
});
