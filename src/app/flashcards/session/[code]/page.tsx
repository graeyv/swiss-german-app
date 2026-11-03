import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDeckTree } from "@/app/(tabs)/flashcards/deck-data";
import { goalReached, todaysQueue } from "@/lib/flashcards/daily-plan";
import { findDeck } from "@/lib/flashcards/decks";
import type { CardRow } from "@/lib/flashcards/scheduling";
import { composeSession } from "@/lib/flashcards/session";
import { createClient } from "@/lib/supabase/server";
import { getCardFront, getDailyPlan } from "../../daily-plan-data";
import { ReviewSession } from "../../review-session";
import { toFlashcard } from "../../to-flashcard";

// Enough for a long session. Due cards beyond it wait for the next one.
const MAX_DUE_CARDS = 100;

export default function SessionPage({ params, searchParams }: PageProps<"/flashcards/session/[code]">) {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Loading your cards…</p>}>
      <Session params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Session({ params, searchParams }: PageProps<"/flashcards/session/[code]">) {
  const [{ code }, { shuffle }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const [tree, { newCardsPerDay, summary }, cardFront] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
    getCardFront(supabase),
  ]);
  const found = findDeck(tree, code);
  if (!found) notFound();

  const { newLeft, reviewsLeft } = todaysQueue(newCardsPerDay, summary);
  const [due, fresh] = await Promise.all([
    supabase.rpc("due_flashcards", { p_limit: MAX_DUE_CARDS, p_deck_code: code }),
    supabase.rpc("new_flashcards", { p_deck_code: code, p_limit: newLeft }),
  ]);
  if (due.error) throw new Error(due.error.message);
  if (fresh.error) throw new Error(fresh.error.message);

  const entries = composeSession(
    due.data as (Parameters<typeof toFlashcard>[1] & CardRow)[],
    fresh.data as Parameters<typeof toFlashcard>[1][],
    reviewsLeft,
    { shuffle: shuffle === "1" },
  );

  const now = new Date();
  const cards = await Promise.all(
    entries.map((entry) =>
      "due" in entry
        ? toFlashcard(supabase, entry.due, entry.due, now)
        : toFlashcard(supabase, entry.fresh, null, now),
    ),
  );

  // Back to the category the learner came from: a subcategory's parent, or the deck itself.
  const back = found.ancestors.at(-1) ?? found.deck;

  return (
    <>
      <title>{`${found.deck.title} – Grüezi`}</title>
      <ReviewSession
        cards={cards}
        cardFront={cardFront}
        goalReachedBefore={goalReached(
          newCardsPerDay,
          summary,
          tree.some((deck) => deck.new_count > 0),
        )}
        emptyMessage="Nothing left here for today: you've reached your daily goal, or nothing is due yet."
        backHref={`/flashcards/decks/${back.code}`}
        backLabel={back.title}
      />
    </>
  );
}
