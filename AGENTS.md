# AGENTS.md: @saperly/sdk

Patterns and pitfalls for AI coding agents (Claude Code, Cursor, Codex, OpenClaw) integrating the Saperly TypeScript SDK. If you are an AI agent reading this autonomously, the canonical patterns below are tested and current as of v0.4.0.

## 1. What Saperly is

Saperly is the phone carrier for AI agents. One API call gives any agent a real phone number with TCPA compliance, consent capture, and an audit trail built in. Hosted mode runs the AI for you (Saperly handles speech-to-text, the LLM call, and text-to-speech). Webhook mode lets your backend decide responses turn by turn. Audio mode streams raw audio over a WebSocket if you need full control of the media plane.

## 2. Installation

```bash
npm install @saperly/sdk
```

```typescript
import { Saperly } from "@saperly/sdk";

const saperly = new Saperly({ apiKey: process.env.SAPERLY_API_KEY! });
```

Requires Node.js 18+ (uses global `fetch`). The SDK has zero direct runtime dependencies aside from the small `@saperly/webhook-sig` helper.

## 3. Authentication

Saperly uses a two-tier credential model. Both authenticate via `Authorization: Bearer <key>` on the wire; the prefix tells the auth dispatcher which tier you're on.

| Credential | Prefix | What it does | Where to get it |
| --- | --- | --- | --- |
| API key | `sk_test_…` / `sk_live_…` | Place calls, send SMS, manage lines, query usage, read `/v1/audit`. | Portal, or minted by a service key via `POST /v1/keys`. |
| Service key | `sk_svc_test_…` / `sk_svc_live_…` | Mint, list, get, update, rotate, revoke child API keys. Credential management only. | Portal only (Settings → Service Keys). |

Child API keys minted by a service key carry their own scope. The API accepts exactly four permission tiers on `POST /v1/keys` and `PATCH /v1/keys/{id}`. A fifth value, `legacy_full`, appears on responses for keys minted before v0.5.7.0 but cannot be set via the API.

| Permission | Settable | Returned | What it does |
| --- | --- | --- | --- |
| `full` | yes | yes | All call, SMS, line, and account operations. |
| `call_only` | yes | yes | Place and inspect calls; no SMS, no line mutation. |
| `sms_only` | yes | yes | Send and inspect SMS; no calls, no line mutation. |
| `read_only` | yes | yes | GETs only; no mutations. |
| `legacy_full` | no | yes | Backfill marker for keys minted before v0.5.7.0. |

Service keys cannot mint other service keys via API. The bootstrap step is portal-only by design (Stripe restricted-keys pattern). If you lose every service key, recover via the portal.

## 4. Core resources

- `lines`: Provision and manage phone numbers (hosted, webhook, or audio mode).
- `calls`: Place and monitor outbound calls, run hosted conversation calls.
- `messages`: Send and receive SMS, list conversations.
- `keys`: Mint, rotate, revoke child API keys (service key only).
- `consent`: Record explicit caller consent for TCPA compliance.
- `disclosures`: Configure inbound disclosure scripts.
- `webhooks`: Track event delivery; verify via signed HMAC-SHA256.
- `audit`: Read the immutable compliance event stream.

## 5. Canonical patterns

### Provision a hosted line

```typescript
import { Saperly } from "@saperly/sdk";

const saperly = new Saperly({ apiKey: process.env.SAPERLY_API_KEY! });

const line = await saperly.lines.create({
  name: "my agent",
  mode: "hosted",
  systemPrompt: "You are a helpful assistant.",
});

console.log(line.phoneNumber);
```

Reuse an existing line by name before provisioning a new one. Phone numbers cost $2.50/month each (first number free for 30 days).

### Place a test outbound call

```typescript
const call = await saperly.calls.create({
  lineId: line.id,
  toNumber: "+14155551234", // your real E.164 number
});

console.log(call.id, call.status);
```

Ask the human operator for `toNumber` before placing the call. Never call `+1 555-0100` through `+1 555-0199`; those are reserved test numbers that will never connect.

### Mint a child API key (service key auth)

```typescript
import { Saperly } from "@saperly/sdk";

const svc = new Saperly({ apiKey: process.env.SAPERLY_SERVICE_KEY! });

const child = await svc.keys.create({
  name: "voice-agent-prod",
  lineId: "line_xyz",
  permissions: "call_only",
  monthlyCapCents: 500,
});

// First and only chance to read the plaintext. Save it now.
console.log(child.plaintextKey);
```

`plaintextKey` is returned once on create. Store it in your secrets manager immediately; the server never re-emits it. The SDK auto-generates a UUID v4 `Idempotency-Key` per call; pass your own via `idempotencyKey` in the params object if you need cross-process retry safety.

### Rotate a service-minted key

```typescript
const rotated = await svc.keys.rotate(child.id);

console.log(rotated.plaintextKey); // new plaintext, old is dead
```

Rotation is atomic: the old plaintext stops working the instant the response returns.

## 6. Required headers

- `Authorization: Bearer <key>`: always. The SDK sets this from the `apiKey` constructor option.
- `Idempotency-Key: <uuid>`: required on `POST /v1/keys` and `POST /v1/keys/{id}/rotate`. The SDK auto-generates a UUID v4 for these endpoints when you don't supply one; pass your own via `idempotencyKey` (inside `keys.create` params, or inside the `keys.rotate` options object) for cross-process retry safety. Recommended on `POST /v1/calls` and `POST /v1/messages` for the same reason.
- `Content-Type: application/json`: set by the SDK on every body-carrying request.

## 7. Common pitfalls

1. **`plaintextKey` is returned once.** `keys.create` and `keys.rotate` emit the plaintext exactly once. Read it from the response and persist it in your secrets store before doing anything else. There is no read-back endpoint.
2. **Camel case in TypeScript, snake case on the wire.** The SDK uses `systemPrompt`, `lineId`, `toNumber`, `monthlyCapCents`. The REST API receives `system_prompt`, `line_id`, `to_number`, `monthly_cap_cents`. Mixing them produces 422 validation errors.
3. **`lineId` must be set for line-scoped child keys.** Omit `lineId` on `keys.create` for an account-wide key. Setting `lineId` to a string scopes the child key to that one line; the line must exist, be owned by the same account, match the service key's environment (test or live), and not be released.
4. **Reserved test numbers never connect.** `+1 555-0100` through `+1 555-0199` are documented test ranges. Any call placed to them returns success on `POST /v1/calls` but never establishes media. Use a real phone you control for end-to-end tests.

## 8. Resources

- Docs: https://docs.saperly.com
- Quickstart: https://docs.saperly.com/quickstart
- Agent onboarding: https://docs.saperly.com/agent-onboarding
- Service keys: https://docs.saperly.com/service-keys
- API reference: https://docs.saperly.com/api-reference
- llms.txt: https://saperly.com/llms.txt
- Issues: https://github.com/Saperly/saperly-node/issues
- Source: https://github.com/Saperly/saperly-node
