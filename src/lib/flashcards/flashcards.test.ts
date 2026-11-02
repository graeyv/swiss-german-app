import { describe, expect, it } from "vitest";
import { buildSeed } from "../../../scripts/build-flashcard-seed.mjs";
import { estimateMinutes, PRESETS, presetName, reviewLimit, todaysQueue } from "./daily-plan";
import { buildDeckTree, type DeckRow } from "./decks";
import { advanceQueue } from "./queue";
import { type CardRow, formatInterval, previewIntervals, scheduleReview } from "./scheduling";

const WORD = "5b0c2b8e-6d0e-4c1e-9a55-0d1f6f2f7a11";
const NOW = new Date("2026-11-01T10:00:00Z");

describe("scheduleReview", () => {
  it("keeps a missed new card in the same day's learning steps", async () => {
    const { card, log } = await scheduleReview(null, WORD, 1, NOW);
    expect(card.state).toBe(1);
    expect(card.reps).toBe(1);
    expect(new Date(card.due_at).getTime() - NOW.getTime()).toBe(60_000);
    expect(log.state).toBe(0);
    expect(log.rating).toBe(1);
    expect(log.last_review_at).toBeNull();
  });

  it("treats a lesson's unrated row like a new card", async () => {
    const lessonRow: CardRow = {
      state: 0,
      schedule_status: "new",
      stability: 0,
      difficulty: 0,
      due_at: "2026-10-30T10:00:00Z",
      last_review_at: null,
      reps: 0,
      lapses: 0,
      learning_step: 0,
      scheduled_days: 0,
    };
    const fromRow = await scheduleReview(lessonRow, WORD, 3, NOW);
    const fromNothing = await scheduleReview(null, WORD, 3, NOW);
    expect(fromRow.card).toEqual(fromNothing.card);
  });

  it("continues correctly from a card restored from database values", async () => {
    const first = await scheduleReview(null, WORD, 3, NOW);
    const second = await scheduleReview(first.card, WORD, 3, new Date(first.card.due_at));
    expect(second.card.state).toBe(2);
    expect(second.card.reps).toBe(2);

    const lastReview = new Date(second.card.due_at);
    const third = await scheduleReview(second.card, WORD, 1, lastReview);
    expect(third.card.state).toBe(3);
    expect(third.card.lapses).toBe(1);
    expect(third.log.stability).toBe(second.card.stability);
    expect(third.log.last_review_at).toBe(second.card.last_review_at);
  });

  it("previews every grade, with longer intervals for better grades", async () => {
    const previews = await previewIntervals(null, WORD, NOW);
    expect(previews).toEqual({ 1: "1 min", 2: "6 min", 3: "10 min", 4: expect.stringMatching(/ d$/) });
  });
});

describe("formatInterval", () => {
  it("uses a readable unit", () => {
    expect(formatInterval(60_000)).toBe("1 min");
    expect(formatInterval(3 * 3_600_000)).toBe("3 h");
    expect(formatInterval(12 * 86_400_000)).toBe("12 d");
    expect(formatInterval(90 * 86_400_000)).toBe("3 mo");
    expect(formatInterval(800 * 86_400_000)).toBe("2 y");
  });
});

describe("advanceQueue", () => {
  it("repeats a card due soon at the end of the session", () => {
    const soon = new Date(NOW.getTime() + 10 * 60_000);
    expect(advanceQueue(["a", "b"], "a2", soon, NOW)).toEqual(["b", "a2"]);
  });

  it("drops a card that isn't due until later", () => {
    const tomorrow = new Date(NOW.getTime() + 86_400_000);
    expect(advanceQueue(["a", "b"], "a2", tomorrow, NOW)).toEqual(["b"]);
  });
});

describe("buildDeckTree", () => {
  const row = (id: string, parent_id: string | null, deck_position: number, card_count: number) =>
    ({ id, parent_id, code: id, title: id, deck_position, card_count, due_count: 0, new_count: 0 }) satisfies DeckRow;

  it("nests decks in order and hides empty ones", () => {
    const tree = buildDeckTree([
      row("empty", null, 1, 0),
      row("verbs", null, 3, 2),
      row("life", null, 2, 1),
      row("past", "verbs", 2, 1),
      row("present", "verbs", 1, 1),
      row("hidden", "verbs", 3, 0),
    ]);
    expect(tree.map((deck) => deck.id)).toEqual(["life", "verbs"]);
    expect(tree[1].children.map((deck) => deck.id)).toEqual(["present", "past"]);
  });
});

describe("buildSeed", () => {
  const decks = "code\tparent_code\ttitle\nC01\t\tLife\nC01-T01\tC01\tGreetings\n";
  const header = "code\tdeck_codes\tdialect\tswiss_german\thigh_german\tenglish\tnotes\taudio_path\ttype\n";

  it("escapes quotes and numbers cards per deck", () => {
    const seed = buildSeed(decks, `${header}FC1\tC01-T01\tzh\tWie gaht's?\tWie geht's?\tHow?\t\t\t\n`);
    expect(seed).toContain("'Wie gaht''s?'");
    expect(seed).toContain("('C01-T01', 'FC1', 1)");
  });

  it("rejects cards on a level with children", () => {
    expect(() => buildSeed(decks, `${header}FC1\tC01\tzh\ta\tb\tc\t\t\t\n`)).toThrow(/lowest level/);
  });

  it("rejects unknown decks and duplicate codes", () => {
    expect(() => buildSeed(decks, `${header}FC1\tC09\tzh\ta\tb\tc\t\t\t\n`)).toThrow(/unknown deck/);
    expect(() =>
      buildSeed(decks, `${header}FC1\tC01-T01\tzh\ta\tb\tc\t\t\t\nFC1\tC01-T01\tzh\ta\tb\tc\t\t\t\n`),
    ).toThrow(/Duplicate/);
  });
});

describe("todaysQueue", () => {
  const summary = { due_learning_count: 3, due_review_count: 40, introduced_today: 4, reviewed_today: 80 };

  it("caps reviews of known words, but never words still being learned", () => {
    expect(todaysQueue(10, summary)).toEqual({ dueNow: 23, waiting: 20, reviewsLeft: 20, newLeft: 6 });
  });

  it("keeps learning words due once the limit is reached", () => {
    expect(todaysQueue(2, summary)).toMatchObject({ dueNow: 3, waiting: 40, newLeft: 0 });
  });

  it("lets learners without new cards catch up on everything", () => {
    expect(todaysQueue(0, summary)).toMatchObject({ dueNow: 43, waiting: 0, newLeft: 0 });
  });
});

describe("reviewLimit", () => {
  it("follows new cards, with a floor and no limit at zero", () => {
    expect(reviewLimit(0)).toBeNull();
    expect(reviewLimit(1)).toBe(20);
    expect(reviewLimit(12)).toBe(120);
    expect(reviewLimit(50)).toBe(500);
  });
});

describe("estimateMinutes", () => {
  it("splits each preset's time between new cards and reviews", () => {
    expect(PRESETS.map(({ newCardsPerDay }) => estimateMinutes(newCardsPerDay))).toEqual([
      { newCards: 2, reviews: 6, total: 8 },
      { newCards: 3, reviews: 12, total: 15 },
      { newCards: 7, reviews: 23, total: 30 },
    ]);
  });
});

describe("presetName", () => {
  it("names presets only", () => {
    expect(presetName(10)).toBe("Steady");
    expect(presetName(12)).toBeUndefined();
  });
});
