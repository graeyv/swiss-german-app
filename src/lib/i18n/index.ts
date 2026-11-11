// The app's languages. Safe to use in client components: the dictionaries are small.
//
// To add a language: write its dictionary next to en.ts, list it below, and add it to the
// public.locales table in a migration.
import { de } from "./de";
import { type Dictionary, en } from "./en";

export type { Dictionary };

const DICTIONARIES = { en, de } satisfies Record<string, Dictionary>;

export type Locale = keyof typeof DICTIONARIES;
export const LOCALES = Object.keys(DICTIONARIES) as Locale[];
export const DEFAULT_LOCALE: Locale = "en";

// The cookie holding the current language. Mirrors public.profiles.locale once logged in.
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

// Before a learner chooses, the browser decides: the first of its preferred languages that the
// app has, by language only ("de-CH" counts as "de").
export function localeFromAcceptLanguage(header: string | null): Locale {
  for (const part of (header ?? "").split(",")) {
    const language = part.split(";")[0].trim().split("-")[0].toLowerCase();
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

// The translation shown on a card: its Standard German where that is the language, otherwise its
// meaning in the learner's language (which falls back to English).
export function translationOf(card: { meaning: string; high_german: string }, locale: Locale) {
  return dictionary(locale).translationIsStandardGerman ? card.high_german : card.meaning;
}
