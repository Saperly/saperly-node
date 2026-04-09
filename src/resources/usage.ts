import type { SaperlyClient } from "../client.js";
import type { DailyUsage, MonthlyUsage } from "../types.js";

export interface DailyUsageParams {
  days?: number;
}

export interface MonthlyUsageParams {
  months?: number;
}

export class UsageResource {
  constructor(private client: SaperlyClient) {}

  async daily(params?: DailyUsageParams): Promise<{ daily: DailyUsage[] }> {
    const query: Record<string, string> = {};
    if (params?.days != null) query.days = String(params.days);
    return this.client.request<{ daily: DailyUsage[] }>("GET", "/usage/daily", { query });
  }

  async monthly(params?: MonthlyUsageParams): Promise<{ monthly: MonthlyUsage[] }> {
    const query: Record<string, string> = {};
    if (params?.months != null) query.months = String(params.months);
    return this.client.request<{ monthly: MonthlyUsage[] }>("GET", "/usage/monthly", { query });
  }
}
