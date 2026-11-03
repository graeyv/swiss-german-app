import type { Metadata } from "next";
import { Suspense } from "react";
import { getDailyPlan } from "@/app/flashcards/daily-plan-data";
import { goalReached, reviewProgress, todaysQueue } from "@/lib/flashcards/daily-plan";
import { createClient } from "@/lib/supabase/server";
import { DeckGrid } from "./deck-card";
import { getDeckTree } from "./deck-data";
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
  const [tree, { newCardsPerDay, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);

  if (tree.length === 0) {
    return (
      <p className="text-muted">
        No decks yet. Add the flashcards with <code>npm run db:content</code>.
      </p>
    );
  }

  const reviews = reviewProgress(newCardsPerDay, summary);
  const limits = todaysQueue(newCardsPerDay, summary);

  return (
    <>
      <h1 className="sr-only">Flashcards</h1>

      <TodaysGoal
        newCardsPerDay={newCardsPerDay}
        introducedToday={summary.introduced_today}
        reviewsDone={reviews.done}
        reviewsTotal={reviews.total}
        reached={goalReached(newCardsPerDay, summary, tree.some((deck) => deck.new_count > 0))}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Topics</h2>
        <DeckGrid decks={tree} limits={limits} />
      </section>
    </>
  );
}
