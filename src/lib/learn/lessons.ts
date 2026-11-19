// Learn lessons teach Swiss German, in a track per language: for German speakers, how it differs
// from Standard German; for English speakers, from the start. Each lesson is a JSON file in
// content/lessons/<dialect>/<language>/, so its text can change without touching the code.
// Assigning a file to Lesson below makes the type check catch a file that doesn't have this shape.
import beEveryday from "../../../content/lessons/be/de/everyday.json";
import beGrammar from "../../../content/lessons/be/de/grammar.json";
import beNewWords from "../../../content/lessons/be/de/new-words.json";
import bePronunciation from "../../../content/lessons/be/de/pronunciation.json";
import beRelatedWords from "../../../content/lessons/be/de/related-words.json";
import beBecomingFluent from "../../../content/lessons/be/en/becoming-fluent.json";
import beBuildingSentences from "../../../content/lessons/be/en/building-sentences.json";
import beEverydayCommunication from "../../../content/lessons/be/en/everyday-communication.json";
import beExpandingYourGrammar from "../../../content/lessons/be/en/expanding-your-grammar.json";
import beGettingStarted from "../../../content/lessons/be/en/getting-started.json";
import beTalkingAboutYourLife from "../../../content/lessons/be/en/talking-about-your-life.json";
import type { PronunciationTask } from "@/lib/exercises/pronunciation";
import type { Task } from "@/lib/exercises/tasks";
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

// An exercise: one of the tasks in src/lib/exercises/tasks.ts or pronunciation.ts, with an id
// unique in its lesson file, such as "ch-1".
export type LessonExercise = (Task | PronunciationTask) & { id: string };

export type Rule = {
  id: string;
  title: string;
  theory: string;
  examples: Example[];
  // The rule in one sentence, to remember.
  takeaway: string;
  // Practised together with the other rules of its section, at the end of the section.
  exercises?: LessonExercise[];
};

// A section without rules is still being written. Its planned topics, if already known, are
// shown in their place, so learners see what's coming.
export type Section = {
  id: string;
  title: string;
  description: string;
  rules: Rule[];
  planned?: string[];
  // Exercises on the section as a whole rather than one rule, such as the pronunciation ones,
  // practised after the rules' own.
  exercises?: LessonExercise[];
};

// A lesson's round across all its sections, after them: "Gemischt".
export type MixedRound = { title: string; exercises: LessonExercise[] };

// One thing the learner can expect from a lesson, in one line, shown before they start. The icon is
// one of the app's icons, such as "headphones" or "mic" (src/app/ui/icons.tsx).
export type Expectation = { icon: string; title: string };

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  // One of the app's icons, such as "headphones", for the lesson in the Learn tab.
  icon: string;
  description: string;
  expectations: Expectation[];
  sections: Section[];
  mixed?: MixedRound;
  // Whether its examples are Standard German words said with the dialect's accent, such as the
  // pronunciation's, so their side is named after the accent: "Berner Akzent".
  accent?: boolean;
};

// A lesson, with the dialect it teaches and the language it's written in. The lesson's screens
// use that language too, whatever the learner's interface language: learners who speak another
// language get lessons of their own.
export type DialectLesson = { dialect: string; language: Locale; lesson: Lesson };

// A lesson file as JSON reads it, where an exercise's type is any string. The type check covers
// everything else, and lessons.test.ts checks each exercise against its task.
type ExerciseFile = { id: string; type: string } & Record<string, unknown>;
type LessonFile = Omit<Lesson, "sections" | "mixed"> & {
  sections: (Omit<Section, "rules" | "exercises"> & {
    rules: (Omit<Rule, "exercises"> & { exercises?: ExerciseFile[] })[];
    exercises?: ExerciseFile[];
  })[];
  mixed?: { title: string; exercises: ExerciseFile[] };
};

const fromFile = (file: LessonFile) => file as Lesson;

const pronunciation = fromFile(bePronunciation);
const relatedWords = fromFile(beRelatedWords);
const newWords = fromFile(beNewWords);
const grammar = fromFile(beGrammar);
const everyday = fromFile(beEveryday);

// Every track, each in the order learners should take it. Lessons still being written are listed
// too, so learners see where the track leads. Lesson ids are unique within a dialect, across its
// tracks, as the addresses and saved progress only name the dialect and the lesson.
export const LESSONS: DialectLesson[] = [
  { dialect: "be", language: "de", lesson: pronunciation },
  { dialect: "be", language: "de", lesson: relatedWords },
  { dialect: "be", language: "de", lesson: newWords },
  { dialect: "be", language: "de", lesson: grammar },
  { dialect: "be", language: "de", lesson: everyday },
  { dialect: "be", language: "en", lesson: fromFile(beGettingStarted) },
  { dialect: "be", language: "en", lesson: fromFile(beBuildingSentences) },
  { dialect: "be", language: "en", lesson: fromFile(beExpandingYourGrammar) },
  { dialect: "be", language: "en", lesson: fromFile(beEverydayCommunication) },
  { dialect: "be", language: "en", lesson: fromFile(beTalkingAboutYourLife) },
  { dialect: "be", language: "en", lesson: fromFile(beBecomingFluent) },
];

