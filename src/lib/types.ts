// Which side of a flashcard is shown first: Swiss German, or the translation in the learner's
// language. Mirrors public.profiles.card_front.
export type CardFront = "swiss_german" | "translation";

// A word, which the learner turns over and rates themselves.
export type WordCard = {
  kind: "vocabulary";
  card_id: string;
  // New cards haven't been answered yet, learning cards are in their same-day steps.
  status: "new" | "learning" | "review";
  // Identifies this attempt, so retrying a failed save can't record the review twice.
  review_id: string;
  swiss_german: string;
  // Other ways of saying it in the learner's dialect, shown under it: "auch: Salü · Hallo".
  variants: string[];
  high_german: string;
  // In the learner's language, falling back to English.
  meaning: string;
  notes: string | null;
  audio_url: string | null;
  // How long until the card returns for each FSRS grade, keyed 1 (Again) to 4 (Easy).
  intervals: Record<1 | 2 | 3 | 4, string>;
};

// Flashcards are words. Grammar is practised in the Learn lessons instead.
export type Flashcard = WordCard;
