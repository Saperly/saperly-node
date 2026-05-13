# @saperly/sdk

> **Published at [github.com/Saperly/saperly-node](https://github.com/Saperly/saperly-node).** This copy in the monorepo is the development source.

Typed TypeScript client for the [Saperly](https://saperly.com) API. Give any AI agent a phone number with compliance built in.

## Install

```bash
npm install @saperly/sdk
```

Requires Node.js 18+ (uses global `fetch`). Zero runtime dependencies.

## Quick start

```typescript
import { Saperly } from "@saperly/sdk";

const client = new Saperly({ apiKey: "sk_live_..." });

// Provision a phone line
const line = await client.lines.create({
  name: "support bot",
  mode: "webhook",
  webhookUrl: "https://myapp.com/calls",
});
console.log(line.phoneNumber); // +14155550123

// Make an outbound call
const call = await client.calls.create({
  lineId: line.id,
  toNumber: "+14155551234",
});

// List all lines
const lines = await client.lines.list();
```

> Sign up first at https://saperly.com/login (magic-link) and mint an API key in the portal — there is no programmatic signup endpoint.

## Service keys + child API keys (v0.5.7.0)

A **service key** is a portal-minted root credential whose only job is to mint
**child API keys** programmatically via `POST /v1/keys`. Use this pattern when
an AI agent provisions its own key, scoped to a single line with a monthly
spend cap.

```typescript
import { Saperly } from "@saperly/sdk";

// Authenticated as a service key (sk_svc_...)
const root = new Saperly({ apiKey: "sk_svc_live_..." });

// Mint a scoped child api key for a specific agent
const child = await root.keys.create({
  name: "claude-prod-line-42",
  agentLabel: "claude-3-5-sonnet",
  lineId: "line_...",
  permissions: "call_only",
  monthlyCapCents: 5_000,
});
console.log(child.plaintextKey); // sk_live_... — shown ONCE; store securely

// List child keys (the audit feed)
const list = await root.keys.list();

// Read the unified audit feed scoped to the caller
const audit = await root.audit.list({ limit: 100 });
```

Idempotency: every POST to `/v1/keys` (and other mutating endpoints) accepts
an `Idempotency-Key` header. The SDK doesn't auto-add one — pass it through
the per-call options if you need replay safety.

## Resources

### Lines

```typescript
client.lines.create({ name, mode, webhookUrl?, audioHandlerUrl?, statusCallbackUrl? })
client.lines.list()
client.lines.get(lineId)
client.lines.update(lineId, params)
client.lines.delete(lineId)
client.lines.sendSms(lineId, { toNumber, message })
```

`mode` is `"webhook" | "audio" | "hosted"`. The REST API accepts the legacy
alias `"text"` (coerced to `"webhook"`) for back-compat; new code should use
`"webhook"` directly.

### Calls

```typescript
client.calls.create({ lineId, toNumber })
client.calls.conversation({ lineId, toNumber, topic, beginMessage?, maxDurationSeconds? })
client.calls.list({ lineId?, status?, limit?, offset? })
client.calls.get(callId)
client.calls.hangup(callId)
```

### Messages (SMS)

```typescript
client.messages.send({ lineId, to, text })
```

Outbound SMS requires either an inbound from the recipient within the last
24 hours OR an active `explicit_outbound` consent record on file for that
(line, recipient) pair.

### Conversations

```typescript
client.conversations.list({ lineId?, limit?, cursor? })
client.conversations.messages(lineId, phoneNumber, { limit?, cursor? })
```

### Consent

```typescript
client.consent.grant({ lineId, phoneNumber, consentType, source })
client.consent.check({ phoneNumber, lineId? })
client.consent.revoke({ phoneNumber, lineId? })
```

### Compliance + Audit

```typescript
client.compliance.audit({ lineId?, phoneNumber?, eventType?, from?, to?, limit?, offset? })
client.audit.list({ limit?, offset?, from?, to? })
```

### Disclosures

```typescript
client.disclosures.create({ message, language? })
client.disclosures.list()
```

### Keys (service-key auth required)

```typescript
client.keys.create({ name, agentLabel?, lineId?, permissions?, monthlyCapCents? })
client.keys.list({ limit?, offset? })
client.keys.get(keyId)
client.keys.update(keyId, params)
client.keys.rotate(keyId)
client.keys.delete(keyId)
```

### Billing

```typescript
client.billing.balance()
client.billing.transactions({ limit?, offset? })
```

Saperly is postpaid (Stripe LIVE in production since v0.5.5.2). When your
balance runs low, the card on file is auto-charged. To add or update a
payment method, direct the user to https://saperly.com/billing.

### Webhooks (delivery tracking)

```typescript
client.webhooks.deliveries({ lineId?, status?, limit?, offset? })
client.webhooks.stats({ lineId? })
client.webhooks.test({ lineId, eventType? })
```

### Usage

```typescript
client.usage.daily({ from?, to? })
client.usage.monthly({ from?, to? })
```

### Settings + Voices

```typescript
client.settings.get()
client.settings.update({ defaultWebhookUrl? })
client.voices.list()
```

## Automatic Retries

GET and DELETE requests automatically retry once on 5xx errors and network failures, with a 1-second delay. POST/PUT/PATCH requests are never retried to prevent duplicate side effects.

## Error handling

All API errors are mapped to typed exceptions:

```typescript
import { Saperly, ConsentRequiredError } from "@saperly/sdk";

const client = new Saperly({ apiKey: "sk_live_..." });

try {
  await client.calls.create({ lineId: "...", toNumber: "+14155551234" });
} catch (err) {
  if (err instanceof ConsentRequiredError) {
    // Grant consent first, then retry
    await client.consent.grant({
      lineId: "...",
      phoneNumber: "+14155551234",
      consentType: "explicit_outbound",
      source: "api",
    });
  }
}
```

Error classes: `ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ConsentRequiredError`, `ConsentAlreadyGrantedError`, `CallInProgressError`, `CallNotActiveError`, `InsufficientCreditsError` (legacy alias — fires when USD balance is insufficient; rename planned for next breaking release), `PaymentMethodRequiredError`, `NumberOptedOutError`.

## Configuration

```typescript
const client = new Saperly({
  apiKey: "sk_live_...",
  baseUrl: "http://localhost:3000", // optional, for local dev
});
```

## Verifying webhooks

Every Saperly webhook is signed. `verifyWebhook(rawBody, secret, headers)` returns `{ valid, reason? }`.

```typescript
import express from "express";
import { verifyWebhook } from "@saperly/sdk";

const app = express();
app.use(express.raw({ type: "application/json" }));

app.post("/saperly-webhook", async (req, res) => {
  const rawBody = req.body.toString("utf8");
  const { line_id } = JSON.parse(rawBody);
  const secret = await lookupSecretForLine(line_id); // your secret store
  const result = verifyWebhook(rawBody, secret, req.headers);
  if (!result.valid) return res.status(401).json({ error: result.reason });

  const event = JSON.parse(rawBody);
  // ... trusted, handle the event
});
```

The helper enforces the 5-minute clock-skew window and uses constant-time compare. You still need to cache `x-saperly-delivery-id` for 5 minutes and reject duplicates yourself — that cache is receiver-side state.

`verifyWebhook` is a thin wrapper over [`@saperly/webhook-sig`](https://www.npmjs.com/package/@saperly/webhook-sig). Advanced integrators can import `sign`, `verify`, `computeSignature`, or `formatSignature` from that package directly.

## Migration

- **v0.5.7.0** — Agent-native key management. New `client.keys.*` + `client.audit.list()`. Service keys mint scoped child api keys via `POST /v1/keys`. See [v0.5.7.0 migration guide](https://docs.saperly.com/migrations/v0.5.7.0).
- **v0.5.x** — Cents-honest USD pricing (replaces the credits abstraction). `client.billing.balance()` returns USD cents.
- **v0.3.0.0** — See [v0.3.0.0 migration guide](https://docs.saperly.com/migrations/v0.3.0.0).

## License

MIT
