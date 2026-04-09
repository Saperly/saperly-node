import type { SaperlyClient } from "../client.js";
import type { Voice } from "../types.js";

export class VoicesResource {
  constructor(private client: SaperlyClient) {}

  async list(): Promise<{ voices: Voice[] }> {
    return this.client.request<{ voices: Voice[] }>("GET", "/voices");
  }
}
