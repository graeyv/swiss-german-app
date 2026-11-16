import Image from "next/image";
import Link from "next/link";
import type { DeckNode } from "@/lib/flashcards/decks";
import { dictionary, type Locale } from "@/lib/i18n";
import { deckAvailability } from "@/lib/flashcards/session";
import { Counts } from "./counts";
import { TOPIC_ILLUSTRATIONS } from "./illustrations";

type TodaysLimits = Parameters<typeof deckAvailability>[1];
type DeckGridProps = { decks: DeckNode[]; limits: TodaysLimits; locale: Locale };

export function DeckGrid({ decks, limits, locale }: DeckGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} limits={limits} locale={locale} />
      ))}
    </div>
  );
}

// A topic with an illustration shows it across the top, on sage-light, which sets it off from the
// card. A topic without cards yet says it's coming soon.
function DeckCard({ deck, limits, locale }: { deck: DeckNode; limits: TodaysLimits; locale: Locale }) {
  const { newWords, due } = deckAvailability(deck, limits);
  const t = dictionary(locale).flashcards;
  const illustration = TOPIC_ILLUSTRATIONS[deck.code];
  const empty = deck.card_count === 0;

  const content = (
    <>
      {illustration ? (
        // Half the column, which is at most 42rem wide.
        <Image src={illustration} alt="" quality={90} sizes="(min-width: 42rem) 20rem, 50vw" className="aspect-[3/2] w-full bg-sage-light" />
      ) : (
        <span
          aria-hidden
          className="mx-4 mt-4 flex size-12 items-center justify-center rounded-xl bg-ivory text-2xl"
        >
          {deck.emoji ?? "📚"}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-4">
        <strong className="leading-snug font-semibold">
          {deck.title} <span aria-hidden className="text-muted">›</span>
        </strong>
        <small className="truncate text-sm leading-snug text-muted">
          {deck.description ??
            (deck.kind === "grammar" ? t.rules(deck.card_count) : t.words(deck.card_count))}
        </small>
      </span>
      {/* Pushed to the bottom, so chips line up across cards whose titles wrap differently. */}
      <span className="mt-auto px-4 pb-4">
        {empty ? (
          <span className="text-sm text-teal-soft">{t.comingSoon}</span>
        ) : newWords + due === 0 ? (
          <span className="text-sm font-semibold text-success">✓ {t.doneForToday}</span>
        ) : (
          <Counts newWords={newWords} due={due} locale={locale} />
        )}
      </span>
    </>
  );

  return (
    <Link
      href={`/flashcards/decks/${deck.code}`}
      className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-mist transition-transform active:scale-[0.98]"
    >
      {content}
    </Link>
  );
}
