import { describe, expect, it } from "vitest";
import { parseLabels, timeLines } from "../../scripts/conversation-times.mjs";
import { DECK_COLORS } from "./flashcards/decks";
import { findSituation, type Line, lineAt, lineSpans, textIn, TOPICS } from "./conversations";

const line = (start: number | null): Line => ({
  speaker: "Anna",
  swissGerman: "Hoi",
  standardGerman: "Hallo",
  english: "Hi",
  start,
});

describe("conversation timing", () => {
  it("plays each line up to the next one's start, and the last to the end", () => {
    expect(lineSpans([line(0), line(2.5), line(6)])).toEqual([
      { start: 0, end: 2.5 },
      { start: 2.5, end: 6 },
      { start: 6, end: null },
    ]);
  });

  it("skips lines without times", () => {
    expect(lineSpans([line(0), line(null), line(4)])).toEqual([
      { start: 0, end: 4 },
      null,
      { start: 4, end: null },
    ]);
  });

  it("finds the line being spoken", () => {
    const lines = [line(1), line(3), line(5)];
    expect(lineAt(lines, 0.5)).toBe(-1);
    expect(lineAt(lines, 1)).toBe(0);
    expect(lineAt(lines, 4.9)).toBe(1);
    expect(lineAt(lines, 60)).toBe(2);
    expect(lineAt([line(null)], 3)).toBe(-1);
  });
});

describe("timing a recording from Audacity labels", () => {
  const lines = [{ ...line(null), speaker: "Anna" }, { ...line(null), speaker: "Luca" }];
  // Audacity separates columns with tabs; Windows ends rows with \r\n.
  const row = (...cells: string[]) => cells.join("\t");

  it("reads Audacity's export, with or without a header", () => {
    const labels = [row("start", "end", "speaker"), row("0.030", "2.350", "Anna"), row("2.354", "5.000", "Luca")];
    expect(parseLabels(labels.join("\r\n"))).toEqual([
      { start: 0.03, name: "Anna" },
      { start: 2.354, name: "Luca" },
    ]);
  });

  it("gives each line its label's start, in hundredths", () => {
    const timed = timeLines(lines, [{ start: 0.03, name: "anna" }, { start: 2.354, name: "Luca" }]);
    expect(timed.map((entry: Line) => entry.start)).toEqual([0.03, 2.35]);
  });

  it("rejects a missing label, a speaker mix-up and times out of order", () => {
    expect(() => timeLines(lines, [{ start: 0, name: "Anna" }])).toThrow(/1 labels for 2 lines/);
    expect(() => timeLines(lines, [{ start: 0, name: "Luca" }, { start: 2, name: "Anna" }])).toThrow(/Label 1 is Luca/);
    expect(() => timeLines(lines, [{ start: 3, name: "Anna" }, { start: 2, name: "Luca" }])).toThrow(/before label 1/);
  });
});

describe("conversation content", () => {
  const situations = TOPICS.flatMap((topic) => topic.situations);

  it("has unique ids and known colours", () => {
    const ids = [...TOPICS.map((topic) => topic.id), ...situations.map((situation) => situation.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const topic of TOPICS) expect(DECK_COLORS).toContain(topic.color);
  });

  it("has every text in English, and lines with start times in order", () => {
    for (const situation of situations) {
      expect(situation.title.en && situation.scene.en).toBeTruthy();
      expect(situation.lines.length).toBeGreaterThan(0);
      const starts = situation.lines.flatMap((entry) => (entry.start === null ? [] : [entry.start]));
      expect(starts).toEqual([...starts].sort((a, b) => a - b));
      for (const entry of situation.lines) {
        expect(entry.speaker && entry.swissGerman && entry.standardGerman && entry.english).toBeTruthy();
      }
    }
  });

  it("finds a situation with its topic, in the learner's language", () => {
    const found = findSituation("in-the-kitchen");
    expect(found?.topic.id).toBe("at-home");
    expect(textIn(found!.situation.title, "de")).toBe("In der Küche");
    expect(textIn({ en: "Only English" }, "de")).toBe("Only English");
    expect(findSituation("nowhere")).toBeUndefined();
  });
});
