import challengeAttemptsFixture from "../fixtures/challenge-attempts.json";
import issuancesFixture from "../fixtures/book-account-issuances.json";
import positionsFixture from "../fixtures/positions.json";
import ordersFixture from "../fixtures/orders.json";
import payoutsFixture from "../fixtures/payouts.json";

export class MockProprServer {
  async getChallengeAttempts() {
    return challengeAttemptsFixture;
  }

  async getBookAccountIssuances() {
    return issuancesFixture;
  }

  async getPositions(accountId: string) {
    return {
      total: positionsFixture.data.filter((p) => p.accountId === accountId).length,
      data: positionsFixture.data.filter((p) => p.accountId === accountId),
    };
  }

  async getOrders(accountId: string) {
    return {
      total: ordersFixture.data.filter((o) => o.accountId === accountId).length,
      data: ordersFixture.data.filter((o) => o.accountId === accountId),
    };
  }

  async getPayouts() {
    return payoutsFixture;
  }
}
