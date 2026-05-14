# @saperly/sdk

Typed TypeScript client for the Saperly API. The phone carrier for AI agents.

One API call gives your agent a real phone number with TCPA compliance, consent capture, and an audit trail built in. Zero runtime dependencies, Node.js 18+.

## Install

```bash
npm install @saperly/sdk
```

## Quickstart

Provision a hosted line and print its phone number.

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

Get an API key at [saperly.com/settings/keys](https://saperly.com/settings/keys). Signup is portal-only (magic link, Google, or GitHub).

## Auth

Saperly uses a two-tier credential model. Both authenticate via `Authorization: Bearer <key>`.

| Credential | Use case |
| --- | --- |
| API key (`sk_live_…`, `sk_test_…`) | Place calls, send SMS, manage lines, read usage and audit. |
| Service key (`sk_svc_live_…`, `sk_svc_test_…`) | Mint, rotate, and revoke child API keys via `POST /v1/keys`. Credential management only. |

Child API keys minted by a service key carry their own scope: `full`, `call_only`, `sms_only`, or `read_only`, optionally bound to a single `line_id` with a `monthly_cap_cents` ceiling. Full reference at [docs.saperly.com/service-keys](https://docs.saperly.com/service-keys).

## Resources

- Docs: https://docs.saperly.com
- Quickstart: https://docs.saperly.com/quickstart
- Agent onboarding: https://docs.saperly.com/agent-onboarding
- Service keys: https://docs.saperly.com/service-keys
- Patterns and pitfalls: [./AGENTS.md](./AGENTS.md)
- API reference: https://docs.saperly.com/api-reference
- Issues: https://github.com/Saperly/saperly-node/issues
- Discord: invite link in our docs

## License

MIT. See [LICENSE](./LICENSE).

## Contact

hello@saperly.com or open an issue.
