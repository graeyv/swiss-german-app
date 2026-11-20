import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { Logo } from "@/app/ui/logo";
import { dictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { setVisitorLocale } from "./actions";
import { Conversation } from "./conversation";

// The welcome page, for anyone not logged in (the logged in go straight to Learn): the logo and a
// switch to the other language, a short conversation in Bärndütsch, one line on what Hoi is, and
// the way in at the bottom, within thumb reach. See DESIGN.md.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* The texts follow the language cookie, which is only known per request. */}
      <Suspense
        fallback={
          <header>
            <Logo />
          </header>
        }
      >
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const locale = await getLocale();
  const t = dictionary(locale);
  const other: Locale = locale === "de" ? "en" : "de";

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <Logo />
        {/* Named in the other language itself, so it's found by those who need it. */}
        <form action={setVisitorLocale.bind(null, other)}>
          <button
            type="submit"
            lang={other}
            className="-mr-3 flex min-h-11 items-center gap-1.5 px-3 text-caption font-semibold text-teal-soft transition-transform active:scale-95"
          >
            <Icon name="globe" size={16} />
            {dictionary(other).languageName}
          </button>
        </form>
      </header>
      <section className="flex flex-1 flex-col gap-6">
        <Conversation bubbles={t.home.bubbles} />
        <div className="flex flex-col gap-1">
          <h1 className="text-title leading-tight font-bold">{t.home.headline}</h1>
          <p className="text-body text-teal-soft">{t.home.intro}</p>
        </div>
      </section>
      <footer className="flex flex-col gap-3">
        <ButtonLink href="/login?new">{t.home.start}</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          {t.home.haveAccount}
        </ButtonLink>
      </footer>
    </>
  );
}
