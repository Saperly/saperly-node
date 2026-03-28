import type { SaperlyClient } from "../client.js";
import type { Balance } from "../types.js";

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
}
