import { TOPIC_ILLUSTRATIONS } from "@/app/topic-illustrations";
import { TopicTile } from "@/app/ui/topic-tile";
import type { DeckNode } from "@/lib/flashcards/decks";
import { dictionary, type Locale } from "@/lib/i18n";
import { deckAvailability } from "@/lib/flashcards/session";
import { Counts } from "./counts";
import { deckIcon } from "./deck-icons";

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

// A topic and what it holds for today. A topic without cards yet says it's coming soon.
function DeckCard({ deck, limits, locale }: { deck: DeckNode; limits: TodaysLimits; locale: Locale }) {
  const { newWords, due } = deckAvailability(deck, limits);
  const t = dictionary(locale).flashcards;

  return (
    <TopicTile
      href={`/flashcards/decks/${deck.code}`}
      title={deck.title}
      caption={deck.description ?? (deck.kind === "grammar" ? t.rules(deck.card_count) : t.words(deck.card_count))}
      image={TOPIC_ILLUSTRATIONS[deck.code]}
      icon={deckIcon(deck.code)}
      footer={
        deck.card_count === 0 ? (
          <span className="text-sm text-teal-soft">{t.comingSoon}</span>
        ) : newWords + due === 0 ? (
          <span className="text-sm font-semibold text-success">✓ {t.doneForToday}</span>
        ) : (
          <Counts newWords={newWords} due={due} locale={locale} />
        )
      }
    />
  );
}
