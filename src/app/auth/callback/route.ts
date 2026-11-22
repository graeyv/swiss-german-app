import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

// Where the email confirmation link and Google sign-in return to. Learners who have finished the
// onboarding go on to Learn, everyone else to the onboarding.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login", request.url));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("locale, onboarded_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.onboarded_at) {
    // The profile's language wins over the browser's, as when logging in with a password.
    const response = NextResponse.redirect(new URL("/learn", request.url));
    if (isLocale(profile.locale)) response.cookies.set(LOCALE_COOKIE, profile.locale, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  // An account made with Google has no language of its own, as signing up by email gives it: it
  // takes the one the learner chose on the welcome page.
  if (!isLocale(data.user.user_metadata.locale)) {
    await supabase.from("profiles").update({ locale: await getLocale() }).eq("id", data.user.id);
  }
  return NextResponse.redirect(new URL("/onboarding", request.url));
}
