import { describe, it, expect } from "vitest";
import { toCamelCase, toSnakeCase } from "../utils.js";

describe("toSnakeCase", () => {
  it("converts camelCase keys to snake_case", () => {
    const result = toSnakeCase({
      webhookUrl: "https://example.com",
      audioHandlerUrl: "wss://example.com",
      statusCallbackUrl: null,
    });
    expect(result).toEqual({
      webhook_url: "https://example.com",
      audio_handler_url: "wss://example.com",
      status_callback_url: null,
    });
  });

  it("handles nested objects", () => {
    const result = toSnakeCase({
      lineId: "abc",
      callInfo: { fromNumber: "+1234", toNumber: "+5678" },
    });
    expect(result).toEqual({
      line_id: "abc",
      call_info: { from_number: "+1234", to_number: "+5678" },
    });
  });
});

describe("toCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    const result = toCamelCase<Record<string, unknown>>({
      phone_number: "+14155550123",
      line_id: "abc-123",
      created_at: "2026-01-01T00:00:00Z",
      is_default: true,
    });
    expect(result).toEqual({
      phoneNumber: "+14155550123",
      lineId: "abc-123",
      createdAt: "2026-01-01T00:00:00Z",
      isDefault: true,
    });
  });

  it("handles arrays and nested objects", () => {
    const result = toCamelCase<{ items: Array<{ lineId: string }> }>({
      items: [
        { line_id: "a", phone_number: "+1" },
        { line_id: "b", phone_number: "+2" },
      ],
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].lineId).toBe("a");
  });

  it("passes through null and undefined", () => {
    expect(toCamelCase(null)).toBeNull();
    expect(toCamelCase(undefined)).toBeUndefined();
  });

  it("passes through primitive values", () => {
    expect(toCamelCase("hello")).toBe("hello");
    expect(toCamelCase(42)).toBe(42);
  });
});
