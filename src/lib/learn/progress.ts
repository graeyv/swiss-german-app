import type { createClient } from "@/lib/supabase/server";
import { type DialectLesson, isReady, LESSONS, type Rule, type Section } from "./lessons";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// What a learner has read in the Learn lessons. A topic counts as read once its page is opened.
// The tables name topics by their path, such as "be/pronunciation/consonants/r".

export type Reads = {
  // The paths of every topic read.
  read: Set<string>;
  // The path of the topic read last, if any.
  last?: string;
};

export function rulePath(dialect: string, lessonId: string, sectionId: string, ruleId: string) {
  return `${dialect}/${lessonId}/${sectionId}/${ruleId}`;
}

// A topic's path is four parts of lowercase letters, digits and dashes, as the table checks.
export function isRulePath(path: string) {
  return /^[a-z0-9-]+(\/[a-z0-9-]+){3}$/.test(path);
}

export async function getReads(supabase: Supabase): Promise<Reads> {
  const { data, error } = await supabase.from("rule_reads").select("path").order("read_at", { ascending: false });
  if (error) throw error;
  return { read: new Set(data.map(({ path }) => path)), last: data[0]?.path };
}

// How many topics of a section the learner has read.
export function readCount(entry: DialectLesson, section: Section, read: Set<string>) {
  return section.rules.filter((rule) => read.has(rulePath(entry.dialect, entry.lesson.id, section.id, rule.id))).length;
}

export type Continue = {
  entry: DialectLesson;
  section: Section;
  rule: Rule;
  // Whether the learner has read anything yet, to say "continue" rather than "start here".
  started: boolean;
};

// Where to continue in Learn: the next topic not read yet in the module read last, in order, or
// else the first one not read anywhere. Nothing once every topic is read.
export function whereToContinue(reads: Reads, lessons: DialectLesson[] = LESSONS): Continue | undefined {
  const last = lastModule(reads);
  const unread = (entry: DialectLesson) =>
    entry.lesson.sections
      .filter(isReady)
      .flatMap((section) => section.rules.map((rule) => ({ section, rule })))
      .find(({ section, rule }) => !reads.read.has(rulePath(entry.dialect, entry.lesson.id, section.id, rule.id)));

  const ordered = [
    ...lessons.filter((entry) => `${entry.dialect}/${entry.lesson.id}` === last),
    ...lessons.filter((entry) => `${entry.dialect}/${entry.lesson.id}` !== last),
  ];
  for (const entry of ordered) {
    const next = unread(entry);
    if (next) return { entry, ...next, started: reads.read.size > 0 };
  }
  return undefined;
}

// The module the learner read in last, as "dialect/lesson".
export function lastModule(reads: Reads) {
  return reads.last?.split("/").slice(0, 2).join("/");
}
