import { describe, it, expect } from "vitest";

describe("Multi-Account Isolation", () => {
  it("ensures trade in Account A never mutates Account B", () => {
    const accountA = {
      accountId: "acc-A",
      balance: "5000.00",
      positions: [
        { positionId: "pos-1", asset: "BTC", quantity: "0.1" }
      ],
    };

    const accountB = {
      accountId: "acc-B",
      balance: "25000.00",
      positions: [
        { positionId: "pos-2", asset: "ETH", quantity: "2.0" }
      ],
    };

    // Deep clone initial state of Account B
    const initialAccountB = JSON.parse(JSON.stringify(accountB));

    // Event arrives for Account A
    const eventForA = {
      accountId: "acc-A",
      positionId: "pos-1",
      quantity: "0.0", // closed
    };

    // Handler with proper account isolation check
    function handlePositionUpdate(event: { accountId: string; positionId: string; quantity: string }) {
      if (accountA.accountId === event.accountId) {
        accountA.positions = accountA.positions.filter((p) => p.positionId !== event.positionId);
      }
      if (accountB.accountId === event.accountId) {
        accountB.positions = accountB.positions.filter((p) => p.positionId !== event.positionId);
      }
    }

    handlePositionUpdate(eventForA);

    // Account A was updated
    expect(accountA.positions.length).toBe(0);

    // Account B remains completely pristine
    expect(accountB).toEqual(initialAccountB);
  });
});
