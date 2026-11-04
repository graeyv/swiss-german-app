import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getToday } from "@/lib/flashcards/data";
import { reviewProgress } from "@/lib/flashcards/daily-plan";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DeckGrid } from "./deck-card";
import { KindSwitch } from "./kind-switch";
import { TodaysGoal } from "./todays-goal";

export default function FlashcardsPage({ searchParams }: PageProps<"/flashcards">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Decks searchParams={searchParams} />
    </Suspense>
  );
}

async function Decks({ searchParams }: Pick<PageProps<"/flashcards">, "searchParams">) {
  const [supabase, locale, { kind: requested }] = await Promise.all([
    createClient(),
    getLocale(),
    searchParams,
  ]);
  const t = dictionary(locale);
  const { tree, newCardsPerDay, summary, limits, goalReached } = await getToday(supabase);

  if (tree.length === 0) {
    return (
      <p className="text-muted">
        {t.flashcards.noDecks} <code>npm run db:content</code>.
      </p>
    );
  }

  const reviews = reviewProgress(newCardsPerDay, summary);
  // The switch only shows once there are grammar decks. Today's goal covers both kinds.
  const hasGrammar = tree.some((deck) => deck.kind === "grammar");
  const kind = hasGrammar && requested === "grammar" ? "grammar" : "vocabulary";

  return (
    <>
      <title>{t.title(t.flashcards.title)}</title>
      <h1 className="sr-only">{t.flashcards.title}</h1>

      <TodaysGoal
        newCardsPerDay={newCardsPerDay}
        introducedToday={summary.introduced_today}
        reviewsDone={reviews.done}
        reviewsTotal={reviews.total}
        reached={goalReached}
        locale={locale}
      />

      <section className="flex flex-col gap-3">
        {hasGrammar && <KindSwitch kind={kind} locale={locale} />}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t.flashcards.topics}
        </h2>
        <DeckGrid decks={tree.filter((deck) => deck.kind === kind)} limits={limits} locale={locale} />
      </section>
    </>
  );
}
