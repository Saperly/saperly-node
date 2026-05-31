# @saperly/sdk changelog

All notable changes to the TypeScript SDK. Versions follow the platform release cadence.

## [0.6.0] (2026-05-31) Saperly voice catalog (breaking)

### Changed (breaking)

- `Voice` is now `{ slug, name, gender, accent, description, languages }`. The
  previous `id` field is renamed to `slug` (a Saperly voice slug — set it as
  `Line.voice`), `style` is renamed to `description`, and `languages: string[]`
  is added. Vendor voice ids are no longer exposed by the API or SDK. Update any
  code reading `voice.id`/`voice.style` to `voice.slug`/`voice.description`.

### Notes

- `Line.voice` is unchanged in type (`string | null`) but now carries a Saperly
  slug rather than a raw vendor voice id. Use `client.voices.list()` to discover
  valid slugs.

## [0.4.0] (2026-05-13) agent-native key management

### Added

- `client.keys.*` resource: `create`, `list`, `get`, `update`, `rotate`, `delete`. Mint, rotate, and revoke child API keys from a service key (`sk_svc_…`).
- `client.audit.list()` unified audit feed: calls, SMS, compliance events, and billing scoped to the caller's key. Time-sorted DESC, max 500 events per call.
- New response field `created_by_service_key_id` on child API keys, so every call placed with a child key traces back to the service key that minted the credential.

### Fixed

- `child.plaintextKey` is the canonical field name (the v0.5.7.0 README example briefly showed `child.rawKey`. that property never existed on the response type).
- `messages.send` accepts `{ lineId, to, text }`. The earlier docs example used `{ toNumber, body }` which did not match `SendMessageParams`.

### Notes

- Idempotency-Key header is required on `POST /v1/keys` and `POST /v1/keys/{id}/rotate`, and recommended on `POST /v1/calls` and `POST /v1/messages`. The SDK auto-generates a UUID v4 for the two key endpoints when one is not supplied; pass `idempotencyKey` explicitly for cross-process retry safety.

## [0.3.0] (2026-04-19) mode rename

### Breaking

- `Line.mode` type narrowed: was `"text" | "audio"`, now `"webhook" | "audio" | "hosted" | (string & {})`. `"text"` removed (the API renamed text mode to webhook mode; legacy DB rows still render as `"webhook"` via client-side normalization). `"hosted"` added (was a type hole on 0.2.0). Widened with `(string & {})` for forward-compat.
- `CreateLineParams.mode` and `UpdateLineParams.mode`: same change. Replace `mode === "text"` with `mode === "webhook"`.

### Changed

- `normalizeMode` is now fail-open. Was: threw on unrecognized values. Now: logs a one-time `console.warn` per distinct value and passes through the raw string. A future server-side mode won't crash pinned clients.

### Fixed

- Type holes on 0.2.0: `"hosted"` missing from `Line.mode`, `CreateLineParams.mode`, and `UpdateLineParams.mode`.

## [0.2.0]

Published with the broken types fixed in 0.3.0.

## [0.1.0]

Initial release.
