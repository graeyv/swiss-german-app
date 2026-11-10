import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { dictionary } from "@/lib/i18n";
import { ImmerseIcon, LearnIcon, PracticeIcon, ProfileIcon } from "./tab-icons";
import { TabLink } from "./tab-link";

const TABS = [
  { href: "/learn", label: "learn", icon: <LearnIcon /> },
  { href: "/flashcards", label: "practice", icon: <PracticeIcon /> },
  { href: "/immerse", label: "immerse", icon: <ImmerseIcon /> },
  { href: "/profile", label: "profile", icon: <ProfileIcon /> },
] as const;

// Phones get the tabs as a bar floating above the bottom edge, within reach of the thumb. Wider
// screens get them under the header instead.
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Room at the bottom on phones, so the bar never covers the end of the page. */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:gap-10 md:pt-10 md:pb-10">
        {/* The tabs' labels depend on the language cookie, which is only known per request. */}
        <Suspense fallback={<div className="h-6 md:h-[6.5rem]" />}>
          <Header />
        </Suspense>

        {children}
      </main>

      <Suspense fallback={null}>
        <BottomBar />
      </Suspense>
    </>
  );
}

async function Header() {
  const t = dictionary(await getLocale());

  return (
    <header className="flex flex-col gap-6">
      <p className="font-semibold text-accent">Hoi</p>
      <nav aria-label={t.nav.label} className="hidden gap-6 border-b border-line md:flex">
        {TABS.map((tab) => (
          <TabLink key={tab.href} href={tab.href} label={t.nav[tab.label]} icon={tab.icon} placement="top" />
        ))}
      </nav>
    </header>
  );
}

async function BottomBar() {
  const t = dictionary(await getLocale());

  return (
    // Taps between the edge of the screen and the bar reach the page underneath.
    <nav
      aria-label={t.nav.label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-4 gap-1 rounded-full border border-line/70 bg-surface/80 p-1.5 shadow-lg backdrop-blur-xl">
        {TABS.map((tab) => (
          <TabLink key={tab.href} href={tab.href} label={t.nav[tab.label]} icon={tab.icon} placement="bottom" />
        ))}
      </div>
    </nav>
  );
}
