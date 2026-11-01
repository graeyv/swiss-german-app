"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return { email, error: error.message };
    if (!data.session) return { email, message: "Check your email to confirm your account." };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { email, error: error.message };
  }

  redirect("/learn");
}
