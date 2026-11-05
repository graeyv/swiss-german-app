import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { LanguageSwitch } from "./language-switch";

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Profile />
    </Suspense>
  );
}

// The account and its settings. More settings, such as the daily pace, can join the language.
async function Profile() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  return (
    <>
      <title>{t.title(t.profile.title)}</title>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        {email && <p className="text-sm break-all text-muted">{t.profile.loggedInAs(email)}</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{t.profile.settings}</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          <LanguageSwitch locale={locale} />
        </div>
      </section>

      <form action={signOut}>
        <button className="min-h-12 w-full rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-accent">
          {t.profile.logOut}
        </button>
      </form>
    </>
  );
}
