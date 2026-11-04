import { cookies } from "next/headers";
import { DEFAULT_LOCALE, dictionary, isLocale, LOCALE_COOKIE, type Locale } from "./index";

// The current language. The proxy sets the cookie on the first visit, and logging in or
// choosing a language keeps it in line with the learner's profile.
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary() {
  return dictionary(await getLocale());
}
