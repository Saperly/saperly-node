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

describe("MessagesResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("send returns a Message with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          id: "SM_abc123",
          line_id: "line-1",
          to: "+14155551234",
          text: "Hello from Saperly",
          status: "sent",
          created_at: "2026-04-09T00:00:00Z",
        },
        201,
      ),
    );

    const message = await client.messages.send({
      lineId: "line-1",
      to: "+14155551234",
      text: "Hello from Saperly",
    });

    expect(message.id).toBe("SM_abc123");
    expect(message.lineId).toBe("line-1");
    expect(message.to).toBe("+14155551234");
    expect(message.text).toBe("Hello from Saperly");
    expect(message.status).toBe("sent");
    expect(message.createdAt).toBe("2026-04-09T00:00:00Z");
  });

  it("send sends snake_case body to API", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          id: "SM_abc123",
          line_id: "line-1",
          to: "+14155551234",
          text: "Hello",
          status: "sent",
          created_at: "2026-04-09T00:00:00Z",
        },
        201,
      ),
    );

    await client.messages.send({
      lineId: "line-1",
      to: "+14155551234",
      text: "Hello",
    });

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/messages");
    const body = JSON.parse(options.body as string);
    expect(body.line_id).toBe("line-1");
    expect(body.to).toBe("+14155551234");
    expect(body.text).toBe("Hello");
    expect(body.lineId).toBeUndefined();
  });
});
