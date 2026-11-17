import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCardSettings, getToday, toWordCard } from "@/lib/flashcards/data";
import { findDeck } from "@/lib/flashcards/decks";
import { alternate, composeSession } from "@/lib/flashcards/session";
import { hasWordsAndPhrases, typesOf, vocabularyFilter } from "@/lib/flashcards/vocabulary-filter";
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
  const [{ code }, { shuffle, cards: only }] = await Promise.all([params, searchParams]);
  // Words only, or sentences and expressions only, when the learner chose that for the topic.
  const filter = vocabularyFilter(only);
  const types = typesOf(filter);
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);

  const [today, { cardFront, autoplay }] = await Promise.all([getToday(supabase), getCardSettings(supabase)]);
  const { tree, limits } = today;
  const found = findDeck(tree, code);
  if (!found) notFound();

  const { newLeft, reviewsLeft } = limits;
  // Mixing words and sentences, new ones take turns, so sentences don't wait until every word
  // of the topic is learned.
  const mixed = filter === "all" && hasWordsAndPhrases(found.deck);
  const newCards = (p_types: string[] | undefined) =>
    supabase.rpc("new_flashcards", { p_deck_code: code, p_limit: newLeft, p_types });
  const [due, fresh, freshPhrases] = await Promise.all([
    supabase.rpc("due_flashcards", { p_limit: MAX_DUE_CARDS, p_deck_code: code, p_types: types }),
    newCards(mixed ? typesOf("words") : types),
    mixed ? newCards(typesOf("phrases")) : null,
  ]);
  if (due.error) throw new Error(due.error.message);
  if (fresh.error) throw new Error(fresh.error.message);
  if (freshPhrases?.error) throw new Error(freshPhrases.error.message);

  const entries = composeSession(
    due.data,
    freshPhrases ? alternate(fresh.data, freshPhrases.data, newLeft) : fresh.data,
    reviewsLeft,
    { shuffle: shuffle === "1" },
  );

  const now = new Date();
  const cards = await Promise.all(
    entries.map((entry) =>
      "due" in entry
        ? toWordCard(supabase, entry.due, entry.due, now, t)
        : toWordCard(supabase, entry.fresh, null, now, t),
    ),
  );

  // Back to the category the learner came from: a subcategory's parent, or the deck itself.
  const back = found.ancestors.at(-1) ?? found.deck;

  return (
    <>
      <title>{t.title(found.deck.title)}</title>
      <ReviewSession
        // A new session once the limit is lifted: the page then holds the topic's further cards.
        key={today.lifted ? "lifted" : "limited"}
        cards={cards}
        cardFront={cardFront}
        autoplay={autoplay}
        // The topic has more new cards than today's limit allows, so lifting it would bring them.
        canLift={!today.lifted && found.deck.new_count > newLeft}
        locale={locale}
        goalReachedBefore={today.goalReached}
        emptyMessage={t.session.empty}
        backHref={`/flashcards/decks/${back.code}`}
        backLabel={back.title}
      />
    </>
  );
}
