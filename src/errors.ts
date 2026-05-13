export interface SaperlyErrorDetail {
  field?: string;
  message: string;
}

export class SaperlyError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: SaperlyErrorDetail[];

  constructor(code: string, status: number, message: string, details: SaperlyErrorDetail[] = []) {
    super(message);
    this.name = "SaperlyError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static fromResponse(status: number, body: unknown): SaperlyError {
    const parsed = body as { error?: { code?: string; message?: string; details?: SaperlyErrorDetail[] } } | null;
    const code = parsed?.error?.code ?? "unknown";
    const message = parsed?.error?.message ?? "An unexpected error occurred";
    const details = parsed?.error?.details ?? [];

    switch (code) {
      case "validation_error":
        return new ValidationError(message, status, details);
      case "invalid_api_key":
      case "unauthorized":
        return new AuthenticationError(message, status);
      case "forbidden":
        return new ForbiddenError(message, status);
      case "not_found":
      case "call_not_found":
        return new NotFoundError(message, status);
      case "consent_required":
        return new ConsentRequiredError(message, status);
      case "consent_already_granted":
        return new ConsentAlreadyGrantedError(message, status);
      case "call_in_progress":
        return new CallInProgressError(message, status);
      case "call_not_active":
        return new CallNotActiveError(message, status);
      case "insufficient_credits":
        return new InsufficientCreditsError(message, status);
      case "payment_method_required":
        return new PaymentMethodRequiredError(message, status);
      case "number_opted_out":
        return new NumberOptedOutError(message, status);
      case "email_taken":
        return new EmailTakenError(message, status);
      case "agent_scope_error":
        return new AgentScopeError(message, status, details);
      case "agent_cap_exceeded":
        return new AgentCapExceededError(message, status, details);
      case "agent_permission_denied":
        return new AgentPermissionDeniedError(message, status, details);
      case "m3_fraud_block":
        return new M3FraudBlockError(message, status);
      case "idempotency_key_reused":
        return new IdempotencyKeyReusedError(message, status);
      case "idempotency_in_progress":
        return new IdempotencyInProgressError(message, status);
      case "missing_idempotency_key":
        return new MissingIdempotencyKeyError(message, status);
      case "rate_limited":
        return new RateLimitedError(message, status);
      default:
        return new SaperlyError(code, status, message, details);
    }
  }
}

export class ValidationError extends SaperlyError {
  constructor(message: string, status = 422, details: SaperlyErrorDetail[] = []) {
    super("validation_error", status, message, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends SaperlyError {
  constructor(message: string, status = 401) {
    super("invalid_api_key", status, message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("forbidden", status, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends SaperlyError {
  constructor(message: string, status = 404) {
    super("not_found", status, message);
    this.name = "NotFoundError";
  }
}

export class ConsentRequiredError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("consent_required", status, message);
    this.name = "ConsentRequiredError";
  }
}

export class ConsentAlreadyGrantedError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("consent_already_granted", status, message);
    this.name = "ConsentAlreadyGrantedError";
  }
}

export class CallInProgressError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("call_in_progress", status, message);
    this.name = "CallInProgressError";
  }
}

export class CallNotActiveError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("call_not_active", status, message);
    this.name = "CallNotActiveError";
  }
}

export class InsufficientCreditsError extends SaperlyError {
  constructor(message: string, status = 402) {
    super("insufficient_credits", status, message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Thrown when POST /v1/lines is called by a user who has previously
 * provisioned a line (`firstLineProvisionedAt != null`) but has no default
 * payment method on file. The first-ever line is frictionless; line #2+
 * requires a card. Add a payment method in the Saperly portal at
 * https://saperly.com/billing#payment-method, then retry with a NEW
 * Idempotency-Key (the original 402 is sticky-cached for ~12h).
 */
export class PaymentMethodRequiredError extends SaperlyError {
  constructor(message: string, status = 402) {
    super("payment_method_required", status, message);
    this.name = "PaymentMethodRequiredError";
  }
}

export class NumberOptedOutError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("number_opted_out", status, message);
    this.name = "NumberOptedOutError";
  }
}

export class EmailTakenError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("email_taken", status, message);
    this.name = "EmailTakenError";
  }
}

