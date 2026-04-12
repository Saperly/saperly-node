import type { SaperlyClient } from "../client.js";
import type { Disclosure } from "../types.js";

export interface CreateDisclosureParams {
  message: string;
  language?: string;
}

export class DisclosuresResource {
  constructor(private client: SaperlyClient) {}

  async create(params: CreateDisclosureParams): Promise<Disclosure> {
    const res = await this.client.request<{ disclosure: Disclosure }>("POST", "/disclosures", {
      body: params,
    });
    return res.disclosure;
  }

  async list(): Promise<Disclosure[]> {
    const res = await this.client.request<{ disclosures: Disclosure[] }>("GET", "/disclosures");
    return res.disclosures;
  }
}
