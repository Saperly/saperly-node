import type { SaperlyClient } from "../client.js";
import type { Call, CallPressResult, CallSpeakResult, CallWaitResult } from "../types.js";

export interface CreateCallParams {
  lineId: string;
  toNumber: string;
}

export interface ListCallsParams {
  lineId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationCallParams {
  lineId: string;
  toNumber: string;
  topic: string;
  beginMessage?: string;
  maxDurationSeconds?: number;
}

export interface SpeakCallParams {
  text: string;
  waitForResponse?: boolean;
  timeoutSeconds?: number;
}

export interface WaitCallResponseParams {
  timeoutSeconds?: number;
}

export interface PressCallNumbersParams {
  digits: string;
}

export class CallsResource {
  constructor(private client: SaperlyClient) {}

  async create(params: CreateCallParams): Promise<Call> {
    const res = await this.client.request<{ call: Call }>("POST", "/calls", {
      body: params,
    });
    return res.call;
  }

  async list(params?: ListCallsParams): Promise<{ calls: Call[]; total: number }> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      query.line_id = params.lineId;
      query.status = params.status;
      query.limit = params.limit;
      query.offset = params.offset;
    }
    return this.client.request<{ calls: Call[]; total: number }>("GET", "/calls", { query });
  }

  async get(callId: string): Promise<Call> {
    const res = await this.client.request<{ call: Call }>("GET", `/calls/${encodeURIComponent(callId)}`);
    return res.call;
  }

  async hangup(callId: string): Promise<Call> {
    const res = await this.client.request<{ call: Call }>("POST", `/calls/${encodeURIComponent(callId)}/hangup`);
    return res.call;
  }

  async conversation(params: ConversationCallParams): Promise<Call> {
    const res = await this.client.request<{ call: Call }>("POST", "/calls/conversation", {
      body: params,
    });
    return res.call;
  }

  async speak(callId: string, params: SpeakCallParams): Promise<CallSpeakResult> {
    return this.client.request<CallSpeakResult>(
      "POST",
      `/calls/${encodeURIComponent(callId)}/speak`,
      { body: params },
    );
  }

  async waitForResponse(
    callId: string,
    params: WaitCallResponseParams = {},
  ): Promise<CallWaitResult> {
    return this.client.request<CallWaitResult>(
      "POST",
      `/calls/${encodeURIComponent(callId)}/wait`,
      { body: params },
    );
  }

  async pressNumbers(
    callId: string,
    params: PressCallNumbersParams,
  ): Promise<CallPressResult> {
    return this.client.request<CallPressResult>(
      "POST",
      `/calls/${encodeURIComponent(callId)}/press`,
      { body: params },
    );
  }
}
