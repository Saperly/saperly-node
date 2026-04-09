export interface Line {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  name: string;
  mode: "text" | "audio";
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
  balanceCents: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type:
    | "signup_credit"
    | "credit_purchase"
    | "call_charge"
    | "number_fee"
    | "refund"
    | "auto_recharge";
  amountCents: number;
  balanceAfterCents: number;
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
  costCents: number;
}

export interface MonthlyUsage {
  month: string;
  calls: number;
  minutes: number;
  smsInbound: number;
  smsOutbound: number;
  costCents: number;
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
