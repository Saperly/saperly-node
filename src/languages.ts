/**
 * v0.5.10 — Languages supported by Saperly's Deepgram nova-3 STT integration.
 *
 * Source of truth shared between:
 *   - Audio-relay: services/audio-relay/src/s2t/deepgram.ts validates config.language
 *     against this list, falls back to 'multi' on unsupported codes.
 *   - DB: drizzle/0046_lines_language.sql CHECK constraint mirrors this set.
 *     Drift between the two is caught by the vitest in
 *     src/__tests__/db/lines-language-drift.test.ts.
 *   - Portal: src/components/portal/LineEditForm imports LANGUAGE_LABELS for the
 *     dropdown.
 *   - Public API: src/lib/api/schemas.ts validates incoming language field.
 *
 * Adding a language requires:
 *   1. Append to SUPPORTED_LANGUAGES + LANGUAGE_LABELS here
 *   2. Migration to extend the CHECK constraint
 *   3. Re-run the drift test
 *
 * 'multi' means "no pin, let Deepgram nova-3 auto-detect per fragment." This is
 * the DB default and the safe fallback. Other values pin Deepgram to that
 * specific language for the call's lifetime.
 */
export const SUPPORTED_LANGUAGES = [
  "multi", "en", "he", "es", "ar", "ru", "fr", "de",
  "pt", "it", "pl", "nl", "tr", "ja", "zh",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  multi: "Multi (auto-detect)",
  en: "English", he: "Hebrew", es: "Spanish", ar: "Arabic", ru: "Russian",
  fr: "French", de: "German", pt: "Portuguese", it: "Italian", pl: "Polish",
  nl: "Dutch", tr: "Turkish", ja: "Japanese", zh: "Chinese",
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
