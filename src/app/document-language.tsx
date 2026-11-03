"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

// Sets <html lang>, which screen readers and spell checkers use. The root layout can't read
// the language cookie itself without making every page wait for it, so this sets it once
// the page knows the language.
export function DocumentLanguage({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
