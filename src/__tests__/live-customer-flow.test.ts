// v0.5.3 launch-readiness customer-flow E2E. Mocked customer-1 journey through
// the TypeScript SDK: constructor + Bearer auth, line create, call create,
// message send, paginated list shape, error envelope, and balance pinning the
// $5 (500 cent) signup grant. Same fetch-stub harness as lines.test.ts; no new
// libs, no real network, all assertions value-checked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly, AuthenticationError } from "../index.js";

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

describe("v0.5.3 live-customer-flow E2E", () => {
  const client = new Saperly({
    apiKey: "sk_test_xyz",
    baseUrl: "https://api.example.com",
  });

  it("constructor wires Bearer auth header and configured baseUrl on requests", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ lines: [] }));

    await client.lines.list();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/v1/lines");
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk_test_xyz");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("lines.create returns a fully camelCased Line with mode/webhookUrl/statusCallbackUrl", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          line: {
            id: "line-1",
            phone_number: "+14155550100",
            display_name: null,
            name: "support",
            mode: "webhook",
            audio_handler_url: null,
            webhook_url: "https://example.com/hook",
            status_callback_url: "https://example.com/status",
            status: "active",
            environment: "test",
            created_at: "2026-05-03T00:00:00Z",
          },
        },
        201,
      ),
    );

    const line = await client.lines.create({
      name: "support",
      mode: "webhook",
      webhookUrl: "https://example.com/hook",
      statusCallbackUrl: "https://example.com/status",
    });

    expect(line.id).toBe("line-1");
    expect(line.phoneNumber).toBe("+14155550100");
    expect(line.mode).toBe("webhook");
    expect(line.webhookUrl).toBe("https://example.com/hook");
    expect(line.statusCallbackUrl).toBe("https://example.com/status");
  });

  it("calls.create returns a Call with status === 'initiated' (v0.5.3 enum literal)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          call: {
            id: "call-1",
            line_id: "line-1",
            direction: "outbound",
            from_number: "+14155550100",
            to_number: "+14155550199",
            status: "initiated",
            duration_sec: null,
            started_at: null,
            ended_at: null,
            recording_url: null,
            transcript: null,
            system_prompt: null,
            begin_message: null,
            created_at: "2026-05-03T00:00:01Z",
          },
        },
        201,
      ),
    );

    const call = await client.calls.create({
      lineId: "line-1",
      toNumber: "+14155550199",
    });

    expect(call.id).toBe("call-1");
    expect(call.status).toBe("initiated");
    expect(call.lineId).toBe("line-1");
    expect(call.toNumber).toBe("+14155550199");
  });

  it("messages.send returns a Message with id/status/lineId/to/text camelCased", async () => {
    // Verified shape: messages.send takes { lineId, to, text } and returns a
    // naked Message (no { message: ... } envelope), unlike lines.create.
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          id: "msg-1",
          line_id: "line-1",
          to: "+14155550199",
          text: "hello from saperly",
          status: "queued",
          created_at: "2026-05-03T00:00:02Z",
        },
        201,
      ),
    );

    const msg = await client.messages.send({
      lineId: "line-1",
      to: "+14155550199",
      text: "hello from saperly",
    });

    expect(msg.id).toBe("msg-1");
    expect(msg.lineId).toBe("line-1");
    expect(msg.to).toBe("+14155550199");
    expect(msg.text).toBe("hello from saperly");
    expect(msg.status).toBe("queued");
  });

  it("lines.list returns the array shape and total count (auto-merged, no cursor)", async () => {
    // SDK pagination is opaque: lines.list returns Line[] directly with no
    // cursor handling. Spec's fallback path: assert array shape + total count.
    mockFetch.mockResolvedValue(
      jsonResponse({
        lines: [
          {
            id: "l1",
            phone_number: "+14155550101",
            display_name: null,
            name: "a",
            mode: "webhook",
            audio_handler_url: null,
            webhook_url: "https://example.com/a",
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-05-03T00:00:00Z",
          },
          {
            id: "l2",
            phone_number: "+14155550102",
            display_name: null,
            name: "b",
            mode: "hosted",
            audio_handler_url: null,
            webhook_url: null,
            status_callback_url: null,
            status: "active",
            environment: "live",
            created_at: "2026-05-03T00:00:00Z",
          },
        ],
      }),
    );

    const lines = await client.lines.list();

    expect(Array.isArray(lines)).toBe(true);
    expect(lines).toHaveLength(2);
    expect(lines[0].id).toBe("l1");
    expect(lines[1].id).toBe("l2");
    expect(lines[1].mode).toBe("hosted");
  });

  it("error envelope { error: { code, message, details } } maps 401 to AuthenticationError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "unauthorized",
            message: "API key revoked",
            details: [],
          },
        },
        401,
      ),
    );

    await expect(client.lines.list()).rejects.toMatchObject({
      // SaperlyError.fromResponse routes both "unauthorized" and
      // "invalid_api_key" codes to AuthenticationError, which normalizes the
      // code to "invalid_api_key". Status + message + class are the stable
      // contract surface across the routing.
      name: "AuthenticationError",
      status: 401,
      message: "API key revoked",
    });

    // Sanity: the thrown error is the typed AuthenticationError subclass.
    await expect(client.lines.list()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("billing.balance pins the v0.5.3 $5 signup grant (500 cents in the credits field)", async () => {
    // v0.5.3 cents-honest: Balance.credits is a cents amount despite the
    // historical field name. Server returns "USD" currency for >= v0.5.3.
    mockFetch.mockResolvedValue(
      jsonResponse({
        credits: 500,
        currency: "USD",
      }),
    );

    const balance = await client.billing.balance();

    expect(balance.credits).toBe(500);
    expect(balance.currency).toBe("USD");

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/v1/billing/balance");
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk_test_xyz",
    );
  });
});
