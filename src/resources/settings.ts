import type { SaperlyClient } from "../client.js";
import type { Settings } from "../types.js";

export interface UpdateSettingsParams {
  defaultWebhookUrl?: string | null;
}

export class SettingsResource {
  constructor(private client: SaperlyClient) {}

  async get(): Promise<Settings> {
    return this.client.request<Settings>("GET", "/settings");
  }

  async update(params: UpdateSettingsParams): Promise<Settings> {
    return this.client.request<Settings>("PATCH", "/settings", { body: params });
  }
}
