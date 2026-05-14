/**
 * @saperly/webhook-sig — HMAC signing + verification for Saperly outbound webhooks.
 *
 * Single source of truth for the Phase 3F Team 2 signing contract. Both the
 * Next.js app (outbound senders) and the audio-relay service (per-message and
 * call_started deliveries) import from here so the signature format cannot
 * drift between the two processes.
 *
 * Signature contract (v1):
 *   - HMAC-SHA256 over `${timestamp}.${deliveryId}.${rawBody}`
 *   - Encoded hex, prefixed with the version marker: `v1=<hex>`
 *   - timestamp is unix SECONDS (not milliseconds) to match GitHub / Stripe
 *     norms and keep wire size reasonable
 *   - deliveryId is a UUID v4 unique per delivery attempt, signed so replays
 *     from the HTTP layer do not survive receiver-side dedupe
 *
 * Verification defeats replay only if the receiver:
 *   1. checks the timestamp is within a 5-minute window
 *   2. dedupes delivery_id for at least 5 minutes
 *   3. verifies the signature with constant-time comparison
 *
 * We expose the primitives so both SDKs (TypeScript here, Python as an
 * independent pure implementation) can give developers an idiomatic helper.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const SIGNATURE_VERSION = "v1" as const;
export const TIMESTAMP_HEADER = "x-saperly-timestamp";
export const DELIVERY_ID_HEADER = "x-saperly-delivery-id";
export const SIGNATURE_HEADER = "x-saperly-signature";

/** Default replay window. Receivers should honor the same (or smaller). */
export const DEFAULT_CLOCK_TOLERANCE_SEC = 300;

export interface SignInput {
  /** Raw request body — stringified JSON, NOT a pre-parsed object. */
  body: string;
  /** Per-line webhook signing secret from `lines.webhook_secret_current`. */
  secret: string;
  /**
   * Unix seconds. Defaults to `Math.floor(Date.now() / 1000)` at call time.
   * Override for deterministic test fixtures.
   */
  timestamp?: number;
  /**
   * UUID v4 per delivery attempt. Defaults to `crypto.randomUUID()`.
   * Override for deterministic test fixtures or delivery-log attribution.
   */
  deliveryId?: string;
}

export interface SignedDelivery {
  timestamp: number;
  deliveryId: string;
  signature: string;
  /** Pre-built headers object to spread into a `fetch` `headers:` option. */
  headers: Record<string, string>;
}

export interface VerifyOptions {
  /**
   * Allowed clock skew in seconds. Receiver clamps to this window either side
   * of its own `now()`. Default 5 minutes (GitHub/Stripe convention).
   */
  clockToleranceSec?: number;
  /**
   * Injectable clock for deterministic testing. Defaults to `Date.now()`.
   */
  now?: () => number;
}

export type VerifyReason =
  | "missing_timestamp"
  | "missing_delivery_id"
  | "missing_signature"
  | "malformed_timestamp"
  | "malformed_signature"
  | "unknown_version"
  | "stale_timestamp"
  | "signature_mismatch";

export interface VerifyResult {
  valid: boolean;
  reason?: VerifyReason;
}

/**
 * Compute the signature over `${timestamp}.${deliveryId}.${body}`.
 * Does not prefix with the version marker — use {@link formatSignature}
 * if you need the wire format.
 */
export function computeSignature(
  body: string,
  secret: string,
  timestamp: number,
  deliveryId: string,
): string {
  const payload = `${timestamp}.${deliveryId}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Format a raw hex digest as the versioned signature header value. */
export function formatSignature(hex: string): string {
  return `${SIGNATURE_VERSION}=${hex}`;
}

/**
 * Produce the three headers + metadata for one signed delivery. The caller
 * is responsible for actually issuing the HTTPS POST (and, per PR3, routing
 * the request through `safeFetch`).
 */
export function sign(input: SignInput): SignedDelivery {
  const timestamp =
    input.timestamp ?? Math.floor(Date.now() / 1000);
  const deliveryId = input.deliveryId ?? randomUUID();
  const hex = computeSignature(input.body, input.secret, timestamp, deliveryId);
  const signature = formatSignature(hex);
  return {
    timestamp,
    deliveryId,
    signature,
    headers: {
      [TIMESTAMP_HEADER]: String(timestamp),
      [DELIVERY_ID_HEADER]: deliveryId,
      [SIGNATURE_HEADER]: signature,
    },
  };
}

/**
 * Verify a received body + headers against a candidate secret. Accepts lookup
 * headers in either case (HTTP headers are case-insensitive per RFC 7230).
 *
 * Returns `{ valid: true }` when the signature matches AND the timestamp is
 * inside the configured tolerance. On failure, `reason` is populated with a
 * machine-readable code so callers can distinguish "stop accepting this
 * payload forever" (mismatch) from "retry later" (stale timestamp).
 *
 * Note: this function does NOT dedupe `delivery_id`. That is receiver-side
 * state; we cannot provide it cross-process. Docs instruct integrators to
 * cache delivery IDs for at least the clock-tolerance window.
 */
export function verify(
  body: string,
  secret: string,
  headers: Record<string, string | string[] | undefined>,
  options: VerifyOptions = {},
): VerifyResult {
  const tolerance = options.clockToleranceSec ?? DEFAULT_CLOCK_TOLERANCE_SEC;
  const now = options.now?.() ?? Date.now();

  const tsHeader = headerValue(headers, TIMESTAMP_HEADER);
  if (!tsHeader) return { valid: false, reason: "missing_timestamp" };

  const deliveryId = headerValue(headers, DELIVERY_ID_HEADER);
  if (!deliveryId) return { valid: false, reason: "missing_delivery_id" };

  const sigHeader = headerValue(headers, SIGNATURE_HEADER);
  if (!sigHeader) return { valid: false, reason: "missing_signature" };

  const timestamp = Number.parseInt(tsHeader, 10);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return { valid: false, reason: "malformed_timestamp" };
  }

  const [version, providedHex] = sigHeader.split("=", 2);
  if (!providedHex) return { valid: false, reason: "malformed_signature" };
  if (version !== SIGNATURE_VERSION) {
    return { valid: false, reason: "unknown_version" };
  }

  const expectedHex = computeSignature(body, secret, timestamp, deliveryId);
  if (expectedHex.length !== providedHex.length) {
    return { valid: false, reason: "signature_mismatch" };
  }
  const expectedBuf = Buffer.from(expectedHex, "utf8");
  const providedBuf = Buffer.from(providedHex, "utf8");
  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    return { valid: false, reason: "signature_mismatch" };
  }

  // Timestamp check runs AFTER signature so an attacker cannot distinguish
  // "stale but valid signature" from "fresh but invalid signature" by timing.
  const nowSec = Math.floor(now / 1000);
  if (Math.abs(nowSec - timestamp) > tolerance) {
    return { valid: false, reason: "stale_timestamp" };
  }

  return { valid: true };
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  // HTTP headers are case-insensitive per RFC 7230; normalize the lookup.
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const v = headers[key];
      if (Array.isArray(v)) return v[0];
      return v;
    }
  }
  return undefined;
}
