import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCardFront, getToday, toFlashcard } from "@/lib/flashcards/data";
import { findDeck } from "@/lib/flashcards/decks";
import { composeSession } from "@/lib/flashcards/session";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "../../review-session";

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

  const [today, cardFront] = await Promise.all([getToday(supabase), getCardFront(supabase)]);
  const { tree, limits } = today;
  const found = findDeck(tree, code);
  if (!found) notFound();

  const { newLeft, reviewsLeft } = limits;
  const [due, fresh] = await Promise.all([
    supabase.rpc("due_flashcards", { p_limit: MAX_DUE_CARDS, p_deck_code: code }),
    supabase.rpc("new_flashcards", { p_deck_code: code, p_limit: newLeft }),
  ]);
  if (due.error) throw new Error(due.error.message);
  if (fresh.error) throw new Error(fresh.error.message);

  const entries = composeSession(
    due.data,
    fresh.data,
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
        goalReachedBefore={today.goalReached}
        emptyMessage="Nothing left here for today: you've reached your daily goal, or nothing to review yet."
        backHref={`/flashcards/decks/${back.code}`}
        backLabel={back.title}
      />
    </>
  );
}
