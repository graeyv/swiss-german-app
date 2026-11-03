import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { dictionary } from "@/lib/i18n";
import { signOut } from "./actions";
import { LanguageSwitch } from "./language-switch";
import { TabLink } from "./tab-link";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10">
      {/* The header's texts depend on the language cookie, which is only known per request. */}
      <Suspense fallback={<div className="h-[6.5rem]" />}>
        <Header />
      </Suspense>

      {children}
    </main>
  );
}

async function Header() {
  const locale = await getLocale();
  const t = dictionary(locale);

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-accent">Grüezi</p>
        <div className="flex items-center gap-4">
          <LanguageSwitch locale={locale} />
          <form action={signOut}>
            <button className="min-h-11 text-sm text-muted underline-offset-4 hover:underline">
              {t.nav.logOut}
            </button>
          </form>
        </div>
      </div>
      <nav aria-label={t.nav.label} className="flex gap-6 border-b border-line">
        <TabLink href="/learn">{t.nav.lessons}</TabLink>
        <TabLink href="/flashcards">{t.nav.flashcards}</TabLink>
      </nav>
    </header>
  );
}
