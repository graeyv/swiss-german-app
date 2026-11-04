import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS, localeFromAcceptLanguage } from "@/lib/i18n";

const PROTECTED_PATHS = ["/learn", "/lessons", "/flashcards", "/onboarding"];

function redirectTo(path: string, request: NextRequest, response: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  // Keep any refreshed session cookies, or the user is logged out on the next request.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  // On the first visit, the browser's language becomes the app's. Setting it on the request too
  // means this very page already renders in it.
  const newLocale = request.cookies.has(LOCALE_COOKIE)
    ? null
    : localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (newLocale) request.cookies.set(LOCALE_COOKIE, newLocale);
  const withLocale = (response: NextResponse) => {
    if (newLocale) response.cookies.set(LOCALE_COOKIE, newLocale, LOCALE_COOKIE_OPTIONS);
    return response;
  };

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isProtected && !isLoggedIn) return withLocale(redirectTo("/login", request, response));
  if (pathname === "/login" && isLoggedIn) return withLocale(redirectTo("/learn", request, response));

  return withLocale(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|mp3)$).*)"],
};
