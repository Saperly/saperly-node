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
          { slug: "aria", name: "Aria", gender: "female", accent: "American", description: "Calm and conversational", languages: ["multi"] },
          { slug: "hebrew-warm", name: "Eitan", gender: "male", accent: "Israeli", description: "Warm, natural male Hebrew", languages: ["he"] },
        ],
      }),
    );

    const result = await client.voices.list();

    expect(result.voices).toHaveLength(2);
    expect(result.voices[0].slug).toBe("aria");
    expect(result.voices[0].name).toBe("Aria");
    expect(result.voices[0].gender).toBe("female");
    expect(result.voices[0].accent).toBe("American");
    expect(result.voices[0].description).toBe("Calm and conversational");
    expect(result.voices[0].languages).toEqual(["multi"]);
    expect(result.voices[1].slug).toBe("hebrew-warm");
    expect(result.voices[1].name).toBe("Eitan");
    expect(result.voices[1].languages).toEqual(["he"]);
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
