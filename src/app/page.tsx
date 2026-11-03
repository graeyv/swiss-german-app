import Link from "next/link";
import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/server";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="font-semibold text-accent">Grüezi</p>
      {/* The texts follow the language cookie, which is only known per request. */}
      <Suspense>
        <Intro />
      </Suspense>
    </main>
  );
}

async function Intro() {
  const t = await getDictionary();

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.home.headline}</h1>
      <p className="text-lg text-muted">{t.home.intro}</p>
      <Link
        href="/learn"
        className="w-fit rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t.home.start}
      </Link>
    </>
  );
}
