import type { SaperlyClient } from "../client.js";
import type { Message } from "../types.js";

export interface SendMessageParams {
  lineId: string;
  to: string;
  text: string;
}

export class MessagesResource {
  constructor(private client: SaperlyClient) {}

  async send(params: SendMessageParams): Promise<Message> {
    return this.client.request<Message>("POST", "/messages", {
      body: params,
    });
  }
}
