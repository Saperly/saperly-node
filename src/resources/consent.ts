import type { SaperlyClient } from "../client.js";
import type { ConsentRecord, ConsentCheckResult } from "../types.js";

export interface GrantConsentParams {
  lineId: string;
  phoneNumber: string;
  consentType: "implied_inbound" | "explicit_outbound";
  source: string;
}

export interface CheckConsentParams {
  phoneNumber: string;
  lineId?: string;
}

export interface RevokeConsentParams {
  phoneNumber: string;
  lineId?: string;
}

export class ConsentResource {
  constructor(private client: SaperlyClient) {}

  async grant(params: GrantConsentParams): Promise<ConsentRecord> {
    const res = await this.client.request<{ consent: ConsentRecord }>("POST", "/consent", {
      body: params,
    });
    return res.consent;
  }

  async check(params: CheckConsentParams): Promise<ConsentCheckResult> {
    return this.client.request<ConsentCheckResult>("GET", "/consent", {
      query: {
        phone_number: params.phoneNumber,
        line_id: params.lineId,
      },
    });
  }

  async revoke(params: RevokeConsentParams): Promise<ConsentRecord> {
    const res = await this.client.request<{ consent: ConsentRecord }>("DELETE", "/consent", {
      query: {
        phone_number: params.phoneNumber,
        line_id: params.lineId,
      },
    });
    return res.consent;
  }
}
