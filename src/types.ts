export interface Line {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  name: string;
  mode: "text" | "audio";
  audioHandlerUrl: string | null;
  webhookUrl: string | null;
  statusCallbackUrl: string | null;
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
