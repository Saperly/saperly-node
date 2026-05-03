import type { SaperlyClient } from "../client.js";
import type { Balance, TransactionList, AddFundsResult } from "../types.js";

// v0.5.1.x credits redenomination: pack credit qty rebased to non-clean values
// so $/credit isn't derivable to a clean cent. Pack prices (cents) unchanged.
//   4600 cr  = $13   (smallest pack, $0.00283/cr)
//   12000 cr = $30
//   25000 cr = $55
//   50000 cr = $100  (biggest pack, $0.00200/cr)
export interface AddFundsParams {
  amountCredits: 4600 | 12000 | 25000 | 50000;
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

  /**
   * @deprecated Removed in v0.5.2.0. Saperly is now postpaid — your saved card
   * on file is auto-charged when balance runs low. Manage payment methods at
   * https://app.saperly.com/billing
   *
   * The method signature is preserved for backward type-compat; calling it at
   * runtime throws immediately with a migration breadcrumb. The `params`
   * argument is intentionally accepted (to keep the typed call-site shape
   * stable) but never read.
   */
  async addFunds(params: AddFundsParams): Promise<AddFundsResult> {
    void params;
    throw new Error(
      "client.billing.addFunds() was removed in v0.5.2.0. Saperly is now postpaid — your saved card on file is auto-charged when balance runs low. Manage payment methods at https://app.saperly.com/billing",
    );
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
