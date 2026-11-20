"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS, type Locale } from "@/lib/i18n";

// The language switch on the welcome page, for visitors: only the cookie, as there's no profile
// yet. Signing up then takes it on as the profile's language.
export async function setVisitorLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}
