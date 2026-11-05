// Grammar cards: which of its exercises a card shows, and how the answer becomes a grade. Shared
// by the server and the session, so it must not import the scheduler.
import type { Task } from "@/lib/exercises/tasks";
import type { Locale } from "@/lib/i18n";

// An exercise as the grammar_content database function returns it.
export type ExerciseRow = {
  id: string;
  type: Task["type"];
  level: number;
  payload: Record<string, unknown>;
};

export type GrammarExercise = { id: string; level: number; task: Task };

// A card's place in its schedule, from review_items. Null for a card the learner hasn't met.
export type Progress = { state: number; scheduled_days: number } | null;

// A rule that comes back no sooner than this is known well enough for the hardest exercises.
const WELL_KNOWN_DAYS = 7;

// New cards and cards in their learning steps only ask the learner to recognise the rule, as do
// forgotten ones. Exercises get harder as the rule comes back less often.
export function allowedLevels(progress: Progress): number[] {
  if (!progress || progress.state !== 2) return [1];
  return progress.scheduled_days < WELL_KNOWN_DAYS ? [1, 2] : [2, 3];
}

// One of the exercises for the levels the card is ready for, never the one shown last unless
// it's the only one. Falls back to any exercise when none has those levels.
export function pickExercise<Exercise extends { id: string; level: number }>(
  exercises: readonly Exercise[],
  progress: Progress,
  lastExerciseId: string | null,
  random: () => number = Math.random,
): Exercise {
  const levels = allowedLevels(progress);
  const fitting = exercises.filter((exercise) => levels.includes(exercise.level));
  const pool = fitting.length > 0 ? fitting : exercises;
  const fresh = pool.filter((exercise) => exercise.id !== lastExerciseId);
  const choices = fresh.length > 0 ? fresh : pool;
  return choices[Math.floor(random() * choices.length)];
}

// A wrong answer is Again, a right one Good. Hard and Easy aren't used for grammar yet.
export function gradeFromAnswer(correct: boolean): 1 | 3 {
  return correct ? 3 : 1;
}

// Payload text can be translations, such as {"en": "To a friend", "de": "Zu einem Freund"}.
// Each becomes the learner's language, falling back to English.
function localize(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) return value.map((item) => localize(item, locale));
  if (!value || typeof value !== "object") return value;
  const fields = value as Record<string, unknown>;
  if (typeof fields.en === "string") {
    return typeof fields[locale] === "string" ? fields[locale] : fields.en;
  }
  return Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, localize(item, locale)]));
}

export function grammarExercise(row: ExerciseRow, locale: Locale): GrammarExercise {
  const task = { ...(localize(row.payload, locale) as object), type: row.type } as Task;
  // Grammar prompts to pick from are Swiss German sentences.
  if (task.type === "pick") task.promptLang = "gsw";
  return { id: row.id, level: row.level, task };
}
