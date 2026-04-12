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

describe("SettingsResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("get returns settings with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        default_webhook_url: "https://example.com/webhook",
      }),
    );

    const settings = await client.settings.get();

    expect(settings.defaultWebhookUrl).toBe("https://example.com/webhook");
  });

  it("get handles null webhook url", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        default_webhook_url: null,
      }),
    );

    const settings = await client.settings.get();

    expect(settings.defaultWebhookUrl).toBeNull();
  });

  it("update sends snake_case body and returns updated settings", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        default_webhook_url: "https://example.com/new-webhook",
      }),
    );

    const settings = await client.settings.update({
      defaultWebhookUrl: "https://example.com/new-webhook",
    });

    expect(settings.defaultWebhookUrl).toBe("https://example.com/new-webhook");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.default_webhook_url).toBe("https://example.com/new-webhook");
    expect(body.defaultWebhookUrl).toBeUndefined();
  });

  it("update can set webhook url to null", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        default_webhook_url: null,
      }),
    );

    const settings = await client.settings.update({
      defaultWebhookUrl: null,
    });

    expect(settings.defaultWebhookUrl).toBeNull();

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.default_webhook_url).toBeNull();
  });
});
