import { describe, it, expect } from "vitest";
import { sign } from "../_internal/webhook-sig.js";
import { verifyWebhook } from "../webhooks-verify.js";

const SECRET = "test-secret-shhh";
const BODY = JSON.stringify({
  event: "sms_received",
  line_id: "00000000-0000-0000-0000-000000000001",
  from_number: "+15551234567",
});

describe("verifyWebhook", () => {
  it("returns valid for a signed payload", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const result = verifyWebhook(BODY, SECRET, signed.headers);
    expect(result.valid).toBe(true);
  });

  it("rejects tampered body", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const tampered = BODY.replace("+15551234567", "+15559999999");
    const result = verifyWebhook(tampered, SECRET, signed.headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("rejects when a header is missing", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const headers: Record<string, string> = { ...signed.headers };
    delete headers["x-saperly-timestamp"];
    const result = verifyWebhook(BODY, SECRET, headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_timestamp");
  });

  it("rejects stale timestamp beyond tolerance", () => {
    const oldTs = Math.floor(Date.now() / 1000) - 10 * 60; // 10 minutes ago
    const signed = sign({ body: BODY, secret: SECRET, timestamp: oldTs });
    const result = verifyWebhook(BODY, SECRET, signed.headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("stale_timestamp");
  });

  it("rejects unknown version prefix", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const headers: Record<string, string> = {
      ...signed.headers,
      "x-saperly-signature": signed.headers["x-saperly-signature"].replace(
        /^v1=/,
        "v2=",
      ),
    };
    const result = verifyWebhook(BODY, SECRET, headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unknown_version");
  });

  it("accepts case-insensitive header names", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const upper: Record<string, string> = {
      "X-Saperly-Timestamp": signed.headers["x-saperly-timestamp"],
      "X-Saperly-Delivery-Id": signed.headers["x-saperly-delivery-id"],
      "X-Saperly-Signature": signed.headers["x-saperly-signature"],
    };
    const result = verifyWebhook(BODY, SECRET, upper);
    expect(result.valid).toBe(true);
  });

  it("rejects malformed timestamp", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const headers: Record<string, string> = {
      ...signed.headers,
      "x-saperly-timestamp": "not-a-number",
    };
    const result = verifyWebhook(BODY, SECRET, headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("malformed_timestamp");
  });

  it("rejects malformed signature", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const headers: Record<string, string> = {
      ...signed.headers,
      "x-saperly-signature": "not-a-valid-signature",
    };
    const result = verifyWebhook(BODY, SECRET, headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("malformed_signature");
  });

  it("rejects tampered delivery_id", () => {
    const signed = sign({ body: BODY, secret: SECRET });
    const headers: Record<string, string> = {
      ...signed.headers,
      "x-saperly-delivery-id": "00000000-0000-4000-8000-000000000000",
    };
    const result = verifyWebhook(BODY, SECRET, headers);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });
});
