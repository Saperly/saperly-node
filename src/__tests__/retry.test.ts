import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly, SaperlyError } from "../index.js";

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

function errorResponse(status: number, code = "internal_error"): Response {
  return {
    ok: false,
    status,
    json: () =>
      Promise.resolve({ error: { code, message: "Server error" } }),
  } as Response;
}

describe("retry logic", () => {
  const client = new Saperly({ apiKey: "sk_test_retry" });

  it("GET 500 then 200 — retries and succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(jsonResponse({ lines: [] }));

    const result = await client.lines.list();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual([]);
  });

  it("POST 500 — throws immediately, no retry", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(500));

    await expect(
      client.lines.create({ name: "test", mode: "text" }),
    ).rejects.toThrow(SaperlyError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("GET 500 on both attempts — throws after 2 attempts", async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(500));

    await expect(client.lines.list()).rejects.toThrow(SaperlyError);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("GET network error then 200 — retries and succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ lines: [] }));

    const result = await client.lines.list();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual([]);
  });

  it("DELETE 502 then 200 — retries and succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse(502))
      .mockResolvedValueOnce(jsonResponse({ line: { id: "line-1", phone_number: "+1" } }));

    const result = await client.lines.delete("line-1");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.id).toBe("line-1");
  });

  it("GET network error on both attempts — throws after 2 attempts", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(client.lines.list()).rejects.toThrow(TypeError);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
