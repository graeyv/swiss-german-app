import Link from "next/link";
import type { DeckColor, DeckNode } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { Counts } from "./counts";

// Full class names, so Tailwind finds them in the source.
export const TINTS: Record<DeckColor, string> = {
  pink: "bg-tint-pink",
  blue: "bg-tint-blue",
  green: "bg-tint-green",
  yellow: "bg-tint-yellow",
  purple: "bg-tint-purple",
  orange: "bg-tint-orange",
};

type TodaysLimits = Parameters<typeof deckAvailability>[1];

export function DeckGrid({ decks, limits }: { decks: DeckNode[]; limits: TodaysLimits }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} limits={limits} />
      ))}
    </div>
  );
}

function DeckCard({ deck, limits }: { deck: DeckNode; limits: TodaysLimits }) {
  const { newWords, due } = deckAvailability(deck, limits);

  return (
    <Link
      href={`/flashcards/decks/${deck.code}`}
      className={`flex flex-col gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] ${TINTS[deck.color]}`}
    >
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-xl bg-surface/70 text-2xl"
      >
        {deck.emoji ?? "📚"}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="leading-snug font-semibold">
          {deck.title} <span aria-hidden className="text-muted">›</span>
        </strong>
        <small className="truncate text-sm leading-snug text-muted">
          {deck.description ?? `${deck.card_count} ${deck.card_count === 1 ? "word" : "words"}`}
        </small>
      </span>
      {/* Pushed to the bottom, so chips line up across cards whose titles wrap differently. */}
      <span className="mt-auto">
        {newWords + due === 0 ? (
          <span className="text-sm font-semibold text-success">✓ Done for today</span>
        ) : (
          <Counts newWords={newWords} due={due} />
        )}
      </span>
    </Link>
  );
}
