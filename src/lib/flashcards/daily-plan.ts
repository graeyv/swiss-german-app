// Shared by the server and the daily plan form, so it must not import the scheduler.

// A row of the flashcard_summary database function.
export type FlashcardSummary = {
  due_learning_count: number;
  // The part of due_learning_count that are words learned before today.
  due_learning_known_count: number;
  due_review_count: number;
  introduced_today: number;
  // Answers on words the learner already knew, which the daily review limit counts.
  reviewed_today: number;
  // Words learned before today that were reviewed today, each counted once.
  reviews_today: number;
};

// Matches the column default and check on public.profiles.
export const DEFAULT_NEW_CARDS = 10;
export const NEW_CARDS_RANGE = { min: 0, max: 50 };

export const PRESETS = [
  { id: "relaxed", newCardsPerDay: 5 },
  { id: "steady", newCardsPerDay: 10 },
  { id: "intensive", newCardsPerDay: 20 },
] as const;

// Rule of thumb: once a pace settles, each new card a day brings up to about 10 reviews a day.
const REVIEWS_PER_NEW_CARD = 10;
const MIN_REVIEW_LIMIT = 20;

// Learners only choose new cards. Without new cards, they can catch up on everything.
export function reviewLimit(newCardsPerDay: number) {
  if (newCardsPerDay === 0) return null;
  return Math.max(MIN_REVIEW_LIMIT, newCardsPerDay * REVIEWS_PER_NEW_CARD);
}

export function presetId(newCardsPerDay: number) {
  return PRESETS.find((preset) => preset.newCardsPerDay === newCardsPerDay)?.id;
}

// Whether today's goal is met: something was practised, the new words are learned (or there are
// none left to learn), and nothing is due within today's review limit.
export function goalReached(
  newCardsPerDay: number,
  summary: FlashcardSummary,
  newWordsLeft: boolean,
) {
  const practised = summary.introduced_today + summary.reviews_today > 0;
  const newWordsDone = summary.introduced_today >= newCardsPerDay || !newWordsLeft;
  return practised && newWordsDone && todaysQueue(newCardsPerDay, summary).dueNow === 0;
}

// Today's reviews, counted in words learned before today. Repeats of today's new words are
// part of learning them, so they're in neither number.
export function reviewProgress(newCardsPerDay: number, summary: FlashcardSummary) {
  const { reviewsLeft } = todaysQueue(newCardsPerDay, summary);
  const stillDue =
    summary.due_learning_known_count + Math.min(summary.due_review_count, reviewsLeft);
  return { done: summary.reviews_today, total: summary.reviews_today + stillDue };
}

// What today's limits leave. Words in their learning steps are never held back.
export function todaysQueue(newCardsPerDay: number, summary: FlashcardSummary) {
  const limit = reviewLimit(newCardsPerDay);
  const reviewsLeft =
    limit === null ? summary.due_review_count : Math.max(0, limit - summary.reviewed_today);
  const reviewsAllowed = Math.min(summary.due_review_count, reviewsLeft);

  return {
    dueNow: summary.due_learning_count + reviewsAllowed,
    waiting: summary.due_review_count - reviewsAllowed,
    reviewsLeft,
    newLeft: Math.max(0, newCardsPerDay - summary.introduced_today),
  };
}
