import type { createClient } from "@/lib/supabase/server";
import { type DialectLesson, isReady, LESSONS, roundExercises, type Section, sectionPath } from "./lessons";
import { type Continue, type Reads, readCount, whereToContinue } from "./progress";

// What the Practice tab suggests for the lessons' exercises. There's no schedule: learners
// practise what they choose, and the app suggests one thing, from what's read and how the latest
// round of each section went.

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The latest round of a section, by its path, such as "be/pronunciation/consonants".
export type LatestRound = { daysAgo: number; correct: number; total: number };
export type Rounds = Map<string, LatestRound>;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getRounds(supabase: Supabase, now: Date): Promise<Rounds> {
  const { data, error } = await supabase
    .from("lesson_rounds")
    .select("path, correct, total, practised_at")
    .order("practised_at", { ascending: false });
  if (error) throw error;
  const rounds: Rounds = new Map();
  for (const row of data) {
    if (rounds.has(row.path)) continue;
    const daysAgo = Math.max(0, Math.floor((now.getTime() - new Date(row.practised_at).getTime()) / DAY_MS));
    rounds.set(row.path, { daysAgo, correct: row.correct, total: row.total });
  }
  return rounds;
}

// A section with exercises, with the module it's in.
export type PracticeSection = { entry: DialectLesson; section: Section };

export function practiceSections(lessons: DialectLesson[] = LESSONS): PracticeSection[] {
  return lessons.flatMap((entry) =>
    entry.lesson.sections.filter((section) => roundExercises(section).length > 0).map((section) => ({ entry, section })),
  );
}

export function roundOf(rounds: Rounds, { entry, section }: PracticeSection) {
  return rounds.get(sectionPath(entry.dialect, entry.lesson.id, section.id));
}

// A section is worth refreshing once its latest round is 3 days old, or had under 70 % right.
const STALE_DAYS = 3;
const SHAKY = 0.7;

export type Suggestion =
  // Read through but never practised: the best moment to practise.
  | ({ kind: "practise" } & PracticeSection)
  // Practised a while ago, or not well.
  | ({ kind: "refresh"; round: LatestRound } & PracticeSection)
  // Nothing to practise: read on, at the next topic not read yet. practised tells whether anything
  // was practised before, to say so.
  | { kind: "read"; next: Continue; practised: boolean }
  // Everything read and practised.
  | { kind: "done" };

// The one thing to suggest, in this order: a section read through but not practised yet; the
// practised section most in need of a refresh, the longest ago first, then the weakest; reading
// on; or nothing left. Null while no section has exercises.
export function suggest(reads: Reads, rounds: Rounds, lessons: DialectLesson[] = LESSONS): Suggestion | null {
  const sections = practiceSections(lessons);
  if (sections.length === 0) return null;

  const readThrough = sections.find(
    (item) => !roundOf(rounds, item) && readCount(item.entry, item.section, reads.read) === item.section.rules.length,
  );
  if (readThrough) return { kind: "practise", ...readThrough };

  const stale = sections
    .map((item) => ({ item, round: roundOf(rounds, item) }))
    .filter(
      (candidate): candidate is { item: PracticeSection; round: LatestRound } =>
        !!candidate.round &&
        (candidate.round.daysAgo >= STALE_DAYS || candidate.round.correct / candidate.round.total < SHAKY),
    )
    .sort((a, b) => b.round.daysAgo - a.round.daysAgo || a.round.correct / a.round.total - b.round.correct / b.round.total)[0];
  if (stale) return { kind: "refresh", ...stale.item, round: stale.round };

  const next = whereToContinue(reads, lessons.filter((entry) => isReady(entry.lesson)));
  if (next) return { kind: "read", next, practised: rounds.size > 0 };
  return { kind: "done" };
}
