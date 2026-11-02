export type Vocabulary = {
  swiss_german: string;
  high_german: string;
  english: string;
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

export type Flashcard = {
  vocabulary_id: string;
  swiss_german: string;
  high_german: string;
  english: string;
  notes: string | null;
  audio_url: string | null;
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
