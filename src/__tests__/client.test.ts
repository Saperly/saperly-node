import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaperlyClient } from "../client.js";
import { Saperly } from "../index.js";
import { SaperlyError } from "../errors.js";

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

describe("SaperlyClient", () => {
  it("sets Authorization Bearer header on every request", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ lines: [] }));
    const client = new SaperlyClient({ apiKey: "sk_test_abc123" });

    await client.request("GET", "/lines");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk_test_abc123",
    );
  });

  it("uses custom baseUrl when provided", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ lines: [] }));
    const client = new SaperlyClient({
      apiKey: "sk_test_abc123",
      baseUrl: "http://localhost:3000",
    });

    await client.request("GET", "/lines");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe("http://localhost:3000/api/v1/lines");
  });

  it("throws immediately if apiKey is missing", () => {
    expect(() => new SaperlyClient({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("returns undefined for 204 responses", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("no body")),
    } as unknown as Response);

    const client = new SaperlyClient({ apiKey: "sk_test_abc123" });
    const result = await client.request("DELETE", "/lines/123");

    expect(result).toBeUndefined();
  });

  it("transforms response keys from snake_case to camelCase", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ line: { phone_number: "+1", created_at: "2026-01-01" } }),
    );
    const client = new SaperlyClient({ apiKey: "sk_test_abc123" });

    const res = await client.request<{ line: { phoneNumber: string; createdAt: string } }>(
      "GET",
      "/lines/1",
    );

    expect(res.line.phoneNumber).toBe("+1");
    expect(res.line.createdAt).toBe("2026-01-01");
  });

  it("forwards caller-supplied headers but drops Authorization overrides", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    const client = new SaperlyClient({ apiKey: "sk_test_xyz" });

    await client.request("GET", "/foo", {
      headers: { "X-Custom": "yes", Authorization: "Bearer EVIL" },
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const sent = options.headers as Record<string, string>;
    expect(sent["X-Custom"]).toBe("yes");
    expect(sent.Authorization).toBe("Bearer sk_test_xyz");
  });

  it("drops Authorization / Content-Type overrides regardless of header case", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    const client = new SaperlyClient({ apiKey: "sk_test_xyz" });

    await client.request("GET", "/foo", {
      headers: {
        AUTHORIZATION: "Bearer EVIL",
        "content-Type": "text/plain",
        "CONTENT-TYPE": "x/y",
      },
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const sent = options.headers as Record<string, string>;
    expect(sent.Authorization).toBe("Bearer sk_test_xyz");
    expect(sent["Content-Type"]).toBe("application/json");
    expect(sent.AUTHORIZATION).toBeUndefined();
    expect(sent["content-Type"]).toBeUndefined();
    expect(sent["CONTENT-TYPE"]).toBeUndefined();
  });

  it("rejects caller headers containing CRLF (header injection guard)", async () => {
    const client = new SaperlyClient({ apiKey: "sk_test_xyz" });

    await expect(
      client.request("GET", "/foo", {
        headers: { "X-Inj": "a\r\nAuthorization: Bearer evil" },
      }),
    ).rejects.toThrow(/CRLF/);

    await expect(
      client.request("GET", "/foo", {
        headers: { "X-Inj\nEvil": "ok" },
      }),
    ).rejects.toThrow(/CRLF/);
  });

  it("wraps non-JSON error response in SaperlyError", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response);

    const client = new SaperlyClient({ apiKey: "sk_test_abc123" });

    await expect(client.request("GET", "/lines")).rejects.toThrow(SaperlyError);
    try {
      await client.request("GET", "/lines");
    } catch (err) {
      expect(err).toBeInstanceOf(SaperlyError);
      expect((err as SaperlyError).status).toBe(500);
    }
  });
});

describe("Saperly.register", () => {
  it("calls /auth/signup and returns camelCase user", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        { user: { id: "u1", email: "a@b.com", name: null, created_at: "2026-01-01" } },
        201,
      ),
    );

    const result = await Saperly.register({
      email: "a@b.com",
      password: "password123",
    });

    expect(result.user.createdAt).toBe("2026-01-01");
    expect(result.user.email).toBe("a@b.com");
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/api/v1/auth/signup");
  });
});
