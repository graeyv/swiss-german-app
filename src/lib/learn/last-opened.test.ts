import { describe, expect, it } from "vitest";
import { nextPlace, parsePlace } from "./last-opened";

describe("where the learner left off", () => {
  it("reads a module or a topic, and nothing else", () => {
    expect(parsePlace("be/pronunciation")).toEqual({ dialect: "be", lesson: "pronunciation" });
    expect(parsePlace("be/pronunciation/consonants/r")).toEqual({
      dialect: "be",
      lesson: "pronunciation",
      section: "consonants",
      rule: "r",
    });
    expect(parsePlace(undefined)).toBeUndefined();
    expect(parsePlace("be/pronunciation/consonants")).toBeUndefined();
    expect(parsePlace("be/<script>")).toBeUndefined();
  });

  it("keeps the topic when the learner goes back to its module's overview", () => {
    expect(nextPlace("be/pronunciation/consonants/r", "be/pronunciation")).toBe("be/pronunciation/consonants/r");
    expect(nextPlace("be/pronunciation/consonants/r", "be/grammar")).toBe("be/grammar");
    expect(nextPlace("be/pronunciation", "be/pronunciation/vowels/o")).toBe("be/pronunciation/vowels/o");
    expect(nextPlace(undefined, "be/pronunciation")).toBe("be/pronunciation");
  });
});
