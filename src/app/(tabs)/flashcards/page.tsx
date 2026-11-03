import type { Metadata } from "next";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { reviewProgress } from "@/lib/flashcards/daily-plan";
import { createClient } from "@/lib/supabase/server";
import { DeckGrid } from "./deck-card";
import { TodaysGoal } from "./todays-goal";

export const metadata: Metadata = { title: "Flashcards – Grüezi" };

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your decks…</p>}>
      <Decks />
    </Suspense>
  );
}

async function Decks() {
  const supabase = await createClient();
  const { tree, newCardsPerDay, summary, limits, goalReached } = await getToday(supabase);

  if (tree.length === 0) {
    return (
      <p className="text-muted">
        No decks yet. Add the flashcards with <code>npm run db:content</code>.
      </p>
    );
  }

  const reviews = reviewProgress(newCardsPerDay, summary);

  return (
    <>
      <h1 className="sr-only">Flashcards</h1>

      <TodaysGoal
        newCardsPerDay={newCardsPerDay}
        introducedToday={summary.introduced_today}
        reviewsDone={reviews.done}
        reviewsTotal={reviews.total}
        reached={goalReached}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Topics</h2>
        <DeckGrid decks={tree} limits={limits} />
      </section>
    </>
  );
}
