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

const CALL_RESPONSE = {
  id: "call-1",
  line_id: "line-1",
  direction: "outbound",
  from_number: "+14155550001",
  to_number: "+14155551234",
  status: "initiated",
  duration_sec: null,
  started_at: null,
  ended_at: null,
  recording_url: null,
  transcript: null,
  system_prompt: null,
  begin_message: null,
  created_at: "2026-04-09T00:00:00Z",
};

describe("CallsResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("create returns a Call with camelCase fields", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ call: CALL_RESPONSE }, 201));

    const call = await client.calls.create({
      lineId: "line-1",
      toNumber: "+14155551234",
    });

    expect(call.id).toBe("call-1");
    expect(call.lineId).toBe("line-1");
    expect(call.fromNumber).toBe("+14155550001");
    expect(call.toNumber).toBe("+14155551234");
    expect(call.status).toBe("initiated");
    expect(call.recordingUrl).toBeNull();
    expect(call.transcript).toBeNull();
    expect(call.systemPrompt).toBeNull();
    expect(call.beginMessage).toBeNull();
    expect(call.createdAt).toBe("2026-04-09T00:00:00Z");
  });

  it("create sends snake_case body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ call: CALL_RESPONSE }, 201));

    await client.calls.create({
      lineId: "line-1",
      toNumber: "+14155551234",
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.line_id).toBe("line-1");
    expect(body.to_number).toBe("+14155551234");
    expect(body.lineId).toBeUndefined();
  });

  it("list returns calls with total count", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        calls: [CALL_RESPONSE],
        total: 1,
      }),
    );

    const result = await client.calls.list({ lineId: "line-1", limit: 10 });

    expect(result.calls).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.calls[0].lineId).toBe("line-1");
  });

  it("list passes query params", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ calls: [], total: 0 }));

    await client.calls.list({ lineId: "line-1", status: "completed", limit: 5, offset: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("line_id=line-1");
    expect(url).toContain("status=completed");
    expect(url).toContain("limit=5");
    expect(url).toContain("offset=10");
  });

  it("get returns a single Call", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ call: CALL_RESPONSE }));

    const call = await client.calls.get("call-1");

    expect(call.id).toBe("call-1");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/calls/call-1");
  });

  it("hangup returns the updated Call", async () => {
    const hungUpCall = { ...CALL_RESPONSE, status: "completed" };
    mockFetch.mockResolvedValue(jsonResponse({ call: hungUpCall }));

    const call = await client.calls.hangup("call-1");

    expect(call.status).toBe("completed");
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/calls/call-1/hangup");
    expect(options.method).toBe("POST");
  });

  it("conversation sends correct body and returns a Call", async () => {
    const conversationCall = {
      ...CALL_RESPONSE,
      system_prompt: "You are a helpful assistant",
      begin_message: "Hello, how can I help?",
    };
    mockFetch.mockResolvedValue(jsonResponse({ call: conversationCall }, 201));

    const call = await client.calls.conversation({
      lineId: "line-1",
      toNumber: "+14155551234",
      topic: "Customer support follow-up",
      beginMessage: "Hello, how can I help?",
      maxDurationSeconds: 300,
    });

    expect(call.id).toBe("call-1");
    expect(call.systemPrompt).toBe("You are a helpful assistant");
    expect(call.beginMessage).toBe("Hello, how can I help?");

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/calls/conversation");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body.line_id).toBe("line-1");
    expect(body.to_number).toBe("+14155551234");
    expect(body.topic).toBe("Customer support follow-up");
    expect(body.begin_message).toBe("Hello, how can I help?");
    expect(body.max_duration_seconds).toBe(300);
    expect(body.lineId).toBeUndefined();
  });
});
