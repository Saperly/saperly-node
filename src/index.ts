import { SaperlyClient } from "./client.js";
import { LinesResource } from "./resources/lines.js";
import { CallsResource } from "./resources/calls.js";
import { ConsentResource } from "./resources/consent.js";
import { ComplianceResource } from "./resources/compliance.js";
import { DisclosuresResource } from "./resources/disclosures.js";
import { BillingResource } from "./resources/billing.js";
import { WebhooksResource } from "./resources/webhooks.js";
import { MessagesResource } from "./resources/messages.js";
import { ConversationsResource } from "./resources/conversations.js";
import { UsageResource } from "./resources/usage.js";
import { SettingsResource } from "./resources/settings.js";
import { VoicesResource } from "./resources/voices.js";
import { AuditResource } from "./resources/audit.js";
import { KeysResource } from "./resources/keys.js";

export interface SaperlyConfig {
  apiKey: string;
  baseUrl?: string;
}

export class Saperly {
  readonly lines: LinesResource;
  readonly calls: CallsResource;
  readonly consent: ConsentResource;
  readonly compliance: ComplianceResource;
  readonly disclosures: DisclosuresResource;
  readonly billing: BillingResource;
  readonly webhooks: WebhooksResource;
  readonly messages: MessagesResource;
  readonly conversations: ConversationsResource;
  readonly usage: UsageResource;
  readonly settings: SettingsResource;
  readonly voices: VoicesResource;
  readonly audit: AuditResource;
  readonly keys: KeysResource;

  constructor(config: SaperlyConfig) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    const client = new SaperlyClient(config);
    this.lines = new LinesResource(client);
    this.calls = new CallsResource(client);
    this.consent = new ConsentResource(client);
    this.compliance = new ComplianceResource(client);
    this.disclosures = new DisclosuresResource(client);
    this.billing = new BillingResource(client);
    this.webhooks = new WebhooksResource(client);
    this.messages = new MessagesResource(client);
    this.conversations = new ConversationsResource(client);
    this.usage = new UsageResource(client);
    this.settings = new SettingsResource(client);
    this.voices = new VoicesResource(client);
    this.audit = new AuditResource(client);
    this.keys = new KeysResource(client);
  }
}

export * from "./types.js";
export * from "./errors.js";
export { verifyWebhook } from "./webhooks-verify.js";
export type { WebhookHeaders, VerifyOptions, VerifyResult } from "./webhooks-verify.js";
export type { CreateLineParams, UpdateLineParams } from "./resources/lines.js";
export type { CreateCallParams, ListCallsParams, ConversationCallParams } from "./resources/calls.js";
export type { GrantConsentParams, CheckConsentParams, RevokeConsentParams } from "./resources/consent.js";
export type { AuditParams } from "./resources/compliance.js";
export type { CreateDisclosureParams } from "./resources/disclosures.js";
export type { AddFundsParams, ListTransactionsParams } from "./resources/billing.js";
export type { ListDeliveriesParams, WebhookStatsParams, TestWebhookParams } from "./resources/webhooks.js";
export type { SendMessageParams } from "./resources/messages.js";
export type { ListConversationsParams, GetConversationMessagesParams } from "./resources/conversations.js";
export type { DailyUsageParams, MonthlyUsageParams } from "./resources/usage.js";
export type { UpdateSettingsParams } from "./resources/settings.js";
export type { ListAuditParams } from "./resources/audit.js";
export type { CreateKeyParams, ListKeysParams, UpdateKeyParams } from "./resources/keys.js";
