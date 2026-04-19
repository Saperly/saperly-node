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

/**
 * Regression: SDK normalizes legacy mode="text" from the API to "webhook".
 *
 * Back-compat rule: the API can still emit "text" for pre-rename DB rows if any
 * layer fails to normalize — the SDK's final map guarantees consumers always
 * see "webhook". Unknown mode values throw loudly (fail fast over silent drift).
 */
describe("LinesResource — legacy mode mapper", () => {
  const client = new Saperly({ apiKey: "sk_test_legacy" });

  it('get() maps mode="text" → "webhook"', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        line: {
          id: "line-1",
          phone_number: "+14155550111",
          display_name: null,
          name: "legacy",
          mode: "text",
          audio_handler_url: null,
          webhook_url: "https://example.com/hook",
          status_callback_url: null,
          status: "active",
          environment: "test",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const line = await client.lines.get("line-1");
    expect(line.mode).toBe("webhook");
  });

  it('get() passes through mode="hosted"', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        line: {
          id: "line-2",
          phone_number: "+14155550222",
          display_name: null,
          name: "hosted",
          mode: "hosted",
          audio_handler_url: null,
          webhook_url: null,
          status_callback_url: null,
          status: "active",
          environment: "test",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const line = await client.lines.get("line-2");
    expect(line.mode).toBe("hosted");
  });

  it('get() passes through mode="audio"', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        line: {
          id: "line-3",
          phone_number: "+14155550333",
          display_name: null,
          name: "audio",
          mode: "audio",
          audio_handler_url: "wss://example.com/ws",
          webhook_url: null,
          status_callback_url: null,
          status: "active",
          environment: "test",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const line = await client.lines.get("line-3");
    expect(line.mode).toBe("audio");
  });

  it('get() passes through unknown mode values with a console.warn (fail-open forward-compat)', async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch.mockResolvedValue(
      jsonResponse({
        line: {
          id: "line-future",
          phone_number: "+14155550444",
          display_name: null,
          name: "future-mode",
          mode: "realtime", // hypothetical future mode the SDK doesn't know about yet
          audio_handler_url: null,
          webhook_url: null,
          status_callback_url: null,
          status: "active",
          environment: "test",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const line = await client.lines.get("line-future");
    expect(line.mode).toBe("realtime");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown line.mode from API: realtime"),
    );
    warnSpy.mockRestore();
  });

  it("list() maps each element individually for mixed modes", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        lines: [
          {
            id: "l-text",
            phone_number: "+1",
            display_name: null,
            name: "a",
            mode: "text",
            audio_handler_url: null,
            webhook_url: "https://example.com/a",
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-01-01",
          },
          {
            id: "l-webhook",
            phone_number: "+2",
            display_name: null,
            name: "b",
            mode: "webhook",
            audio_handler_url: null,
            webhook_url: "https://example.com/b",
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-01-02",
          },
          {
            id: "l-hosted",
            phone_number: "+3",
            display_name: null,
            name: "c",
            mode: "hosted",
            audio_handler_url: null,
            webhook_url: null,
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-01-03",
          },
          {
            id: "l-audio",
            phone_number: "+4",
            display_name: null,
            name: "d",
            mode: "audio",
            audio_handler_url: "wss://x",
            webhook_url: null,
            status_callback_url: null,
            status: "active",
            environment: "test",
            created_at: "2026-01-04",
          },
        ],
      }),
    );

    const result = await client.lines.list();
    expect(result).toHaveLength(4);
    expect(result[0].mode).toBe("webhook"); // from text
    expect(result[1].mode).toBe("webhook");
    expect(result[2].mode).toBe("hosted");
    expect(result[3].mode).toBe("audio");
  });

  it('create() normalizes mode="text" on response', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          line: {
            id: "line-create",
            phone_number: "+14155550555",
            display_name: null,
            name: "fresh",
            mode: "text", // server happened to return legacy value
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
      name: "fresh",
      mode: "webhook",
      webhookUrl: "https://example.com/hook",
    });
    expect(line.mode).toBe("webhook");
  });
});
