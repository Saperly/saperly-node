import type { SaperlyClient } from "../client.js";
import type { Balance, TransactionList, AddFundsResult } from "../types.js";

export interface AddFundsParams {
  amountCredits: 1000 | 2500 | 5000 | 10000;
}

export interface ListTransactionsParams {
  limit?: number;
  cursor?: string;
}

export class BillingResource {
  constructor(private client: SaperlyClient) {}

  /**
   * Get the current account balance.
   *
   * Note: This endpoint requires the billing API (Phase 5).
   * Calling this before the endpoint is deployed will throw a NotFoundError.
   */
  async balance(): Promise<Balance> {
    return this.client.request<Balance>("GET", "/billing/balance");
  }

  /** Create a checkout session to add funds. Returns a checkout URL. */
  async addFunds(params: AddFundsParams): Promise<AddFundsResult> {
    return this.client.request<AddFundsResult>("POST", "/billing/add-funds", {
      body: params,
    });
  }

  /** List billing transactions with optional pagination. */
  async transactions(
    params?: ListTransactionsParams,
  ): Promise<TransactionList> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      query.limit = params.limit;
      query.cursor = params.cursor;
    }
    return this.client.request<TransactionList>(
      "GET",
      "/billing/transactions",
      { query },
    );
  }
}
