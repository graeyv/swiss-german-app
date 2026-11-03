import type { Metadata } from "next";
import { Suspense } from "react";
import { getDeckTree } from "@/app/(tabs)/flashcards/deck-data";
import { goalReached, todaysQueue } from "@/lib/flashcards/daily-plan";
import type { CardRow } from "@/lib/flashcards/scheduling";
import { createClient } from "@/lib/supabase/server";
import { getCardFront, getDailyPlan } from "../daily-plan-data";
import { ReviewSession } from "../review-session";
import { toFlashcard } from "../to-flashcard";

export const metadata: Metadata = { title: "Review – Grüezi" };

const SESSION_SIZE = 100;

export default function ReviewPage({ searchParams }: PageProps<"/flashcards/review">) {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Loading your cards…</p>}>
      <DueCards searchParams={searchParams} />
    </Suspense>
  );
}

async function DueCards({ searchParams }: Pick<PageProps<"/flashcards/review">, "searchParams">) {
  // "Keep going" passes all=1 to review past the daily limit.
  const { all } = await searchParams;
  const supabase = await createClient();

  const [due, { newCardsPerDay, summary }, cardFront, tree] = await Promise.all([
    supabase.rpc("due_flashcards", { p_limit: SESSION_SIZE }),
    getDailyPlan(supabase),
    getCardFront(supabase),
    getDeckTree(supabase),
  ]);
  if (due.error) throw new Error(due.error.message);

  // Words still in their learning steps are never held back by the review limit.
  const reviewsLeft = all === "1" ? Infinity : todaysQueue(newCardsPerDay, summary).reviewsLeft;
  const dueRows = due.data as (Parameters<typeof toFlashcard>[1] & CardRow)[];
  const allowedReviews = new Set(dueRows.filter((row) => row.state === 2).slice(0, reviewsLeft));
  const rows = dueRows.filter((row) => row.state !== 2 || allowedReviews.has(row));

  const now = new Date();
  const cards = await Promise.all(rows.map((row) => toFlashcard(supabase, row, row, now)));

  return (
    <ReviewSession
      cards={cards}
      cardFront={cardFront}
      goalReachedBefore={goalReached(
        newCardsPerDay,
        summary,
        tree.some((deck) => deck.new_count > 0),
      )}
      emptyMessage="You're all caught up. Nothing is due."
      backHref="/flashcards"
      backLabel="flashcards"
    />
  );
}
