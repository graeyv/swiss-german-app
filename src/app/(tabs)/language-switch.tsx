"use client";

import { useTransition } from "react";
import { dictionary, type Locale, LOCALES } from "@/lib/i18n";
import { setLocale } from "./actions";

// Lists every language the app has, each in its own name. Until onboarding and settings exist,
// this is where learners choose.
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const [pending, startSwitching] = useTransition();

  return (
    <label className="flex min-h-11 items-center text-sm text-muted">
      <span className="sr-only">{dictionary(locale).language}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startSwitching(async () => void (await setLocale(next)));
        }}
        className="cursor-pointer rounded-lg bg-transparent py-1 pr-1 text-base hover:text-foreground disabled:opacity-50 sm:text-sm"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {dictionary(option).languageName}
          </option>
        ))}
      </select>
    </label>
  );
}
