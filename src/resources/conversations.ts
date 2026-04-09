import type { SaperlyClient } from "../client.js";
import type { ConversationList, ConversationMessages } from "../types.js";

export interface ListConversationsParams {
  lineId?: string;
  limit?: number;
  cursor?: string;
}

export interface GetConversationMessagesParams {
  limit?: number;
  cursor?: string;
}

export class ConversationsResource {
  constructor(private client: SaperlyClient) {}

  async list(params?: ListConversationsParams): Promise<ConversationList> {
    const query: Record<string, string> = {};
    if (params?.lineId) query.line_id = params.lineId;
    if (params?.limit != null) query.limit = String(params.limit);
    if (params?.cursor) query.cursor = params.cursor;
    return this.client.request<ConversationList>("GET", "/conversations", { query });
  }

  async messages(
    lineId: string,
    phoneNumber: string,
    params?: GetConversationMessagesParams,
  ): Promise<ConversationMessages> {
    const query: Record<string, string> = {};
    if (params?.limit != null) query.limit = String(params.limit);
    if (params?.cursor) query.cursor = params.cursor;
    return this.client.request<ConversationMessages>(
      "GET",
      `/conversations/${encodeURIComponent(lineId)}/${encodeURIComponent(phoneNumber)}`,
      { query },
    );
  }
}
