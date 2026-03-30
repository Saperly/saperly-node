# @saperly/sdk

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

SMS is inbound only for MVP. Your line receives incoming text messages and your webhook gets `sms_received` events. Outbound SMS coming soon.

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

Error classes: `ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ConsentRequiredError`, `ConsentAlreadyGrantedError`, `CallInProgressError`, `CallNotActiveError`, `InsufficientCreditsError`, `NumberOptedOutError`, `EmailTakenError`.

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

## License

MIT
