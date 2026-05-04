export interface Line {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  name: string;
  mode: "webhook" | "audio" | "hosted" | (string & {});
  audioHandlerUrl: string | null;
  webhookUrl: string | null;
  statusCallbackUrl: string | null;
  systemPrompt: string | null;
  beginMessage: string | null;
  voice: string | null;
  contextLimit: number | null;
  recordingEnabled: boolean;
  complianceEnabled: boolean;
  status: "provisioning" | "active" | "suspended" | "released";
  environment: "live" | "test";
  createdAt: string;
}

export interface Call {
  id: string;
  lineId: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  status: "initiated" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer";
  durationSec: number | null;
  startedAt: string | null;
  endedAt: string | null;
  recordingUrl: string | null;
  transcript: Array<{ role: string; text: string; timestamp: string }> | null;
  systemPrompt: string | null;
  beginMessage: string | null;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  phoneNumber: string;
  lineId: string;
  consentType: "implied_inbound" | "explicit_outbound";
  status: "active" | "revoked";
  grantedAt: string;
  revokedAt: string | null;
}

export interface ComplianceEvent {
  id: string;
  lineId: string;
  callId: string | null;
  phoneNumber: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Disclosure {
  id: string;
  message: string;
  audioUrl: string | null;
  language: string;
  jurisdiction: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Balance {
  /**
   * Account balance in US cents. v0.5.3 cents-honest pivot: this is a cents
   * amount despite the historical field name (e.g. `500` = $5.00). Field
   * rename to `cents` is planned for v0.6.x; until then prefer reading
   * `cents` (added v0.5.3) on new client code.
   */
  credits: number;
  /**
   * Account balance in US cents (added v0.5.3 as the v1.0-stable name).
   * Equal to `credits` on servers ≥ v0.5.3; absent on older servers, in
   * which case fall back to `credits`. Use this field for new code.
   */
  cents?: number;
  /**
   * Currency code. Servers ≥ v0.5.3 return "USD"; older servers (v0.5.2.x and
   * before) returned the literal "credits" — kept in the union for graceful
   * forward-compat. Treat any non-"USD" value as legacy.
   */
  currency: "USD" | "credits" | (string & {});
}

export interface Transaction {
  id: string;
  type:
    | "signup_credit"
    | "credit_purchase"
    | "call_charge"
    | "number_fee"
    | "refund"
    | "auto_recharge"
    | "sms_charge"
    | "postpaid_flush"
    // v0.5.1.x: Build subscription cycle credit grant via invoice.paid.
    | "tier_grant";
  /**
   * Transaction amount in US cents (positive for credits, negative for
   * debits). v0.5.3 cents-honest: the field name still reads "Credits" for
   * backward-compat with v0.5.1.x clients; rename to `amountCents` is
   * planned for v0.6.x. To display as dollars: `(amountCredits / 100).toFixed(2)`.
   */
  amountCredits: number;
  /**
   * Account balance after this transaction, in US cents. Same v0.5.3
   * cents-honest semantics as `amountCredits`; rename to `balanceAfterCents`
   * deferred to v0.6.x.
   */
  balanceAfterCredits: number;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface TransactionList {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AddFundsResult {
  checkoutUrl: string;
}

export interface ConsentCheckResult {
  status: "active" | "none";
  consent: ConsentRecord | null;
}

export interface SmsMessage {
  id: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  lineId: string;
  callId: string | null;
  eventType: string;
  url: string;
  status: "success" | "failed" | "pending";
  httpStatus: number | null;
  errorMessage: string | null;
  attemptCount: number;
  requestBody: unknown;
  responseBody: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byEventType: {
    eventType: string;
    total: number;
    success: number;
    failed: number;
  }[];
  byHour: {
    hour: string;
    total: number;
    success: number;
    failed: number;
  }[];
}

export interface WebhookTestResult {
  delivery: {
    id: string;
    status: "success" | "failed";
    httpStatus: number | null;
    durationMs: number;
    responseBody: string | null;
  };
}

export interface Message {
  id: string;
  lineId: string;
  to: string;
  text: string;
  status: string;
  createdAt: string;
}

export interface Conversation {
  lineId: string;
  phoneNumber: string;
  linePhoneNumber: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessageText: string | null;
  lastMessageDirection: "inbound" | "outbound";
}

export interface ConversationList {
  conversations: Conversation[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ConversationMessage {
  direction: "inbound" | "outbound";
  text: string;
  timestamp: string;
}

export interface ConversationMessages {
  messages: ConversationMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface DailyUsage {
  date: string;
  calls: number;
  minutes: number;
  smsInbound: number;
  smsOutbound: number;
  costCredits: number;
}

export interface MonthlyUsage {
  month: string;
  calls: number;
  minutes: number;
  smsInbound: number;
  smsOutbound: number;
  costCredits: number;
}

export interface Settings {
  defaultWebhookUrl: string | null;
}

export interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  style: string;
}
