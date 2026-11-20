import { describe, expect, it } from "vitest";
import { isLettersRight, letterTiles, listOf, markedLetters, plainWord, ruleForLetters } from "./pronunciation";

describe("pronunciation exercises", () => {
  it("splits a word into letters, with the bracketed ones marked together", () => {
    expect(letterTiles("[Ch]a[r]")).toEqual([
      { text: "Ch", marked: true },
      { text: "a", marked: false },
      { text: "r", marked: true },
    ]);
    expect(plainWord("[Ch]a[r]a[k]te[r]")).toBe("Charakter");
  });

  it("names each letter that sounds different once, as a list", () => {
    expect(markedLetters("[Ch]a[r]a[k]te[r]")).toEqual(["CH", "R", "K"]);
    expect(listOf(markedLetters("[Ch]a[r]a[k]te[r]"), " und ")).toBe("CH, R und K");
    expect(listOf(["ST"], " und ")).toBe("ST");
  });

  it("is right only with exactly the marked letters tapped", () => {
    const task = { type: "letters" as const, word: "Wur[st]" };
    expect(isLettersRight(task, [3])).toBe(true);
    expect(isLettersRight(task, [])).toBe(false);
    expect(isLettersRight(task, [2, 3])).toBe(false);
  });

  it("finds the rule for marked letters by its title, doubled letters too", () => {
    const rules = [{ title: "CH" }, { title: "K und CK" }, { title: "T und P" }, { title: "Ä" }];
    expect(ruleForLetters(rules, "ch")?.title).toBe("CH");
    expect(ruleForLetters(rules, "ck")?.title).toBe("K und CK");
    expect(ruleForLetters(rules, "pp")?.title).toBe("T und P");
    expect(ruleForLetters(rules, "ä")?.title).toBe("Ä");
    expect(ruleForLetters(rules, "x")).toBeUndefined();
  });
});
