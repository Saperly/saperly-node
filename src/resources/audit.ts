import type { SaperlyClient } from "../client.js";
import type { AuditListResult, AuditEventType } from "../types.js";

export interface ListAuditParams {
  /**
   * `"self"` (default) resolves to the caller's own api key. Pass a
   * uuid you own to introspect a sibling key. Cross-user reads are
   * rejected as 404 by the server (existence-leak protection).
   */
  apiKeyId?: string;
  /** Max events returned, 1..500, default 100. */
  limit?: number;
  /**
   * Restrict the feed to specific event types. Empty array is treated
   * as "no filter" (omitted from the query string) so callers can
   * conditionally narrow without branching at the call site.
   */
  eventTypes?: AuditEventType[];
}

export class AuditResource {
  constructor(private client: SaperlyClient) {}

  /**
   * Introspect this agent's recent activity — calls, SMS, compliance
   * events, and billing transactions stamped with this api key.
   *
   * With `apiKeyId: "self"` (default) returns the caller's own events.
   * Passing a uuid that belongs to the caller's user reads that key's
   * events; cross-user reads are rejected as 404 to prevent existence
   * leak. Line-scoped keys may only read their own events
   * (cross-sibling reads return `agent_scope_error`).
   *
   * v0.5.6.0 (M4). The server emits snake_case throughout the JSONB
   * payload; the client auto-converts to camelCase, so SDK consumers
   * see `data.fromNumber`, `data.durationSec`, etc.
   */
  async list(params?: ListAuditParams): Promise<AuditListResult> {
    const query: Record<string, string | number | undefined> = {
      api_key_id: params?.apiKeyId ?? "self",
      limit: params?.limit,
      event_types:
        params?.eventTypes && params.eventTypes.length > 0
          ? params.eventTypes.join(",")
          : undefined,
    };
    return this.client.request<AuditListResult>("GET", "/audit", { query });
  }
}
