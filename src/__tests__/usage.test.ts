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

describe("UsageResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("daily returns usage data with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        daily: [
          {
            date: "2026-04-08",
            calls: 12,
            minutes: 45,
            sms_inbound: 3,
            sms_outbound: 7,
            cost_credits: 495,
          },
          {
            date: "2026-04-09",
            calls: 8,
            minutes: 30,
            sms_inbound: 1,
            sms_outbound: 4,
            cost_credits: 330,
          },
        ],
      }),
    );

    const result = await client.usage.daily({ days: 7 });

    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].date).toBe("2026-04-08");
    expect(result.daily[0].calls).toBe(12);
    expect(result.daily[0].smsInbound).toBe(3);
    expect(result.daily[0].smsOutbound).toBe(7);
    expect(result.daily[0].costCredits).toBe(495);
  });

  it("daily passes days query param", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ daily: [] }));

    await client.usage.daily({ days: 14 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("days=14");
  });

  it("daily works without params", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ daily: [] }));

    await client.usage.daily();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/usage/daily");
    expect(url).not.toContain("?");
  });

  it("monthly returns usage data with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        monthly: [
          {
            month: "2026-03",
            calls: 320,
            minutes: 1200,
            sms_inbound: 45,
            sms_outbound: 120,
            cost_credits: 13200,
          },
        ],
      }),
    );

    const result = await client.usage.monthly({ months: 3 });

    expect(result.monthly).toHaveLength(1);
    expect(result.monthly[0].month).toBe("2026-03");
    expect(result.monthly[0].calls).toBe(320);
    expect(result.monthly[0].minutes).toBe(1200);
    expect(result.monthly[0].smsInbound).toBe(45);
    expect(result.monthly[0].smsOutbound).toBe(120);
    expect(result.monthly[0].costCredits).toBe(13200);
  });

  it("monthly passes months query param", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ monthly: [] }));

    await client.usage.monthly({ months: 6 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("months=6");
  });
});
