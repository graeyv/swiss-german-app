import { describe, expect, it } from "vitest";
import { isIconName } from "@/app/ui/icons";
import { isReady, LESSONS, lessonNumber, sectionParams, topicCount } from "./lessons";

describe("lessons", () => {
  it("numbers the lessons of a dialect in order", () => {
    expect(LESSONS.filter(({ dialect }) => dialect === "be").map(lessonNumber)).toEqual([1, 2, 3, 4, 5]);
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
});
