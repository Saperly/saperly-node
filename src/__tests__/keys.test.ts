import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly } from "../index.js";
import {
  AgentCapExceededError,
  AgentPermissionDeniedError,
  AgentScopeError,
  IdempotencyInProgressError,
  IdempotencyKeyReusedError,
  MissingIdempotencyKeyError,
  RateLimitedError,
} from "../errors.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const activeKeyWire = {
  id: "key_abc",
  plaintext_key: "sk_test_PLAINTEXT_ONLY_ONCE",
  key_prefix: "sk_test_abc",
  environment: "test",
  name: "support agent",
  agent_label: "support",
  line_id: "line_1",
  permissions: "full",
  monthly_cap_cents: 50000,
  monthly_spend_cents: 1234,
  created_at: "2026-05-12T00:00:00Z",
  revoked_at: null,
  last_used_at: null,
  rotated_from: null,
  created_by_service_key_id: "svc_root",
};

const revokedKeyWire = {
  ...activeKeyWire,
  plaintext_key: undefined,
  id: "key_old",
  revoked_at: "2026-05-12T01:00:00Z",
  last_used_at: "2026-05-12T00:30:00Z",
};

describe("KeysResource", () => {
  const client = new Saperly({ apiKey: "sk_test_root" });

  describe("create", () => {
    it("sends POST /api/v1/keys with snake_case body", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }, 201));

      await client.keys.create({
        name: "support agent",
        agentLabel: "support",
        lineId: "line_1",
        permissions: "full",
        monthlyCapCents: 50000,
        environment: "test",
      });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/keys");
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body as string);
      expect(body.name).toBe("support agent");
      expect(body.agent_label).toBe("support");
      expect(body.line_id).toBe("line_1");
      expect(body.permissions).toBe("full");
      expect(body.monthly_cap_cents).toBe(50000);
      expect(body.environment).toBe("test");
      expect(body.agentLabel).toBeUndefined();
      expect(body.monthlyCapCents).toBeUndefined();
      expect(body.idempotency_key).toBeUndefined();
      expect(body.idempotencyKey).toBeUndefined();
    });

    it("auto-generates an Idempotency-Key header (UUID-shaped) when not provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }, 201));

      await client.keys.create({ name: "agent" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      const idem = headers["Idempotency-Key"];
      expect(idem).toBeDefined();
      // UUID v4 = 36 chars (8-4-4-4-12 with hyphens).
      expect(idem.length).toBeGreaterThan(8);
      expect(idem).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("uses caller-supplied Idempotency-Key verbatim when passed", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }, 201));

      await client.keys.create({
        name: "agent",
        idempotencyKey: "caller-supplied-key-123",
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Idempotency-Key"]).toBe("caller-supplied-key-123");
    });

    it("normalizes the response to camelCase", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }, 201));

      const key = await client.keys.create({ name: "agent" });

      expect(key.id).toBe("key_abc");
      expect(key.plaintextKey).toBe("sk_test_PLAINTEXT_ONLY_ONCE");
      expect(key.keyPrefix).toBe("sk_test_abc");
      expect(key.monthlyCapCents).toBe(50000);
      expect(key.monthlySpendCents).toBe(1234);
      expect(key.createdAt).toBe("2026-05-12T00:00:00Z");
      expect(key.createdByServiceKeyId).toBe("svc_root");
      expect(key.agentLabel).toBe("support");
      expect(key.lineId).toBe("line_1");
    });

    it("throws AgentScopeError on 403 agent_scope_error", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "agent_scope_error",
              message: "key scoped to a different line",
              details: [{ message: "line_id mismatch" }],
            },
          },
          403,
        ),
      );

      await expect(client.keys.create({ name: "agent" })).rejects.toBeInstanceOf(
        AgentScopeError,
      );
    });

    it("throws AgentCapExceededError on 402 agent_cap_exceeded", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          { error: { code: "agent_cap_exceeded", message: "cap reached" } },
          402,
        ),
      );

      await expect(client.keys.create({ name: "agent" })).rejects.toBeInstanceOf(
        AgentCapExceededError,
      );
    });

    it("throws AgentPermissionDeniedError on 403 agent_permission_denied", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          { error: { code: "agent_permission_denied", message: "tier too low" } },
          403,
        ),
      );

      await expect(client.keys.create({ name: "agent" })).rejects.toBeInstanceOf(
        AgentPermissionDeniedError,
      );
    });

    it("throws IdempotencyKeyReusedError on 409 idempotency_key_reused", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "idempotency_key_reused",
              message: "key reused with different body",
            },
          },
          409,
        ),
      );

      await expect(
        client.keys.create({ name: "agent", idempotencyKey: "reused" }),
      ).rejects.toBeInstanceOf(IdempotencyKeyReusedError);
    });

    it("throws RateLimitedError on 429 rate_limited", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ error: { code: "rate_limited", message: "slow down" } }, 429),
      );

      await expect(client.keys.create({ name: "agent" })).rejects.toBeInstanceOf(
        RateLimitedError,
      );
    });
  });

  describe("list", () => {
    it("sends GET /api/v1/keys with limit + offset query string", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ keys: [activeKeyWire], total: 1 }),
      );

      await client.keys.list({ limit: 25, offset: 50 });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/keys?");
      expect(url).toContain("limit=25");
      expect(url).toContain("offset=50");
      expect(options.method).toBe("GET");
    });

    it("returns { keys, total } with camelCase entries", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ keys: [activeKeyWire], total: 1 }),
      );

      const result = await client.keys.list();

      expect(result.total).toBe(1);
      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].keyPrefix).toBe("sk_test_abc");
      expect(result.keys[0].agentLabel).toBe("support");
    });

    it("returns { keys: [], total: 0 } when empty", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ keys: [], total: 0 }));

      const result = await client.keys.list();

      expect(result.keys).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("get", () => {
    it("encodes the id with encodeURIComponent to defend against path traversal", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }));

      await client.keys.get("path/traversal/../etc");

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("path%2Ftraversal%2F..%2Fetc");
      expect(url).not.toContain("path/traversal/../etc");
    });

    it("returns the ApiKey directly (unwrapped from { key })", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: revokedKeyWire }));

      const key = await client.keys.get("key_old");

      expect(key.id).toBe("key_old");
      expect(key.revokedAt).toBe("2026-05-12T01:00:00Z");
      expect(key.lastUsedAt).toBe("2026-05-12T00:30:00Z");
    });
  });

  describe("update", () => {
    it("sends PATCH with only provided fields, snake_case", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }));

      await client.keys.update("key_abc", {
        name: "renamed",
        monthlyCapCents: 99900,
      });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/keys/key_abc");
      expect(options.method).toBe("PATCH");
      const body = JSON.parse(options.body as string);
      expect(body).toEqual({ name: "renamed", monthly_cap_cents: 99900 });
    });

    it("allows null to clear agent_label / line_id / monthly_cap_cents", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: activeKeyWire }));

      await client.keys.update("key_abc", {
        agentLabel: null,
        lineId: null,
        monthlyCapCents: null,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.agent_label).toBeNull();
      expect(body.line_id).toBeNull();
      expect(body.monthly_cap_cents).toBeNull();
    });
  });

  describe("delete", () => {
    it("sends DELETE and returns the revoked ApiKey", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: revokedKeyWire }));

      const key = await client.keys.delete("key_old");

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/keys/key_old");
      expect(options.method).toBe("DELETE");
      expect(key.id).toBe("key_old");
      expect(key.revokedAt).toBe("2026-05-12T01:00:00Z");
    });
  });

  describe("rotate", () => {
    const rotatedWire = {
      ...activeKeyWire,
      id: "key_new",
      plaintext_key: "sk_test_ROTATED_PLAINTEXT",
      rotated_from: "key_abc",
    };

    it("sends POST /api/v1/keys/:id/rotate with an Idempotency-Key header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: rotatedWire }, 201));

      await client.keys.rotate("key_abc");

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/keys/key_abc/rotate");
      expect(options.method).toBe("POST");
      const headers = options.headers as Record<string, string>;
      expect(headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("returns CreateApiKeyResponse with plaintextKey + rotatedFrom set", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: rotatedWire }, 201));

      const key = await client.keys.rotate("key_abc");

      expect(key.id).toBe("key_new");
      expect(key.plaintextKey).toBe("sk_test_ROTATED_PLAINTEXT");
      expect(key.rotatedFrom).toBe("key_abc");
    });

    it("uses caller-supplied Idempotency-Key verbatim when passed", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ key: rotatedWire }, 201));

      await client.keys.rotate("key_abc", { idempotencyKey: "rotation-token-99" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["Idempotency-Key"]).toBe("rotation-token-99");
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // /review hardening (2026-05-12): coverage for paths the original test
  // suite missed. Each test is paired with a fingerprint to the codex /
  // specialist finding it closes.
  // ───────────────────────────────────────────────────────────────────

  describe("idempotency replay redaction", () => {
    // Server intentionally redacts plaintext_key on idempotency replay
    // (route.ts:177-207). The SDK type now declares plaintextKey as
    // optional; this test pins the contract so a future regression that
    // re-asserts the field as required would fail here.
    it("handles 201 reply WITHOUT plaintext_key (idempotency replay)", async () => {
      const replayWire = { ...activeKeyWire, plaintext_key: undefined };
      mockFetch.mockResolvedValue(jsonResponse({ key: replayWire }, 201));

      const key = await client.keys.create({
        name: "agent",
        idempotencyKey: "replayed",
      });

      expect(key.id).toBe("key_abc");
      expect(key.plaintextKey).toBeUndefined();
      // The rest of the resource is intact — the replay envelope is the
      // full ApiKey shape minus plaintext_key.
      expect(key.keyPrefix).toBe("sk_test_abc");
      expect(key.permissions).toBe("full");
    });

    it("rotate also handles redacted replay (no plaintextKey)", async () => {
      const replayWire = {
        ...activeKeyWire,
        plaintext_key: undefined,
        id: "key_new",
        rotated_from: "key_abc",
      };
      mockFetch.mockResolvedValue(jsonResponse({ key: replayWire }, 201));

      const key = await client.keys.rotate("key_abc");

      expect(key.id).toBe("key_new");
      expect(key.plaintextKey).toBeUndefined();
      expect(key.rotatedFrom).toBe("key_abc");
    });
  });

  describe("typed errors not previously covered", () => {
    it("throws IdempotencyInProgressError on 409 idempotency_in_progress", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          { error: { code: "idempotency_in_progress", message: "wait" } },
          409,
        ),
      );

      await expect(
        client.keys.create({ name: "x", idempotencyKey: "k" }),
      ).rejects.toBeInstanceOf(IdempotencyInProgressError);
    });

    it("throws MissingIdempotencyKeyError on 400 missing_idempotency_key", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          { error: { code: "missing_idempotency_key", message: "need header" } },
          400,
        ),
      );

      await expect(client.keys.create({ name: "x" })).rejects.toBeInstanceOf(
        MissingIdempotencyKeyError,
      );
    });
  });

  describe("list pagination contract", () => {
    it("preserves server total when greater than current page size", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          keys: [activeKeyWire, { ...activeKeyWire, id: "key_def" }],
          total: 47,
        }),
      );

      const result = await client.keys.list({ limit: 2 });

      expect(result.keys).toHaveLength(2);
      expect(result.total).toBe(47);
    });
  });

  // Suppression: AgentCapExceeded/Scope/Permission/IdempotencyKeyReused/
  // RateLimited are covered above in the per-method describe blocks.
});
