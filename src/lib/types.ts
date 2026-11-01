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

export type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  dialect: { name: string };
  lessons: Lesson[];
};
