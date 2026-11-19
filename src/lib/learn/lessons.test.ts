import { describe, expect, it } from "vitest";
import { payloadProblem } from "../../../scripts/lib/check-payload.mjs";
import { isIconName } from "@/app/ui/icons";
import { letterTiles, ruleForLetters } from "@/lib/exercises/pronunciation";
import {
  isReady,
  LESSONS,
  lessonNumber,
  lessonsFor,
  nextSection,
  practiceParams,
  practiceUnits,
  roundExercises,
  sectionParams,
  topicCount,
} from "./lessons";

describe("lessons", () => {
  it("numbers the lessons of each track in order", () => {
    expect(lessonsFor("de").map(lessonNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(lessonsFor("en").map(lessonNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("has unique lesson ids within a dialect, across its tracks", () => {
    const ids = LESSONS.filter(({ dialect }) => dialect === "be").map(({ lesson }) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique ids and only icons the app knows", () => {
    for (const { lesson } of LESSONS) {
      const ids = lesson.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(isIconName(lesson.icon)).toBe(true);
      for (const expectation of lesson.expectations) expect(isIconName(expectation.icon)).toBe(true);
    }
  });

  it("tells lessons with something to open from those still being written", () => {
    const ready = LESSONS.filter(({ lesson }) => isReady(lesson)).map(({ lesson }) => lesson.id);
    expect(ready).toEqual(["pronunciation"]);
  });

  it("counts a lesson's topics, planned ones too", () => {
    const counts = Object.fromEntries(LESSONS.map(({ lesson }) => [lesson.id, topicCount(lesson)]));
    expect(counts.pronunciation).toBe(10);
    expect(counts["related-words"]).toBe(14);
  });

  it("builds pages only for sections that are ready", () => {
    expect(sectionParams().map(({ section }) => section)).toEqual(["consonants", "vowels"]);
  });

  it("takes up to two exercises of each rule for a section's round, in order", () => {
    const pick = (id: string) => ({ id, type: "pick" as const, prompt: "?", options: ["a", "b"], answer: 0 });
    const section = {
      id: "s",
      title: "S",
      description: "",
      rules: [
        { id: "a", title: "A", theory: "", examples: [], takeaway: "", exercises: [pick("a1"), pick("a2"), pick("a3")] },
        { id: "b", title: "B", theory: "", examples: [], takeaway: "" },
        { id: "c", title: "C", theory: "", examples: [], takeaway: "", exercises: [pick("c1")] },
      ],
    };
    expect(roundExercises(section).map(({ ruleId, exercise }) => `${ruleId}:${exercise.id}`)).toEqual([
      "a:a1",
      "a:a2",
      "c:c1",
    ]);
  });

  it("has only exercises the round can show, each with an id unique in its lesson", () => {
    for (const { lesson } of LESSONS) {
      const exercises = [
        ...lesson.sections.flatMap((section) => [
          ...section.rules.flatMap((rule) => rule.exercises ?? []),
          ...(section.exercises ?? []),
        ]),
        ...(lesson.mixed?.exercises ?? []),
      ];
      const ids = exercises.map((exercise) => exercise.id);
      expect(new Set(ids).size, `${lesson.id} has a duplicate exercise id`).toBe(ids.length);
      for (const { id, type, ...payload } of exercises) {
        expect(payloadProblem(type, payload), `${lesson.id}, exercise ${id}`).toBeNull();
      }
    }
  });

  it("explains every letter a pronunciation exercise marks with a rule of its lesson", () => {
    for (const { lesson } of LESSONS) {
      const rules = lesson.sections.flatMap((section) => section.rules);
      for (const unit of practiceUnits(lesson)) {
        for (const exercise of unit.exercises ?? []) {
          const text = exercise.type === "letters" || exercise.type === "say" ? exercise.word : exercise.type === "repeat" ? exercise.sentence : null;
          if (!text) continue;
          for (const tile of letterTiles(text).filter(({ marked }) => marked)) {
            expect(ruleForLetters(rules, tile.text), `${lesson.id}, ${exercise.id}: ${tile.text}`).toBeDefined();
          }
        }
      }
    }
  });

  it("practises pronunciation in one round over the whole module", () => {
    const { lesson } = LESSONS.find(({ lesson }) => lesson.id === "pronunciation")!;
    expect(practiceUnits(lesson).map(({ id }) => id)).toEqual(["mixed"]);
    expect(practiceParams().map(({ section }) => section)).toEqual(["mixed"]);
  });

  it("goes on to the next section that's ready", () => {
    const { lesson } = LESSONS.find(({ lesson }) => lesson.id === "pronunciation")!;
    expect(nextSection(lesson, lesson.sections[0])?.id).toBe("vowels");
    expect(nextSection(lesson, lesson.sections[1])).toBeUndefined();
  });
});
