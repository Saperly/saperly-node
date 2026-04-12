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

describe("VoicesResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("list returns voices array", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        voices: [
          { id: "voice-1", name: "Alloy", gender: "female", accent: "American", style: "conversational" },
          { id: "voice-2", name: "Echo", gender: "male", accent: "American", style: "professional" },
        ],
      }),
    );

    const result = await client.voices.list();

    expect(result.voices).toHaveLength(2);
    expect(result.voices[0].id).toBe("voice-1");
    expect(result.voices[0].name).toBe("Alloy");
    expect(result.voices[0].gender).toBe("female");
    expect(result.voices[0].accent).toBe("American");
    expect(result.voices[0].style).toBe("conversational");
    expect(result.voices[1].id).toBe("voice-2");
    expect(result.voices[1].name).toBe("Echo");
  });

  it("list calls correct endpoint", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ voices: [] }),
    );

    await client.voices.list();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/voices");
    expect(options.method).toBe("GET");
  });
});