// The track for learners of a language: the lessons written in it.
export function lessonsFor(language: Locale): DialectLesson[] {
  return LESSONS.filter((entry) => entry.language === language);
}

// How many topics a lesson has, counting the planned ones of sections still being written.
export function topicCount(lesson: Lesson): number {
  return lesson.sections.reduce((sum, section) => sum + (section.rules.length || section.planned?.length || 0), 0);
}

// Whether a section, or a lesson, has anything to open yet.
export function isReady(item: Section | Lesson): boolean {
  return "rules" in item ? item.rules.length > 0 : item.sections.some(isReady);
}

// A lesson's number in its track, counting from 1 in the order above. It comes from that order,
// so the lesson files don't have to keep their own numbers in step.
export function lessonNumber(entry: DialectLesson): number {
  return LESSONS.filter(({ dialect, language }) => dialect === entry.dialect && language === entry.language).indexOf(entry) + 1;
}

export function findLesson(dialect: string, id: string): DialectLesson | undefined {
  return LESSONS.find((entry) => entry.dialect === dialect && entry.lesson.id === id);
}

export function findSection(lesson: Lesson, id: string): Section | undefined {
  return lesson.sections.find((section) => section.id === id);
}

// A rule with the section it belongs to.
export type RuleInSection = { section: Section; rule: Rule };

// Where a rule sits: its place in its section, and the rules before and after it in the whole
// lesson, so the learner can go from the last consonant straight on to the first vowel, and back.
export type RulePlace = RuleInSection & {
  position: number;
  count: number;
  previous?: RuleInSection;
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
    previous: all[index - 1],
    next: all[index + 1],
  };
}

export function lessonHref(dialect: string, lesson: Lesson, section?: Section, rule?: Rule) {
  return [`/learn/${dialect}/${lesson.id}`, section?.id, rule?.id].filter(Boolean).join("/");
}

// The most exercises of one rule in a round, so a section's round stays short, about ten.
const PER_RULE = 2;

// A section's round: up to two exercises of each rule, in the section's order, each with the rule
// it practises, for "Regel nachlesen". Then the section's own exercises, which have no one rule.
export function roundExercises(section: Section): { ruleId?: string; exercise: LessonExercise }[] {
  return [
    ...section.rules.flatMap((rule) =>
      (rule.exercises ?? []).slice(0, PER_RULE).map((exercise) => ({ ruleId: rule.id, exercise })),
    ),
    ...(section.exercises ?? []).map((exercise) => ({ exercise })),
  ];
}

// The mixed round's id, in its address and its path in lesson_rounds: "be/pronunciation/mixed".
export const MIXED = "mixed";

// A lesson's mixed round as a section without topics of its own, so it's practised, saved and
// suggested like the others.
export function mixedSection(lesson: Lesson): Section | undefined {
  if (!lesson.mixed) return undefined;
  return { id: MIXED, title: lesson.mixed.title, description: "", rules: [], exercises: lesson.mixed.exercises };
}

// What a lesson has to practise, in order: its sections with exercises, then its mixed round.
export function practiceUnits(lesson: Lesson): Section[] {
  const mixed = mixedSection(lesson);
  return [...lesson.sections.filter((section) => roundExercises(section).length > 0), ...(mixed ? [mixed] : [])];
}

export function findPracticeUnit(lesson: Lesson, id: string): Section | undefined {
  return practiceUnits(lesson).find((section) => section.id === id);
}

// Whether any section of a lesson has exercises to practise.
export function hasExercises(lesson: Lesson) {
  return practiceUnits(lesson).length > 0;
}

// A module's exercises, in the Practice tab: the list of its rounds, or with only one, that round.
export function exercisesHref(dialect: string, lesson: Lesson) {
  const units = practiceUnits(lesson);
  return units.length === 1 ? practiceHref(dialect, lesson, units[0]) : exercisesListHref(dialect, lesson);
}

// The list of a module's rounds, in the Practice tab.
export function exercisesListHref(dialect: string, lesson: Lesson) {
  return `/flashcards/lessons/${dialect}/${lesson.id}`;
}

// Where a section's round is, and its path in lesson_rounds, such as "be/pronunciation/consonants".
export function practiceHref(dialect: string, lesson: Lesson, section: Section) {
  return `${lessonHref(dialect, lesson, section)}/practice`;
}

export function sectionPath(dialect: string, lessonId: string, sectionId: string) {
  return `${dialect}/${lessonId}/${sectionId}`;
}

// The next section with something to read in the same lesson, if any.
export function nextSection(lesson: Lesson, section: Section): Section | undefined {
  return lesson.sections.slice(lesson.sections.indexOf(section) + 1).find(isReady);
}

// Every lesson, section and rule page, so they're all built ahead of time and open instantly.
export function lessonParams() {
  return LESSONS.map(({ dialect, lesson }) => ({ dialect, lesson: lesson.id }));
}

export function sectionParams() {
  return LESSONS.flatMap(({ dialect, lesson }) =>
    lesson.sections
      .filter(isReady)
      .map((section) => ({ dialect, lesson: lesson.id, section: section.id })),
  );
}

// Every round's page.
export function practiceParams() {
  return LESSONS.flatMap(({ dialect, lesson }) =>
    practiceUnits(lesson).map((section) => ({ dialect, lesson: lesson.id, section: section.id })),
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
