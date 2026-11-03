"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

// email is returned so the form can restore it: React resets forms after an action.
export type AuthState = { email?: string; error?: string; message?: string };

export async function authenticate(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  if (formData.get("intent") === "signup") {
    const origin = (await headers()).get("origin");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The new profile takes the language the learner signed up in.
      options: { emailRedirectTo: `${origin}/auth/callback`, data: { locale: await getLocale() } },
    });
    if (error) return { email, error: error.message };
    if (!data.session) return { email, message: (await getDictionary()).login.confirmEmail };
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { email, error: error.message };

    // The profile's language wins over the browser's, so the app looks the same on every device.
    const { data: profile } = await supabase
      .from("profiles")
      .select("locale")
      .eq("id", data.user.id)
      .maybeSingle();
    if (isLocale(profile?.locale)) {
      (await cookies()).set(LOCALE_COOKIE, profile.locale, LOCALE_COOKIE_OPTIONS);
    }
  }

  redirect("/learn");
}
