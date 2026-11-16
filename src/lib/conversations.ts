// Conversations: scenes from everyday life as short dialogues to listen to, such as "Overslept!"
// under "At Home". The topics are the flashcard topics, without The Essentials, so learners meet
// the same five worlds in both: each names its deck code, which gives it its illustration, and a
// test checks its titles against content/decks.tsv. In the code a scene is a situation. They're kept in content/conversations/topics.json, so their
// text can change without touching the code. Assigning the file to the types below makes the
// type check catch content that doesn't have this shape.
import topicsFile from "../../content/conversations/topics.json";
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
  // Who is talking, and where, in one sentence.
  scene: Translated;
  dialect: string;
  // The recording of the whole dialogue under public/, or null until it's recorded.
  audio: string | null;
  // Empty while the scene is still to be written: it's listed as coming soon.
  lines: Line[];
};

export type Topic = {
  id: string;
  // The flashcard topic it matches, such as "C04" for At Home.
  deck: string;
  title: Translated;
  situations: Situation[];
};

const file: { topics: Topic[] } = topicsFile;

// In the order learners see them.
export const TOPICS: Topic[] = file.topics;

// Whether a scene can be listened to yet.
export function isReady(situation: Situation): boolean {
  return situation.lines.length > 0;
}

export function findTopic(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id);
}

export function textIn(text: Translated, locale: Locale): string {
  return text[locale] ?? text.en;
}

// Every topic's page and every ready scene's, so they're built ahead of time and open instantly.
export function topicParams() {
  return TOPICS.map((topic) => ({ topic: topic.id }));
}

export function sceneParams() {
  return TOPICS.flatMap((topic) =>
    topic.situations.filter(isReady).map((situation) => ({ topic: topic.id, scene: situation.id })),
  );
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
