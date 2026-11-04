import { describe, expect, it } from "vitest";
import { buildSeed } from "../../../scripts/build-flashcard-seed.mjs";
import { CHEERS, pickCheer } from "./cheers";
import { goalReached, presetId, reviewLimit, reviewProgress, todaysQueue } from "./daily-plan";
import { suggestedPace } from "../onboarding";
import { buildDeckTree, type DeckRow, findDeck, sortByInterests } from "./decks";
import { advanceQueue } from "./queue";
import { composeSession, deckAvailability } from "./session";
import { type CardRow, formatInterval, previewIntervals, scheduleReview } from "./scheduling";

const CARD = "5b0c2b8e-6d0e-4c1e-9a55-0d1f6f2f7a11";
const NOW = new Date("2026-11-01T10:00:00Z");

describe("scheduleReview", () => {
  it("keeps a missed new card in the same day's learning steps", async () => {
    const { card, log } = await scheduleReview(null, CARD, 1, NOW);
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
    const fromRow = await scheduleReview(lessonRow, CARD, 3, NOW);
    const fromNothing = await scheduleReview(null, CARD, 3, NOW);
    expect(fromRow.card).toEqual(fromNothing.card);
  });

  it("continues correctly from a card restored from database values", async () => {
    const first = await scheduleReview(null, CARD, 3, NOW);
    const second = await scheduleReview(first.card, CARD, 3, new Date(first.card.due_at));
    expect(second.card.state).toBe(2);
    expect(second.card.reps).toBe(2);

    const lastReview = new Date(second.card.due_at);
    const third = await scheduleReview(second.card, CARD, 1, lastReview);
    expect(third.card.state).toBe(3);
    expect(third.card.lapses).toBe(1);
    expect(third.log.stability).toBe(second.card.stability);
    expect(third.log.last_review_at).toBe(second.card.last_review_at);
  });

  it("previews every grade, with longer intervals for better grades", async () => {
    const previews = await previewIntervals(null, CARD, NOW);
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
  const row = (
    id: string,
    parent_id: string | null,
    deck_position: number,
    card_count: number,
    color: DeckRow["color"] = null,
  ) =>
    ({
      id,
      parent_id,
      code: id,
      title: id,
      emoji: null,
      description: null,
      color,
      deck_position,
      card_count,
      due_count: 0,
      due_review_count: 0,
      new_count: 0,
    }) satisfies DeckRow;

  const tree = buildDeckTree([
    row("empty", null, 1, 0),
    row("verbs", null, 3, 2, "green"),
    row("life", null, 2, 1),
    row("past", "verbs", 2, 1),
    row("present", "verbs", 1, 1, "blue"),
    row("hidden", "verbs", 3, 0),
  ]);

  it("nests decks in order and hides empty ones", () => {
    expect(tree.map((deck) => deck.id)).toEqual(["life", "verbs"]);
    expect(tree[1].children.map((deck) => deck.id)).toEqual(["present", "past"]);
  });

  it("gives topics their parent's colour unless they have their own", () => {
    expect(tree[1].children.map((deck) => deck.color)).toEqual(["blue", "green"]);
  });

  it("finds a deck at any depth, with the decks above it", () => {
    const found = findDeck(tree, "past");
    expect(found?.deck.id).toBe("past");
    expect(found?.ancestors.map((deck) => deck.id)).toEqual(["verbs"]);
    expect(findDeck(tree, "empty")).toBeNull();
  });});

describe("buildSeed", () => {
  const decks = "code\tparent_code\ttitle_en\ttitle_de\nC01\t\tLife\tLeben\nC01-T01\tC01\tGreetings\t\n";
  const header =
    "code\tdeck_codes\tdialect\tswiss_german\thigh_german\tmeaning_en\tnotes_en\tnotes_de\taudio_path\ttype\n";

  it("escapes quotes and numbers cards per deck", () => {
    const seed = buildSeed(decks, `${header}FC1\tC01-T01\tzh\tWie gaht's?\tWie geht's?\tHow?\t\t\t\n`);
    expect(seed).toContain("'Wie gaht''s?'");
    expect(seed).toContain("('C01-T01', 'FC1', 1)");
  });

  it("puts each word's card in its decks, not the word itself", () => {
    const seed = buildSeed(decks, `${header}FC1\tC01-T01\tzh\ta\tb\tc\t\t\t\n`);
    expect(seed).toContain("insert into public.deck_items (deck_id, card_id, position)");
    expect(seed).toContain("join public.cards c on c.vocabulary_id = v.id");
  });

  it("rejects unknown deck colours", () => {
    const pink = "code\tparent_code\ttitle_en\temoji\tdescription_en\tcolor\nC01\t\tLife\t🏙️\t\tteal\n";
    expect(() => buildSeed(pink, header)).toThrow(/unknown color/);
  });

  it("writes a translation row for each language with content, and requires English", () => {
    const seed = buildSeed(decks, `${header}FC1\tC01-T01\tzh\ta\tb\tHi\tPolite.\tHöflich.\t\t\n`);
    expect(seed).toContain("('C01', 'en', 'Life', null)");
    expect(seed).toContain("('C01', 'de', 'Leben', null)");
    expect(seed).not.toContain("('C01-T01', 'de'");
    expect(seed).toContain("('FC1', 'en', 'Hi', 'Polite.')");
    expect(seed).toContain("('FC1', 'de', null, 'Höflich.')");
    expect(() => buildSeed(decks, `${header}FC1\tC01-T01\tzh\ta\tb\t\t\t\t\t\n`)).toThrow(/meaning_en/);
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
  const summary = {
    due_learning_count: 3,
    due_learning_known_count: 1,
    due_review_count: 40,
    introduced_today: 4,
    reviewed_today: 80,
    reviews_today: 75,
  };

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


describe("presetId", () => {
  it("names presets only", () => {
    expect(presetId(10)).toBe("steady");
    expect(presetId(12)).toBeUndefined();
  });
});

describe("deckAvailability", () => {
  const deck = { new_count: 12, due_count: 30, due_review_count: 26 };

  it("caps new words and known-word reviews by what's left today", () => {
    expect(deckAvailability(deck, { newLeft: 5, reviewsLeft: 10 })).toEqual({ newWords: 5, due: 14 });
  });

  it("keeps words in their learning steps once the limits are reached", () => {
    expect(deckAvailability(deck, { newLeft: 0, reviewsLeft: 0 })).toEqual({ newWords: 0, due: 4 });
  });
});

describe("composeSession", () => {
  const due = [
    { id: "learning", state: 1 },
    { id: "review-1", state: 2 },
    { id: "review-2", state: 2 },
    { id: "relearning", state: 3 },
  ];
  const fresh = [{ id: "new-1" }, { id: "new-2" }];
  const ids = (entries: ReturnType<typeof composeSession<(typeof due)[number], (typeof fresh)[number]>>) =>
    entries.map((entry) => ("due" in entry ? entry.due.id : entry.fresh.id));

  it("puts due cards first, most overdue first, then new words, within the review limit", () => {
    expect(ids(composeSession(due, fresh, 1, { shuffle: false }))).toEqual([
      "learning",
      "review-1",
      "relearning",
      "new-1",
      "new-2",
    ]);
  });

  it("shuffles the same cards when asked", () => {
    let seed = 0.3;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    const shuffled = ids(composeSession(due, fresh, 1, { shuffle: true, random }));
    expect(shuffled).not.toEqual(["learning", "review-1", "relearning", "new-1", "new-2"]);
    expect([...shuffled].sort()).toEqual(["learning", "new-1", "new-2", "relearning", "review-1"]);
  });
});

describe("goalReached", () => {
  const summary = (overrides: Partial<Parameters<typeof todaysQueue>[1]>) => ({
    due_learning_count: 0,
    due_learning_known_count: 0,
    due_review_count: 0,
    introduced_today: 10,
    reviewed_today: 0,
    reviews_today: 20,
    ...overrides,
  });

  it("is reached once the new words are learned and nothing is due", () => {
    expect(goalReached(10, summary({}), true)).toBe(true);
  });

  it("isn't reached while new words or due cards remain", () => {
    expect(goalReached(10, summary({ introduced_today: 6 }), true)).toBe(false);
    expect(goalReached(10, summary({ due_learning_count: 2 }), true)).toBe(false);
  });

  it("counts the new words as done when none are left to learn", () => {
    expect(goalReached(10, summary({ introduced_today: 3 }), false)).toBe(true);
  });

  it("isn't reached on a day without practice, even with nothing to do", () => {
    expect(goalReached(10, summary({ introduced_today: 0, reviews_today: 0 }), false)).toBe(false);
  });
});

describe("pickCheer", () => {
  it("picks every cheer across the range of random numbers", () => {
    expect(pickCheer(() => 0)).toBe(CHEERS[0]);
    expect(pickCheer(() => 0.999)).toBe(CHEERS.at(-1));
  });
});

describe("reviewProgress", () => {
  it("counts known words only, leaving out repeats of today's new words", () => {
    const summary = {
      due_learning_count: 5,
      due_learning_known_count: 1,
      due_review_count: 4,
      introduced_today: 5,
      reviewed_today: 3,
      reviews_today: 3,
    };
    // 3 reviewed, plus 1 known word in its steps and 4 due reviews still to go.
    expect(reviewProgress(10, summary)).toEqual({ done: 3, total: 8 });
  });
});

describe("sortByInterests", () => {
  it("puts chosen topics first and keeps the usual order otherwise", () => {
    const decks = [{ code: "C01" }, { code: "C02" }, { code: "C03" }];
    expect(sortByInterests(decks, ["C03", "C02"]).map((deck) => deck.code)).toEqual(["C02", "C03", "C01"]);
    expect(sortByInterests(decks, []).map((deck) => deck.code)).toEqual(["C01", "C02", "C03"]);
  });
});

describe("suggestedPace", () => {
  it("suggests more new words to learners who already understand Swiss German", () => {
    expect([null, "new", "few_words", "understands", "speaks"].map((level) => suggestedPace(level as never))).toEqual([
      "steady",
      "steady",
      "steady",
      "intensive",
      "intensive",
    ]);
  });
});
