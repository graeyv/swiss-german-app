// Shared by the server and the daily plan form, so it must not import the scheduler.

// A row of the flashcard_summary database function.
export type FlashcardSummary = {
  due_learning_count: number;
  due_review_count: number;
  introduced_today: number;
  // Reviews of words the learner already knew, which the daily review limit counts.
  reviewed_today: number;
  // Every review except a new word's first showing, for today's progress.
  reviews_today: number;
};

// Matches the column default and check on public.profiles.
export const DEFAULT_NEW_CARDS = 10;
export const NEW_CARDS_RANGE = { min: 0, max: 50 };

export const PRESETS = [
  { name: "Relaxed", newCardsPerDay: 5 },
  { name: "Steady", newCardsPerDay: 10 },
  { name: "Intensive", newCardsPerDay: 20 },
] as const;

// Rule of thumb: once a pace settles, each new card a day brings up to about 10 reviews a day.
const REVIEWS_PER_NEW_CARD = 10;
const MIN_REVIEW_LIMIT = 20;
// A new card takes about 20 seconds including its same-session repeats, a review about 7.
const SECONDS_PER_NEW_CARD = 20;
const SECONDS_PER_REVIEW = 7;

// Learners only choose new cards. Without new cards, they can catch up on everything.
export function reviewLimit(newCardsPerDay: number) {
  if (newCardsPerDay === 0) return null;
  return Math.max(MIN_REVIEW_LIMIT, newCardsPerDay * REVIEWS_PER_NEW_CARD);
}

// The daily time once a pace has settled, split between new cards and reviews.
export function estimateMinutes(newCardsPerDay: number) {
  const newCards = Math.round((newCardsPerDay * SECONDS_PER_NEW_CARD) / 60);
  const reviews = Math.round(
    ((reviewLimit(newCardsPerDay) ?? 0) * SECONDS_PER_REVIEW) / 60,
  );
  return { newCards, reviews, total: newCards + reviews };
}

export function presetName(newCardsPerDay: number) {
  return PRESETS.find((preset) => preset.newCardsPerDay === newCardsPerDay)?.name;
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
