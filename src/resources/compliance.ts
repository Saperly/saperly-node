import type { SaperlyClient } from "../client.js";
import type { ComplianceEvent } from "../types.js";

export interface AuditParams {
  lineId?: string;
  phoneNumber?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export class ComplianceResource {
  constructor(private client: SaperlyClient) {}

  async audit(params?: AuditParams): Promise<{ events: ComplianceEvent[]; total: number }> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      query.line_id = params.lineId;
      query.phone_number = params.phoneNumber;
      query.event_type = params.eventType;
      query.from = params.from;
      query.to = params.to;
      query.limit = params.limit;
      query.offset = params.offset;
    }
    return this.client.request<{ events: ComplianceEvent[]; total: number }>(
      "GET",
      "/compliance/audit",
      { query },
    );
  }
}
