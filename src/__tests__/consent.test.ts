import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly } from "../index.js";
import { ConsentAlreadyGrantedError } from "../errors.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ConsentResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("grant duplicate throws ConsentAlreadyGrantedError", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          error: {
            code: "consent_already_granted",
            message: "Active consent already exists for this line and phone number.",
          },
        }),
    } as unknown as Response);

    await expect(
      client.consent.grant({
        lineId: "line-1",
        phoneNumber: "+14155551234",
        consentType: "explicit_outbound",
        source: "api",
      }),
    ).rejects.toThrow(ConsentAlreadyGrantedError);
  });
});
