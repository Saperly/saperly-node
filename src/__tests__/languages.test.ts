import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  isSupportedLanguage,
} from "../languages.js";

describe("SUPPORTED_LANGUAGES", () => {
  it("lists 'multi' first as the default/fallback", () => {
    expect(SUPPORTED_LANGUAGES[0]).toBe("multi");
  });
});

describe("LANGUAGE_LABELS", () => {
  it("has exactly the same set of keys as SUPPORTED_LANGUAGES values", () => {
    const labelKeys = new Set(Object.keys(LANGUAGE_LABELS));
    const supported = new Set<string>(SUPPORTED_LANGUAGES);

    // Every supported language has a label.
    for (const lang of supported) {
      expect(labelKeys.has(lang)).toBe(true);
    }
    // Every label corresponds to a supported language (no orphan labels).
    for (const key of labelKeys) {
      expect(supported.has(key)).toBe(true);
    }
    // Same cardinality → exact set equality (catches dupes/extras).
    expect(labelKeys.size).toBe(supported.size);
  });
});

describe("isSupportedLanguage", () => {
  it("returns true for a supported code", () => {
    expect(isSupportedLanguage("he")).toBe(true);
  });

  it("returns false for an unsupported code", () => {
    expect(isSupportedLanguage("xx")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isSupportedLanguage("Multi")).toBe(false);
  });
});
