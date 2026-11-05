"use client";

import { useTransition } from "react";
import { dictionary, type Locale, LOCALES } from "@/lib/i18n";
import { setLocale } from "../actions";

// Lists every language the app has, each in its own name. Learners choose one in onboarding,
// and change it here.
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const [pending, startSwitching] = useTransition();

  return (
    <label className="flex min-h-14 items-center justify-between gap-4 px-4">
      <span className="font-semibold">{dictionary(locale).language}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startSwitching(async () => void (await setLocale(next)));
        }}
        // 16px text, or iOS zooms in when the menu opens.
        className="min-h-11 cursor-pointer rounded-lg bg-transparent text-right text-base text-muted hover:text-foreground disabled:opacity-50"
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
