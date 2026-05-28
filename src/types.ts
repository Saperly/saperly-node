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
  /**
   * v0.5.10 — Deepgram STT language pin. 'multi' (default) lets Deepgram
   * auto-detect per fragment. Set to a specific code (e.g. 'he', 'es') to pin
   * the language for this line and dramatically improve accuracy on
   * non-English callers. Hosted-mode lines must keep 'multi'.
   */
  language: string;
  /**
   * v0.5.10 — Deepgram endpointing override in ms. null = platform default
   * (~700ms). Range 100-2000. Advanced; most customers should leave null.
   */
  endpointingMs: number | null;
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
    | "tier_grant"
    // v0.5.4: number-fee Stripe top-up. Cron charges saved card to keep
    // monthly numbers active when balance < total fees due. Renders to
    // customer as "Auto-charge" with positive sign in the portal ledger.
    | "number_fee_topup";
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

/**
 * v0.5.6.0 (M4) — discriminator for `AuditEvent.type`. Matches the
 * server's `audit-types.ts` union exactly. The string value is
 * pass-through (no case transform) because it has no underscore;
 * verified by the resource tests.
 */
export type AuditEventType =
  | "call"
  | "sms"
  | "compliance_event"
  | "billing_transaction";

/**
 * v0.5.6.0 (M4) — one row in the unified agent-audit feed. The server
 * UNIONs across `calls`, `sms_messages`, `compliance_events`, and
 * `billing_transactions`, filtered by `api_key_id` (compliance branch
 * uses `actor_api_key_id`).
 */
export interface AuditEvent {
  type: AuditEventType;
  id: string;
  /**
   * ISO 8601 string. The wire format is `created_at` (snake_case) and
   * `client.request`'s `toCamelCase` converter renames it to
   * `createdAt` on the way in.
   */
  createdAt: string;
  /**
   * Per-type payload. The wire format is snake_case throughout
   * (`from_number`, `duration_sec`, …) and `toCamelCase` recurses into
   * the JSONB body, so SDK consumers see `fromNumber`, `durationSec`,
   * etc. Concrete shape varies by `type`; kept as
   * `Record<string, unknown>` at the SDK boundary so consumers can
   * narrow as they need. See M4 v2 for typed per-type payloads.
   */
  data: Record<string, unknown>;
}

/**
 * v0.5.6.0 (M4) — return shape of `client.audit.list(...)`. The
 * server's wire format is `{ events, limit, api_key_id }`;
 * `toCamelCase` renames the top-level `api_key_id` to `apiKeyId`.
 */
export interface AuditListResult {
  events: AuditEvent[];
  limit: number;
  apiKeyId: string;
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — agent API key permission tier.
 * `legacy_full` is a server-only historical value that may appear in
 * responses for keys minted before the tier rename; the SDK never
 * accepts it as input on create/update.
 *
 * `API_KEY_SETTABLE_PERMISSIONS` is the single source of truth for the
 * tier-set the server accepts on POST /v1/keys + PATCH /v1/keys/[id].
 * Mirrors `API_SETTABLE_PERMISSIONS` in `src/lib/api/schemas.ts` and the
 * SQL CHECK constraint in `src/lib/db/schema.ts` (excluding `legacy_full`).
 * MCP imports this tuple to derive its Zod enum so the four surfaces
 * (SDK types, MCP create-tool schema, MCP update-tool schema, server)
 * cannot drift independently.
 */
export const API_KEY_SETTABLE_PERMISSIONS = [
  "full",
  "call_only",
  "sms_only",
  "read_only",
] as const;

export type ApiKeySettablePermission = (typeof API_KEY_SETTABLE_PERMISSIONS)[number];

export type ApiKeyPermission = ApiKeySettablePermission | "legacy_full";

export type ApiKeyEnvironment = "test" | "live";

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — agent API key resource. Wire
 * format is snake_case (`FormattedApiKey` in `src/lib/api/format.ts`);
 * `SaperlyClient.request` converts it to camelCase on the way in.
 */
export interface ApiKey {
  id: string;
  keyPrefix: string;
  environment: ApiKeyEnvironment;
  name: string;
  agentLabel: string | null;
  lineId: string | null;
  permissions: ApiKeyPermission;
  monthlyCapCents: number | null;
  monthlySpendCents: number;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  rotatedFrom: string | null;
  createdByServiceKeyId: string | null;
}

/**
 * Returned by `client.keys.create` and `client.keys.rotate`.
 *
 * `plaintextKey` is present on the FIRST 201 response only. If the caller
 * retries the SAME Idempotency-Key after losing the plaintext (network drop
 * after the request reached the server, ≤12h window), the replay returns
 * 201 WITHOUT `plaintextKey` — the customer must restore from their first
 * response or rotate the key. This matches Stripe's "create new key"
 * recovery path. See `src/app/api/v1/keys/route.ts:177-207` for the
 * server-side redaction rationale.
 */
export interface CreateApiKeyResponse extends ApiKey {
  plaintextKey?: string;
}

export interface ApiKeyListResult {
  keys: ApiKey[];
  total: number;
}
