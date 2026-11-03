// How a deck's flashcard session is put together. FSRS decides which cards are due, and the
// daily goal decides how many of them, and of the new words, fit into today.

type DeckCounts = { new_count: number; due_count: number; due_review_count: number };
type TodaysLimits = { newLeft: number; reviewsLeft: number };

// What a session for this deck would contain today. Words still in their learning steps are
// never held back, because stopping them halfway would break their short-term schedule.
export function deckAvailability(deck: DeckCounts, { newLeft, reviewsLeft }: TodaysLimits) {
  const learning = deck.due_count - deck.due_review_count;
  return {
    newWords: Math.min(deck.new_count, newLeft),
    due: learning + Math.min(deck.due_review_count, reviewsLeft),
  };
}

export type SessionEntry<Due, New> = { due: Due } | { fresh: New };

// Due cards arrive most overdue first and new words in deck order. A normal session keeps that
// order, due cards before new words. Shuffle mixes them all.
export function composeSession<Due extends { state: number }, New>(
  due: readonly Due[],
  fresh: readonly New[],
  reviewsLeft: number,
  { shuffle, random = Math.random }: { shuffle: boolean; random?: () => number },
): SessionEntry<Due, New>[] {
  const learning = due.filter((card) => card.state !== 2);
  const reviews = due.filter((card) => card.state === 2).slice(0, reviewsLeft);
  const allowed = new Set([...learning, ...reviews]);

  const entries: SessionEntry<Due, New>[] = [
    ...due.filter((card) => allowed.has(card)).map((card) => ({ due: card })),
    ...fresh.map((card) => ({ fresh: card })),
  ];
  if (!shuffle) return entries;

  // Fisher–Yates.
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries;
}