/**
 * v0.5.6.0 (M1 PR1) — agent attempted to reach a resource outside its
 * line scope. Line-scoped api keys (`apiKeys.lineId != null`) may only
 * interact with their bound `line_id`; cross-line reads/writes are
 * rejected by the server. Server emits `line_id` in `details` so the
 * caller can surface "this key is scoped to line X — use that line
 * or a non-scoped key" without parsing the message.
 */
export class AgentScopeError extends SaperlyError {
  constructor(message: string, status = 403, details: SaperlyErrorDetail[] = []) {
    super("agent_scope_error", status, message, details);
    this.name = "AgentScopeError";
  }
}

/**
 * v0.5.6.0 (M1 PR1) — agent's `monthly_cap_cents` reached for the
 * current billing cycle. Server emits structured details:
 * `spent_cents`, `cap_cents`, `cycle_reset_at`. Programmatic callers
 * can render "you've used $X of $Y; resets in N days" without parsing
 * the message. Returns 402 — same family as `insufficient_credits` and
 * `payment_method_required` so error handling can collapse to the
 * "fund or raise cap" UX branch.
 */
export class AgentCapExceededError extends SaperlyError {
  constructor(message: string, status = 402, details: SaperlyErrorDetail[] = []) {
    super("agent_cap_exceeded", status, message, details);
    this.name = "AgentCapExceededError";
  }
}

/**
 * v0.5.6.0 (M1 PR1) — agent's `permissions` tier does not include the
 * verb required for this endpoint. Tiers: `read_only` → `read`;
 * `call_only` → `read+call`; `sms_only` → `read+sms`;
 * `full`/`legacy_full` → all. Server emits `tier` and `verb` in
 * `details` so the caller can surface "this key is `read_only` and
 * cannot call — rotate to a `call_only` or `full` key" without parsing
 * the message.
 */
export class AgentPermissionDeniedError extends SaperlyError {
  constructor(message: string, status = 403, details: SaperlyErrorDetail[] = []) {
    super("agent_permission_denied", status, message, details);
    this.name = "AgentPermissionDeniedError";
  }
}

/**
 * v0.5.6.0 (M3) — request blocked by fraud heuristics. Server emits no
 * structured details by design — fraud copy is deliberately vague to
 * avoid giving abusers signal about which heuristic tripped. Treat as
 * terminal for the current request; do not auto-retry. If the agent
 * believes the block is wrong, escalate to a human operator.
 */
export class M3FraudBlockError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("m3_fraud_block", status, message);
    this.name = "M3FraudBlockError";
  }
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — the Idempotency-Key was reused
 * with a different request body within the 24h window. Recovery: use a
 * NEW Idempotency-Key for the new request body.
 */
export class IdempotencyKeyReusedError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("idempotency_key_reused", status, message);
    this.name = "IdempotencyKeyReusedError";
  }
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — a request with this
 * Idempotency-Key is still in progress. Retry after the server-supplied
 * Retry-After window (default 1s).
 */
export class IdempotencyInProgressError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("idempotency_in_progress", status, message);
    this.name = "IdempotencyInProgressError";
  }
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — a POST that requires an
 * Idempotency-Key header was sent without one. The SDK auto-generates
 * UUID v4 keys for /v1/keys mints and rotates, so this only surfaces if
 * a caller bypasses the SDK helpers.
 */
export class MissingIdempotencyKeyError extends SaperlyError {
  constructor(message: string, status = 400) {
    super("missing_idempotency_key", status, message);
    this.name = "MissingIdempotencyKeyError";
  }
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — server rate limit hit. Honor
 * the Retry-After header in seconds. /v1/keys POST is 60/h per service
 * key; rotate is 30/h.
 */
export class RateLimitedError extends SaperlyError {
  constructor(message: string, status = 429) {
    super("rate_limited", status, message);
    this.name = "RateLimitedError";
  }
}
