// Conversations: everyday situations as short dialogues to listen to, grouped by topic, such as
// "In the kitchen" under "At home". They're kept in content/conversations/topics.json, so their
// text can change without touching the code. Assigning the file to the types below makes the
// type check catch content that doesn't have this shape.
import topicsFile from "../../content/conversations/topics.json";
import type { DeckColor } from "@/lib/flashcards/decks";
import type { Locale } from "@/lib/i18n";

// Text in each interface language. English is required, the others fall back to it.
export type Translated = { en: string } & Partial<Record<Locale, string>>;

export type Line = {
  speaker: string;
  swissGerman: string;
  standardGerman: string;
  english: string;
  // Seconds into the recording where the line starts, or null until the recording is timed.
  // A line ends where the next one starts.
  start: number | null;
};

export type Situation = {
  id: string;
  title: Translated;
  emoji: string;
  // Who is talking, and where, in one sentence.
  scene: Translated;
  dialect: string;
  // The recording of the whole dialogue under public/, or null until it's recorded.
  audio: string | null;
  lines: Line[];
};

export type Topic = {
  id: string;
  title: Translated;
  emoji: string;
  color: DeckColor;
  situations: Situation[];
};

const file: { topics: (Omit<Topic, "color"> & { color: string })[] } = topicsFile;

// In the order learners see them. A topic without situations stays hidden.
export const TOPICS: Topic[] = file.topics
  .map((topic) => ({ ...topic, color: topic.color as DeckColor }))
  .filter((topic) => topic.situations.length > 0);

export function textIn(text: Translated, locale: Locale): string {
  return text[locale] ?? text.en;
}

export function findSituation(id: string): { topic: Topic; situation: Situation } | undefined {
  for (const topic of TOPICS) {
    const situation = topic.situations.find((candidate) => candidate.id === id);
    if (situation) return { topic, situation };
  }
  return undefined;
}

// Every situation's page, so they're all built ahead of time and open instantly.
export function situationParams() {
  return TOPICS.flatMap((topic) => topic.situations.map((situation) => ({ situation: situation.id })));
}

// Where each line plays in the recording: from its start to the next line's start, or to the end
// of the recording for the last one. Null for lines without a start time.
export function lineSpans(lines: readonly Line[]): ({ start: number; end: number | null } | null)[] {
  return lines.map((line, index) => {
    if (line.start === null) return null;
    const next = lines.slice(index + 1).find((later) => later.start !== null);
    return { start: line.start, end: next?.start ?? null };
  });
}

// The line being spoken at this point in the recording, or -1 before the first one.
export function lineAt(lines: readonly Line[], time: number): number {
  let current = -1;
  lines.forEach((line, index) => {
    if (line.start !== null && line.start <= time) current = index;
  });
  return current;
}
