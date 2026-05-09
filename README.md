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
  mode: "text",
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

## Resources

### Lines

```typescript
client.lines.create({ name, mode, webhookUrl?, audioHandlerUrl?, statusCallbackUrl? })
client.lines.list()
client.lines.get(lineId)
client.lines.delete(lineId)
```

### Calls

```typescript
client.calls.create({ lineId, toNumber })
client.calls.list({ lineId?, status?, limit?, offset? })
client.calls.get(callId)
client.calls.hangup(callId)
```

### Consent

```typescript
client.consent.grant({ lineId, phoneNumber, consentType, source })
client.consent.check({ phoneNumber, lineId? })
client.consent.revoke({ phoneNumber, lineId? })
```

### Compliance

```typescript
client.compliance.audit({ lineId?, phoneNumber?, eventType?, from?, to?, limit?, offset? })
```

### Disclosures

```typescript
client.disclosures.create({ message, language? })
client.disclosures.list()
```

### Billing

```typescript
client.billing.balance()
```

> **Note:** The billing balance endpoint is not yet available (ships in Phase 5). Calling `billing.balance()` will throw a `NotFoundError` until then.

## SMS

SMS supports both inbound (your line receives incoming text messages and your webhook gets `sms_received` events) AND outbound via `client.messages.send()`. Outbound SMS requires either an inbound from the recipient within the last 24 hours OR an active `explicit_outbound` consent record on file for that (line, recipient) pair (recorded via `POST /v1/consent` or a documented web-form opt-in).

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

Error classes: `ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ConsentRequiredError`, `ConsentAlreadyGrantedError`, `CallInProgressError`, `CallNotActiveError`, `InsufficientCreditsError`, `PaymentMethodRequiredError`, `NumberOptedOutError`, `EmailTakenError`.

## Programmatic signup

Create an account without an existing API key:

```typescript
import { Saperly } from "@saperly/sdk";

const { user } = await Saperly.register({
  email: "agent@mycompany.com",
  password: "secure-password",
  name: "My Agent",
});
```

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

Migrating from an earlier version? See [v0.3.0.0 migration guide](https://saperly.com/docs/migrations/v0.3.0.0).

## License

MIT
