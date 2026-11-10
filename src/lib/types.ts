import type { GrammarExercise } from "@/lib/flashcards/grammar";

// Which side of a flashcard is shown first: Swiss German, or the translation in the learner's
// language. Mirrors public.profiles.card_front.
export type CardFront = "swiss_german" | "translation";

type CardBase = {
  card_id: string;
  // New cards haven't been answered yet, learning cards are in their same-day steps.
  status: "new" | "learning" | "review";
  // Identifies this attempt, so retrying a failed save can't record the review twice.
  review_id: string;
};

// A word, which the learner turns over and rates themselves.
export type WordCard = CardBase & {
  kind: "vocabulary";
  swiss_german: string;
  high_german: string;
  // In the learner's language, falling back to English.
  meaning: string;
  notes: string | null;
  audio_url: string | null;
  // How long until the card returns for each FSRS grade, keyed 1 (Again) to 4 (Easy).
  intervals: Record<1 | 2 | 3 | 4, string>;
};

// A grammar rule, practised through one of its exercises. The answer decides the grade.
export type GrammarCard = CardBase & {
  kind: "grammar";
  // In the learner's language, falling back to English.
  title: string;
  // Every exercise the learner can be shown, so a repeat in the session can pick another.
  exercises: GrammarExercise[];
  exercise: GrammarExercise;
};

export type Flashcard = WordCard | GrammarCard;
