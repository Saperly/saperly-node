import type { SaperlyClient } from "../client.js";
import type { Line, SmsMessage } from "../types.js";

export interface CreateLineParams {
  name: string;
  mode?: "text" | "audio";
  webhookUrl?: string;
  audioHandlerUrl?: string;
  statusCallbackUrl?: string;
  systemPrompt?: string;
  beginMessage?: string;
  voice?: string;
  contextLimit?: number;
  recordingEnabled?: boolean;
  complianceEnabled?: boolean;
}

export interface UpdateLineParams {
  name?: string;
  mode?: "text" | "audio";
  webhookUrl?: string | null;
  audioHandlerUrl?: string | null;
  statusCallbackUrl?: string | null;
  systemPrompt?: string | null;
  beginMessage?: string | null;
  voice?: string | null;
  contextLimit?: number | null;
  recordingEnabled?: boolean;
  complianceEnabled?: boolean;
}

export class LinesResource {
  constructor(private client: SaperlyClient) {}

  async create(params: CreateLineParams): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("POST", "/lines", {
      body: params,
    });
    return res.line;
  }

  async list(): Promise<Line[]> {
    const res = await this.client.request<{ lines: Line[] }>("GET", "/lines");
    return res.lines;
  }

  async get(lineId: string): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("GET", `/lines/${encodeURIComponent(lineId)}`);
    return res.line;
  }

  async delete(lineId: string): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("DELETE", `/lines/${encodeURIComponent(lineId)}`);
    return res.line;
  }

  async update(lineId: string, params: UpdateLineParams): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("PATCH", `/lines/${encodeURIComponent(lineId)}`, {
      body: params,
    });
    return res.line;
  }

  async sendSms(lineId: string, params: { toNumber: string; message: string }): Promise<SmsMessage> {
    const res = await this.client.request<{ sms: SmsMessage }>(
      "POST",
      `/lines/${encodeURIComponent(lineId)}/sms`,
      { body: params },
    );
    return res.sms;
  }
}
