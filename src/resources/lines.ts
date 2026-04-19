import type { SaperlyClient } from "../client.js";
import type { Line, SmsMessage } from "../types.js";

// Rate-limit unknown-mode warnings to once per distinct value per process lifetime
// so a dashboard polling a legacy-mode row 60x/min doesn't spam the console.
const warnedUnknownModes = new Set<string>();

function normalizeMode(raw: string): Line["mode"] {
  if (raw === "text") return "webhook";
  if (raw === "webhook" || raw === "audio" || raw === "hosted") return raw;
  // Fail-open for forward-compat: a future server-side mode (e.g. "realtime")
  // should not crash pinned SDK clients. Surface the value as-is and let the
  // caller handle it. Type widening on Line.mode is the companion change.
  if (!warnedUnknownModes.has(raw) && typeof console !== "undefined" && console.warn) {
    warnedUnknownModes.add(raw);
    console.warn(`[@saperly/sdk] Unknown line.mode from API: ${raw}. Upgrade to latest SDK.`);
  }
  return raw as Line["mode"];
}

function normalizeLine(raw: Line): Line {
  return { ...raw, mode: normalizeMode(raw.mode) };
}

export interface CreateLineParams {
  name: string;
  mode?: "webhook" | "audio" | "hosted";
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
  mode?: "webhook" | "audio" | "hosted";
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
    return normalizeLine(res.line);
  }

  async list(): Promise<Line[]> {
    const res = await this.client.request<{ lines: Line[] }>("GET", "/lines");
    return res.lines.map(normalizeLine);
  }

  async get(lineId: string): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("GET", `/lines/${encodeURIComponent(lineId)}`);
    return normalizeLine(res.line);
  }

  async delete(lineId: string): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("DELETE", `/lines/${encodeURIComponent(lineId)}`);
    return normalizeLine(res.line);
  }

  async update(lineId: string, params: UpdateLineParams): Promise<Line> {
    const res = await this.client.request<{ line: Line }>("PATCH", `/lines/${encodeURIComponent(lineId)}`, {
      body: params,
    });
    return normalizeLine(res.line);
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
