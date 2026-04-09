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

describe("ConversationsResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("list returns conversations with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        conversations: [
          {
            line_id: "line-1",
            phone_number: "+14155551234",
            line_phone_number: "+14155550001",
            message_count: 5,
            last_message_at: "2026-04-09T12:00:00Z",
            last_message_text: "Thanks!",
            last_message_direction: "inbound",
          },
        ],
        has_more: true,
        next_cursor: "cursor-abc",
      }),
    );

    const result = await client.conversations.list({ lineId: "line-1", limit: 10 });

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].lineId).toBe("line-1");
    expect(result.conversations[0].phoneNumber).toBe("+14155551234");
    expect(result.conversations[0].linePhoneNumber).toBe("+14155550001");
    expect(result.conversations[0].messageCount).toBe(5);
    expect(result.conversations[0].lastMessageAt).toBe("2026-04-09T12:00:00Z");
    expect(result.conversations[0].lastMessageText).toBe("Thanks!");
    expect(result.conversations[0].lastMessageDirection).toBe("inbound");
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("cursor-abc");
  });

  it("list passes query params correctly", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ conversations: [], has_more: false, next_cursor: null }),
    );

    await client.conversations.list({ lineId: "line-1", limit: 5, cursor: "cursor-abc" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("line_id=line-1");
    expect(url).toContain("limit=5");
    expect(url).toContain("cursor=cursor-abc");
  });

  it("list works without params", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ conversations: [], has_more: false, next_cursor: null }),
    );

    await client.conversations.list();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/conversations");
    expect(url).not.toContain("?");
  });

  it("messages returns conversation messages with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        messages: [
          { direction: "inbound", text: "Hi there", timestamp: "2026-04-09T10:00:00Z" },
          { direction: "outbound", text: "Hello!", timestamp: "2026-04-09T10:01:00Z" },
        ],
        has_more: false,
        next_cursor: null,
      }),
    );

    const result = await client.conversations.messages("line-1", "+14155551234", { limit: 20 });

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].direction).toBe("inbound");
    expect(result.messages[0].text).toBe("Hi there");
    expect(result.messages[1].direction).toBe("outbound");
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("messages encodes lineId and phoneNumber in URL", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ messages: [], has_more: false, next_cursor: null }),
    );

    await client.conversations.messages("line-1", "+14155551234");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/conversations/line-1/%2B14155551234");
  });
});
