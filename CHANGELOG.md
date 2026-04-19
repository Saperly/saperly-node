# @saperly/sdk — Changelog

## 0.3.0 — 2026-04-19

### Breaking

- **`Line.mode` type narrowed**: was `"text" | "audio"`. Now `"webhook" | "audio" | "hosted" | (string & {})`.
  - `"text"` removed (the API renamed text mode to webhook mode — legacy DB rows still render as `"webhook"` via client-side normalization).
  - `"hosted"` added (was a type hole — hosted lines worked at runtime but failed typecheck on 0.2.0).
  - Widened with `(string & {})` for forward-compat: a future server-side mode (e.g. `"realtime"`) won't crash pinned clients.
- **`CreateLineParams.mode` and `UpdateLineParams.mode`**: same change — no more `"text"`, added `"hosted"`.

If you had `mode === "text"` in your code, replace with `mode === "webhook"`.

### Changed

- **`normalizeMode` is now fail-OPEN.** Was: throws `Unexpected line.mode value from API: ${raw}` on any unrecognized value. Now: logs a one-time `console.warn` per distinct value and passes through the raw string. A future API-side mode addition won't crash existing SDK consumers.

### Fixed

- Type holes on 0.2.0: `"hosted"` missing from Line.mode / CreateLineParams.mode / UpdateLineParams.mode.

## 0.2.0

- (published to npm with the broken types above — fixed in 0.3.0)

## 0.1.0

- Initial release.
