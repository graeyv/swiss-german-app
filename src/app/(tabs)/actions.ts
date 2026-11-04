"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Saves the language on the profile, so it follows the learner to other devices, and in the
// cookie the app reads it from.
export async function setLocale(locale: Locale): Promise<{ error?: string }> {
  if (!isLocale(locale)) return { error: "Unknown language" };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  const { error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", claims.claims.sub);
  if (error) return { error: error.message };

  (await cookies()).set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
  return {};
}
