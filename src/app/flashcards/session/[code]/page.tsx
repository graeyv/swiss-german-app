import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCardFront, getGrammarContent, getToday, toGrammarCard, toWordCard } from "@/lib/flashcards/data";
import { findDeck } from "@/lib/flashcards/decks";
import { composeSession } from "@/lib/flashcards/session";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "../../review-session";

// Enough for a long session. Due cards beyond it wait for the next one.
const MAX_DUE_CARDS = 100;

export default function SessionPage({ params, searchParams }: PageProps<"/flashcards/session/[code]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl px-6 py-6">
          <LoadingPlaceholder />
        </div>
      }
    >
      <Session params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Session({ params, searchParams }: PageProps<"/flashcards/session/[code]">) {
  const [{ code }, { shuffle }] = await Promise.all([params, searchParams]);
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);

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

  const grammarIds = entries.flatMap((entry) => {
    const row = "due" in entry ? entry.due : entry.fresh;
    return row.kind === "grammar" ? [row.card_id] : [];
  });
  const grammar = await getGrammarContent(supabase, grammarIds);

  const now = new Date();
  const cards = await Promise.all(
    entries.map((entry) => {
      const row = "due" in entry ? entry.due : entry.fresh;
      const card = "due" in entry ? entry.due : null;
      if (row.kind !== "grammar") return toWordCard(supabase, row, card, now, t);
      const content = grammar.get(row.card_id);
      // A rule without exercises for the learner's dialect isn't offered in the first place.
      if (!content || content.exercises.length === 0) return null;
      return toGrammarCard(row.card_id, content, card, card?.last_exercise_id ?? null, locale);
    }),
  );

  // Back to the category the learner came from: a subcategory's parent, or the deck itself.
  const back = found.ancestors.at(-1) ?? found.deck;

  return (
    <>
      <title>{t.title(found.deck.title)}</title>
      <ReviewSession
        cards={cards.filter((card) => card !== null)}
        cardFront={cardFront}
        locale={locale}
        goalReachedBefore={today.goalReached}
        emptyMessage={t.session.empty}
        backHref={`/flashcards/decks/${back.code}`}
        backLabel={back.title}
      />
    </>
  );
}
