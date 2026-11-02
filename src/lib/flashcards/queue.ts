// A card due again within this time comes back in the same session, like a missed new word.
const REPEAT_WITHIN_MS = 20 * 60_000;

export function advanceQueue<Card>(
  queue: readonly Card[],
  repeatCard: Card,
  dueAt: Date,
  now: Date,
): Card[] {
  const rest = queue.slice(1);
  return dueAt.getTime() - now.getTime() <= REPEAT_WITHIN_MS ? [...rest, repeatCard] : rest;
}
