import type { SaperlyClient } from "../client.js";
import type { WebhookDelivery, WebhookStats, WebhookTestResult } from "../types.js";

export interface ListDeliveriesParams {
  lineId?: string;
  eventType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface WebhookStatsParams {
  lineId?: string;
}

export interface TestWebhookParams {
  lineId: string;
}

export class WebhooksResource {
  constructor(private client: SaperlyClient) {}

  async deliveries(params?: ListDeliveriesParams): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      query.line_id = params.lineId;
      query.event_type = params.eventType;
      query.status = params.status;
      query.limit = params.limit;
      query.offset = params.offset;
    }
    return this.client.request<{ deliveries: WebhookDelivery[]; total: number }>("GET", "/webhooks/deliveries", { query });
  }

  async stats(params?: WebhookStatsParams): Promise<WebhookStats> {
    const query: Record<string, string | number | undefined> = {};
    if (params) { query.line_id = params.lineId; }
    return this.client.request<WebhookStats>("GET", "/webhooks/stats", { query });
  }

  async test(params: TestWebhookParams): Promise<WebhookTestResult> {
    return this.client.request<WebhookTestResult>("POST", "/webhooks/test", { body: { line_id: params.lineId } });
  }
}
