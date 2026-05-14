/**
 * Webhook signature verification for Saperly outbound deliveries.
 *
 * Every Saperly webhook carries three signed headers:
 *   - `x-saperly-timestamp` — unix seconds when the delivery was signed
 *   - `x-saperly-delivery-id` — UUID v4, unique per attempt
 *   - `x-saperly-signature: v1=<hex>` — HMAC-SHA256 over
 *     `${timestamp}.${delivery_id}.${rawBody}`
 *
 * Reject if `verify(...)` returns `{ valid: false }`. Additionally, implementers
 * must cache seen `delivery_id`s for at least the clock-tolerance window
 * (default 5 minutes) to defeat replay attacks. This helper cannot do that
 * deduplication on your behalf because it has no cross-request state.
 *
 * Example:
 * ```ts
 * import { verifyWebhook } from "@saperly/sdk";
 *
 * const rawBody = await req.text();
 * const result = verifyWebhook(rawBody, process.env.SAPERLY_WEBHOOK_SECRET!, req.headers);
 * if (!result.valid) {
 *   return new Response(`Invalid: ${result.reason}`, { status: 400 });
 * }
 * ```
 */

import { verify as verifySignature } from "./_internal/webhook-sig.js";
import type { VerifyOptions, VerifyResult } from "./_internal/webhook-sig.js";

export type WebhookHeaders = Record<string, string | string[] | undefined>;

export function verifyWebhook(
  rawBody: string,
  secret: string,
  headers: WebhookHeaders,
  options?: VerifyOptions,
): VerifyResult {
  return verifySignature(rawBody, secret, headers, options);
}

export type { VerifyOptions, VerifyResult } from "./_internal/webhook-sig.js";
