import { describe, expect, it } from "vitest";
import { LESSONS } from "./lessons";
import { isRulePath, lastModule, moduleReadCount, readCount, rulePath, whereToContinue } from "./progress";

const pronunciation = LESSONS.find(({ lesson }) => lesson.id === "pronunciation")!;
const consonants = pronunciation.lesson.sections.find(({ id }) => id === "consonants")!;
const path = (section: string, rule: string) => rulePath("be", "pronunciation", section, rule);

describe("where to continue in Learn", () => {
  it("starts with the first topic before anything is read", () => {
    const next = whereToContinue({ read: new Set() });
    expect(next?.entry.lesson.id).toBe("bevor-du-startest");
    expect(next?.rule.id).toBe("dialekte");
    expect(next?.started).toBe(false);
  });

  it("goes on with the next topic not read in the module read last", () => {
    const read = new Set([path("consonants", "ch"), path("consonants", "k-ck")]);
    const next = whereToContinue({ read, last: path("consonants", "k-ck") });
    expect(next?.section.id).toBe("consonants");
    expect(next?.rule.id).toBe("r");
    expect(next?.started).toBe(true);
  });

  it("skips topics read out of order", () => {
    const read = new Set([path("consonants", "ch"), path("consonants", "r")]);
    expect(whereToContinue({ read, last: path("consonants", "r") })?.rule.id).toBe("k-ck");
  });

  it("goes on to the next lesson once one is read through", () => {
    const read = new Set(consonants.rules.map((rule) => path("consonants", rule.id)));
    const next = whereToContinue({ read, last: path("consonants", "t-p") });
    expect(next?.section.id).toBe("vowels");
  });

  it("has nothing left once every topic is read", () => {
    const read = new Set(
      pronunciation.lesson.sections.flatMap((section) => section.rules.map((rule) => path(section.id, rule.id))),
    );
    expect(whereToContinue({ read, last: path("vowels", "ue") }, [pronunciation])).toBeUndefined();
  });

  it("counts what's read in a lesson and in its module", () => {
    const read = new Set([path("consonants", "ch"), path("vowels", "o")]);
    expect(readCount(pronunciation, consonants, read)).toBe(1);
    expect(moduleReadCount(pronunciation, read)).toBe(2);
    expect(moduleReadCount(pronunciation, new Set())).toBe(0);
    expect(lastModule({ read, last: path("vowels", "o") })).toBe("be/pronunciation");
    expect(lastModule({ read: new Set() })).toBeUndefined();
  });

  it("only takes paths of four parts", () => {
    expect(isRulePath("be/pronunciation/consonants/r")).toBe(true);
    expect(isRulePath("be/pronunciation/consonants")).toBe(false);
    expect(isRulePath("be/pronunciation/consonants/R")).toBe(false);
  });
});
