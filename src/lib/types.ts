export type Vocabulary = {
  swiss_german: string;
  high_german: string;
  // In the learner's language, falling back to English.
  meaning: string;
  notes: string | null;
};

type ExerciseBase = {
  id: string;
  vocabulary: Vocabulary | null;
};

// Mirrors the payload column of public.exercises.
export type Exercise = ExerciseBase &
  (
    | { type: "vocab_card"; vocabulary: Vocabulary }
    | {
        type: "multiple_choice";
        payload: { question: string; options: string[]; answer_index: number };
      }
    | {
        type: "word_order";
        // words is stored in the order it is displayed, and may include distractors.
        payload: { prompt: string; words: string[]; answer: string[] };
      }
  );

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

// Which side of a flashcard is shown first: Swiss German, or the translation in the learner's
// language. Mirrors public.profiles.card_front.
export type CardFront = "swiss_german" | "translation";

export type Flashcard = {
  card_id: string;
  swiss_german: string;
  high_german: string;
  // In the learner's language, falling back to English.
  meaning: string;
  notes: string | null;
  audio_url: string | null;
  // New words haven't been rated yet, learning words are in their same-day steps.
  kind: "new" | "learning" | "review";
  // Identifies this attempt, so retrying a failed save can't record the review twice.
  review_id: string;
  // How long until the card returns for each FSRS grade, keyed 1 (Again) to 4 (Easy).
  intervals: Record<1 | 2 | 3 | 4, string>;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  dialect: { name: string };
  lessons: Lesson[];
};
