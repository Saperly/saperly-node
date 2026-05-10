import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly } from "../index.js";
import { AgentScopeError } from "../errors.js";

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

const KEY_ID = "00000000-0000-4000-8000-000000000abc";

const EMPTY_FEED = {
  events: [],
  limit: 100,
  api_key_id: KEY_ID,
};

describe("AuditResource.list", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("defaults api_key_id=self when called with no args", async () => {
    mockFetch.mockResolvedValue(jsonResponse(EMPTY_FEED));

    await client.audit.list();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/audit");
    expect(url).toContain("api_key_id=self");
    // No event_types when not provided.
    expect(url).not.toContain("event_types=");
  });

  it("serializes apiKeyId + limit + eventTypes into the query string", async () => {
    mockFetch.mockResolvedValue(jsonResponse(EMPTY_FEED));

    await client.audit.list({
      apiKeyId: KEY_ID,
      limit: 50,
      eventTypes: ["call", "sms"],
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`api_key_id=${KEY_ID}`);
    expect(url).toContain("limit=50");
    // CSV-encoded; URLSearchParams encodes "," as %2C.
    expect(url).toMatch(/event_types=call%2Csms/);
  });

  it("omits event_types from the query when an empty array is passed", async () => {
    mockFetch.mockResolvedValue(jsonResponse(EMPTY_FEED));

    await client.audit.list({ apiKeyId: "self", eventTypes: [] });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("event_types=");
  });

  it("returns an empty feed cleanly when the server has no rows", async () => {
    mockFetch.mockResolvedValue(jsonResponse(EMPTY_FEED));

    const result = await client.audit.list();

    expect(result.events).toEqual([]);
    expect(result.limit).toBe(100);
    expect(result.apiKeyId).toBe(KEY_ID);
  });

  it("propagates typed errors from the underlying request layer", async () => {
    // Server returned agent_scope_error — the client's `fromResponse`
    // dispatches to AgentScopeError, which `list()` must re-throw
    // unmodified for `instanceof` to work at the SDK consumer.
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "agent_scope_error",
            message: "This key is scoped to a specific line.",
            details: [{ field: "line_id", message: "line-xyz-789" }],
          },
        },
        403,
      ),
    );

    await expect(client.audit.list({ apiKeyId: KEY_ID })).rejects.toBeInstanceOf(
      AgentScopeError,
    );
  });

  it("recurses toCamelCase into the JSONB data payload (from_number -> fromNumber)", async () => {
    // Verifies the asymmetry called out in the plan: the server emits
    // snake_case throughout the JSONB body, and the client's
    // toCamelCase converter recurses into the opaque `data` object so
    // the SDK consumer sees camelCase nested keys.
    mockFetch.mockResolvedValue(
      jsonResponse({
        events: [
          {
            type: "call",
            id: "call-1",
            created_at: "2026-05-10T12:00:00.000Z",
            data: {
              from_number: "+14155550001",
              to_number: "+14155551234",
              duration_sec: 120,
              line_id: "line-1",
            },
          },
        ],
        limit: 100,
        api_key_id: KEY_ID,
      }),
    );

    const result = await client.audit.list();

    expect(result.events).toHaveLength(1);
    const event = result.events[0];
    expect(event.type).toBe("call");
    expect(event.id).toBe("call-1");
    expect(event.createdAt).toBe("2026-05-10T12:00:00.000Z");
    // Nested JSONB body converted to camelCase by the client.
    expect(event.data).toEqual({
      fromNumber: "+14155550001",
      toNumber: "+14155551234",
      durationSec: 120,
      lineId: "line-1",
    });
    // Top-level api_key_id renamed by the client.
    expect(result.apiKeyId).toBe(KEY_ID);
  });
});
