// Learn lessons explain how Swiss German differs from Standard German. Each lesson is a JSON file
// in content/lessons/<dialect>/, so its text can change without touching the code. Assigning a file
// to Lesson below makes the type check catch a file that doesn't have this shape.
import bePronunciation from "../../../content/lessons/be/pronunciation.json";
import type { Locale } from "@/lib/i18n";

// The same thing in Standard German and in the dialect.
export type Comparison<T> = { standardGerman: T; dialect: T };

export type Example = {
  word: string;
  // How the sound is described on each side, such as "Ich-Laut" and "Ach-Laut". Standard German is
  // null for a word that only exists in the dialect, such as "müed".
  pronunciation: { standardGerman: string | null; dialect: string };
  // Recordings of the word on each side, null until recorded.
  audio: Comparison<string | null>;
};

export type Rule = {
  id: string;
  title: string;
  theory: string;
  examples: Example[];
  // The rule in one sentence, to remember.
  takeaway: string;
};

export type Section = {
  id: string;
  title: string;
  description: string;
  rules: Rule[];
};

// One thing the learner can expect from a lesson, shown before they start. The icon is one of the
// names LessonIcon knows, such as "sound" or "speak".
export type Expectation = { icon: string; title: string; text: string };

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  expectations: Expectation[];
  sections: Section[];
};

// A lesson, with the dialect it teaches and the language it's written in. The lesson's screens
// use that language too, whatever the learner's interface language: learners who speak another
// language get lessons of their own.
export type DialectLesson = { dialect: string; language: Locale; lesson: Lesson };

const pronunciation: Lesson = bePronunciation;

// In the order learners should take them.
export const LESSONS: DialectLesson[] = [{ dialect: "be", language: "de", lesson: pronunciation }];

export function findLesson(dialect: string, id: string): DialectLesson | undefined {
  return LESSONS.find((entry) => entry.dialect === dialect && entry.lesson.id === id);
}

export function findSection(lesson: Lesson, id: string): Section | undefined {
  return lesson.sections.find((section) => section.id === id);
}

// A rule with the section it belongs to.
export type RuleInSection = { section: Section; rule: Rule };

// Where a rule sits: its place in its section, and the rule after it in the whole lesson, so the
// learner can go from the last consonant straight on to the first vowel.
export type RulePlace = RuleInSection & {
  position: number;
  count: number;
  next?: RuleInSection;
};

export function findRule(lesson: Lesson, sectionId: string, ruleId: string): RulePlace | undefined {
  const all = lesson.sections.flatMap((section) => section.rules.map((rule) => ({ section, rule })));
  const index = all.findIndex(({ section, rule }) => section.id === sectionId && rule.id === ruleId);
  if (index === -1) return undefined;
  const { section, rule } = all[index];
  return {
    section,
    rule,
    position: section.rules.indexOf(rule) + 1,
    count: section.rules.length,
    next: all[index + 1],
  };
}

export function lessonHref(dialect: string, lesson: Lesson, section?: Section, rule?: Rule) {
  return [`/learn/${dialect}/${lesson.id}`, section?.id, rule?.id].filter(Boolean).join("/");
}

// Every lesson, section and rule page, so they're all built ahead of time and open instantly.
export function lessonParams() {
  return LESSONS.map(({ dialect, lesson }) => ({ dialect, lesson: lesson.id }));
}

export function sectionParams() {
  return LESSONS.flatMap(({ dialect, lesson }) =>
    lesson.sections.map((section) => ({ dialect, lesson: lesson.id, section: section.id })),
  );
}

export function ruleParams() {
  return LESSONS.flatMap(({ dialect, lesson }) =>
    lesson.sections.flatMap((section) =>
      section.rules.map((rule) => ({
        dialect,
        lesson: lesson.id,
        section: section.id,
        rule: rule.id,
      })),
    ),
  );
}
