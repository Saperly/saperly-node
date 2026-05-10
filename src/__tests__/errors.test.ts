import { describe, it, expect } from "vitest";
import {
  SaperlyError,
  ValidationError,
  ConsentRequiredError,
  AgentScopeError,
  AgentCapExceededError,
  AgentPermissionDeniedError,
  M3FraudBlockError,
} from "../errors.js";

describe("SaperlyError.fromResponse", () => {
  it("maps validation_error to ValidationError with details", () => {
    const err = SaperlyError.fromResponse(422, {
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: [{ field: "name", message: "Required" }],
      },
    });

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe("validation_error");
    expect(err.status).toBe(422);
    expect(err.details).toHaveLength(1);
    expect(err.details[0].field).toBe("name");
  });

  it("maps consent_required to ConsentRequiredError", () => {
    const err = SaperlyError.fromResponse(403, {
      error: {
        code: "consent_required",
        message: "Outbound calls require explicit consent.",
      },
    });

    expect(err).toBeInstanceOf(ConsentRequiredError);
    expect(err.code).toBe("consent_required");
    expect(err.status).toBe(403);
  });

  it("maps unknown error code to base SaperlyError", () => {
    const err = SaperlyError.fromResponse(418, {
      error: {
        code: "teapot",
        message: "I'm a teapot",
      },
    });

    expect(err).toBeInstanceOf(SaperlyError);
    expect(err.code).toBe("teapot");
    expect(err.status).toBe(418);
  });

  it("handles null body gracefully", () => {
    const err = SaperlyError.fromResponse(500, null);

    expect(err).toBeInstanceOf(SaperlyError);
    expect(err.code).toBe("unknown");
    expect(err.message).toBe("An unexpected error occurred");
    expect(err.status).toBe(500);
  });

  // v0.5.6.0 (M1/M3/M4) — typed errors for the 4 new agent-aware
  // server error codes. The 3 detail-bearing ones forward the
  // server-emitted `details[]` so callers can render structured copy
  // without parsing the human-readable message.

  it("maps agent_scope_error to AgentScopeError with line_id detail", () => {
    const err = SaperlyError.fromResponse(403, {
      error: {
        code: "agent_scope_error",
        message: "This key is scoped to a specific line.",
        details: [{ field: "line_id", message: "line-abc-123" }],
      },
    });

    expect(err).toBeInstanceOf(AgentScopeError);
    expect(err.code).toBe("agent_scope_error");
    expect(err.status).toBe(403);
    expect(err.details).toHaveLength(1);
    expect(err.details[0]).toEqual({ field: "line_id", message: "line-abc-123" });
  });

  it("maps agent_cap_exceeded to AgentCapExceededError with spend/cap/reset details", () => {
    const err = SaperlyError.fromResponse(402, {
      error: {
        code: "agent_cap_exceeded",
        message:
          "Monthly cap reached ($10.00). Cycle resets 2026-06-01T00:00:00.000Z.",
        details: [
          { field: "spent_cents", message: "1000" },
          { field: "cap_cents", message: "1000" },
          { field: "cycle_reset_at", message: "2026-06-01T00:00:00.000Z" },
        ],
      },
    });

    expect(err).toBeInstanceOf(AgentCapExceededError);
    expect(err.code).toBe("agent_cap_exceeded");
    expect(err.status).toBe(402);
    expect(err.details).toHaveLength(3);
    expect(err.details[0]).toEqual({ field: "spent_cents", message: "1000" });
    expect(err.details[1]).toEqual({ field: "cap_cents", message: "1000" });
    expect(err.details[2]).toEqual({
      field: "cycle_reset_at",
      message: "2026-06-01T00:00:00.000Z",
    });
  });

  it("maps agent_permission_denied to AgentPermissionDeniedError with tier/verb details", () => {
    const err = SaperlyError.fromResponse(403, {
      error: {
        code: "agent_permission_denied",
        message: "This key cannot perform call (tier=read_only).",
        details: [
          { field: "tier", message: "read_only" },
          { field: "verb", message: "call" },
        ],
      },
    });

    expect(err).toBeInstanceOf(AgentPermissionDeniedError);
    expect(err.code).toBe("agent_permission_denied");
    expect(err.status).toBe(403);
    expect(err.details).toHaveLength(2);
    expect(err.details[0]).toEqual({ field: "tier", message: "read_only" });
    expect(err.details[1]).toEqual({ field: "verb", message: "call" });
  });

  it("maps m3_fraud_block to M3FraudBlockError with no details", () => {
    const err = SaperlyError.fromResponse(403, {
      error: {
        code: "m3_fraud_block",
        message: "Request blocked by fraud heuristics.",
      },
    });

    expect(err).toBeInstanceOf(M3FraudBlockError);
    expect(err.code).toBe("m3_fraud_block");
    expect(err.status).toBe(403);
    // Fraud copy is deliberately vague — no structured details.
    expect(err.details).toHaveLength(0);
  });

  // Backwards-compat smoke: the existing 14 error codes must still
  // dispatch to their typed subclasses after the T4 switch extension.
  it("preserves backwards-compat dispatch for validation_error post-T4", () => {
    const err = SaperlyError.fromResponse(422, {
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: [{ field: "limit", message: "Must be between 1 and 500" }],
      },
    });

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe("validation_error");
    expect(err.details).toHaveLength(1);
  });
});
