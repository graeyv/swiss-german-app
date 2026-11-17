import { describe, expect, it } from "vitest";
import type { DialectLesson, Lesson, Section } from "./lessons";
import { rulePath } from "./progress";
import { type Rounds, suggest } from "./suggestion";

// A module of two sections with exercises, a and b, and one still being written.
const pick = (id: string) => ({ id, type: "pick" as const, prompt: "?", options: ["x", "y"], answer: 0 });
const rule = (id: string) => ({ id, title: id.toUpperCase(), theory: "", examples: [], takeaway: "", exercises: [pick(id)] });
const section = (id: string, rules: string[]): Section => ({ id, title: id, description: "", rules: rules.map(rule) });
const lesson: Lesson = {
  id: "m",
  title: "M",
  subtitle: "",
  icon: "headphones",
  description: "",
  expectations: [],
  sections: [section("a", ["a1", "a2"]), section("b", ["b1"]), section("c", [])],
};
const lessons: DialectLesson[] = [{ dialect: "be", language: "de", lesson }];
const read = (...ids: string[]) => ({
  read: new Set(ids.map((id) => rulePath("be", "m", id[0], id))),
  last: ids.length ? rulePath("be", "m", ids.at(-1)![0], ids.at(-1)!) : undefined,
});
const rounds = (entries: Record<string, [number, number, number]>): Rounds =>
  new Map(Object.entries(entries).map(([id, [daysAgo, correct, total]]) => [`be/m/${id}`, { daysAgo, correct, total }]));

describe("what the Practice tab suggests", () => {
  it("suggests nothing while no section has exercises", () => {
    const empty: DialectLesson[] = [{ ...lessons[0], lesson: { ...lesson, sections: [section("c", [])] } }];
    expect(suggest(read(), new Map(), empty)).toBeNull();
  });

  it("asks to read first before anything is read", () => {
    const suggestion = suggest(read(), new Map(), lessons);
    expect(suggestion).toMatchObject({ kind: "read", practised: false });
    if (suggestion?.kind === "read") expect(suggestion.next.rule.id).toBe("a1");
  });

  it("suggests practising a section once it's read through", () => {
    expect(suggest(read("a1", "a2"), new Map(), lessons)).toMatchObject({ kind: "practise", section: { id: "a" } });
  });

  it("puts a section read through before refreshing an old one", () => {
    const suggestion = suggest(read("a1", "a2", "b1"), rounds({ a: [20, 2, 10] }), lessons);
    expect(suggestion).toMatchObject({ kind: "practise", section: { id: "b" } });
  });

  it("refreshes the section practised longest ago, then the weakest", () => {
    const all = read("a1", "a2", "b1");
    expect(suggest(all, rounds({ a: [4, 9, 10], b: [12, 9, 10] }), lessons)).toMatchObject({
      kind: "refresh",
      section: { id: "b" },
    });
    expect(suggest(all, rounds({ a: [5, 5, 10], b: [5, 9, 10] }), lessons)).toMatchObject({
      kind: "refresh",
      section: { id: "a" },
    });
  });

  it("refreshes a weak round straight away, but not a fresh good one", () => {
    const all = read("a1", "a2", "b1");
    expect(suggest(all, rounds({ a: [0, 3, 10], b: [0, 9, 10] }), lessons)).toMatchObject({
      kind: "refresh",
      section: { id: "a" },
    });
  });

  it("says to read on once everything read is practised well", () => {
    const suggestion = suggest(read("a1", "a2"), rounds({ a: [1, 10, 10] }), lessons);
    expect(suggestion).toMatchObject({ kind: "read", practised: true });
    if (suggestion?.kind === "read") expect(suggestion.next.rule.id).toBe("b1");
  });

  it("has nothing left once everything is read and practised well", () => {
    expect(suggest(read("a1", "a2", "b1"), rounds({ a: [1, 10, 10], b: [0, 9, 10] }), lessons)).toEqual({
      kind: "done",
    });
  });
});
