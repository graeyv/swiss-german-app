import { PRESETS } from "./flashcards/daily-plan";

// How familiar a learner is with Swiss German. Mirrors the check on
// public.profiles.swiss_german_level.
export const LEVELS = ["new", "few_words", "understands", "speaks"] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(value: unknown): value is Level {
  return LEVELS.includes(value as Level);
}

// The pace suggested in onboarding. Beginners start steadily, and learners who already
// understand a fair amount can take on more new words. Without an answer, Steady.
export function suggestedPace(level: Level | null): (typeof PRESETS)[number]["id"] {
  return level === "understands" || level === "speaks" ? "intensive" : "steady";
}
