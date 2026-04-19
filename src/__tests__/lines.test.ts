import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly } from "../index.js";

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

describe("LinesResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("create returns a Line with camelCase fields (normalizes legacy text mode to webhook)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          line: {
            id: "line-1",
            phone_number: "+14155550123",
            display_name: null,
            name: "support",
            mode: "text",
            audio_handler_url: null,
            webhook_url: "https://example.com/hook",
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
        201,
      ),
    );

    const line = await client.lines.create({
      name: "support",
      mode: "webhook",
      webhookUrl: "https://example.com/hook",
    });

    expect(line.phoneNumber).toBe("+14155550123");
    expect(line.webhookUrl).toBe("https://example.com/hook");
    expect(line.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(line.displayName).toBeNull();
    // Regression: legacy DB rows with mode="text" should be normalized to "webhook"
    expect(line.mode).toBe("webhook");
  });

  it("create sends snake_case body to API", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ line: { id: "line-1", phone_number: "+1", display_name: null, name: "test", mode: "audio", audio_handler_url: "wss://x", webhook_url: null, status_callback_url: null, status: "active", environment: "test", created_at: "2026-01-01" } }, 201),
    );

    await client.lines.create({
      name: "test",
      mode: "audio",
      audioHandlerUrl: "wss://x",
      statusCallbackUrl: "https://cb",
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.audio_handler_url).toBe("wss://x");
    expect(body.status_callback_url).toBe("https://cb");
    expect(body.audioHandlerUrl).toBeUndefined();
  });

  it("list returns an array of Lines", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        lines: [
          { id: "l1", phone_number: "+1", display_name: null, name: "a", mode: "webhook", audio_handler_url: null, webhook_url: "https://x", status_callback_url: null, status: "active", environment: "test", created_at: "2026-01-01" },
          { id: "l2", phone_number: "+2", display_name: null, name: "b", mode: "audio", audio_handler_url: "wss://y", webhook_url: null, status_callback_url: null, status: "active", environment: "live", created_at: "2026-01-02" },
        ],
      }),
    );

    const lines = await client.lines.list();
    expect(lines).toHaveLength(2);
    expect(lines[0].phoneNumber).toBe("+1");
    expect(lines[1].audioHandlerUrl).toBe("wss://y");
  });

  it("sendSms returns an SmsMessage with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        sms: {
          id: "SM_123",
          from_number: "+14155550123",
          to_number: "+14155551234",
          message: "hello",
          status: "sent",
          created_at: "2026-03-29T00:00:00Z",
        },
      }, 201),
    );

    const sms = await client.lines.sendSms("line-1", {
      toNumber: "+14155551234",
      message: "hello",
    });

    expect(sms.fromNumber).toBe("+14155550123");
    expect(sms.toNumber).toBe("+14155551234");
    expect(sms.message).toBe("hello");
    expect(sms.status).toBe("sent");

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/lines/line-1/sms");
    const body = JSON.parse(options.body as string);
    expect(body.to_number).toBe("+14155551234");
  });

  it("delete returns the released Line", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        line: { id: "l1", phone_number: "+1", display_name: null, name: "a", mode: "webhook", audio_handler_url: null, webhook_url: "https://x", status_callback_url: null, status: "released", environment: "test", created_at: "2026-01-01" },
      }),
    );

    const line = await client.lines.delete("l1");
    expect(line.status).toBe("released");
    expect(line.id).toBe("l1");
  });
});
