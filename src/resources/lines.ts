import type { SaperlyClient } from "../client.js";
import type { Line } from "../types.js";

export interface CreateLineParams {
  name: string;
  mode?: "text" | "audio";
  webhookUrl?: string;
  audioHandlerUrl?: string;
  statusCallbackUrl?: string;
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
}
