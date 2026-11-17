import { describe, expect, it } from "vitest";
import { buildSeed } from "../../../scripts/build-flashcard-seed.mjs";
import { payloadProblem } from "../../../scripts/lib/check-payload.mjs";
import { CHEERS, pickCheer } from "./cheers";
import {
  goalReached,
  LIFTED_NEW_CARDS,
  presetId,
  reviewLimit,
  reviewProgress,
  todaysQueue,
  weekOf,
  zurichDay,
} from "./daily-plan";
import { suggestedPace } from "../onboarding";
import { buildDeckTree, type DeckRow, findDeck, sortByInterests } from "./decks";
import { advanceQueue } from "./queue";
import { alternate, composeSession, deckAvailability } from "./session";
import { type CardRow, formatInterval, previewIntervals, scheduleReview } from "./scheduling";
import { hasWordsAndPhrases, keeps, typesOf, vocabularyFilter } from "./vocabulary-filter";

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

  it("treats an unrated row like a new card", async () => {
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
      kind: "vocabulary",
      title: id,
      emoji: null,
      description: null,
      color,
      deck_position,
      card_count,
      phrase_count: 0,
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
    row("future", "verbs", 3, 0),
  ]);

  it("nests decks in order, empty ones too", () => {
    expect(tree.map((deck) => deck.id)).toEqual(["empty", "life", "verbs"]);
    expect(tree[2].children.map((deck) => deck.id)).toEqual(["present", "past", "future"]);
  });

  it("gives topics their parent's colour unless they have their own", () => {
    expect(tree[2].children.map((deck) => deck.color)).toEqual(["blue", "green", "green"]);
  });

  it("finds a deck at any depth, with the decks above it", () => {
    const found = findDeck(tree, "past");
    expect(found?.deck.id).toBe("past");
    expect(found?.ancestors.map((deck) => deck.id)).toEqual(["verbs"]);
    expect(findDeck(tree, "missing")).toBeNull();
  });});

describe("buildSeed", () => {
  const decks = "code\tparent_code\ttitle_en\ttitle_de\nC01\t\tLife\tLeben\nC01-T01\tC01\tGreetings\t\n";
  const columns = [
    "code", "deck_codes", "high_german", "meaning_en", "notes_en", "notes_de", "type",
    "swiss_german_be", "variants_be", "audio_be", "swiss_german_zh", "audio_zh",
  ];
  const header = `${columns.join("\t")}\n`;
  // A cards file with the header and one row per card, from just the columns a test cares about.
  const cards = (...rows: Record<string, string>[]) =>
    header + rows.map((row) => columns.map((column) => row[column] ?? "").join("\t") + "\n").join("");
  const card = (fields: Record<string, string> = {}) => ({
    code: "FC1", deck_codes: "C01-T01", high_german: "b", meaning_en: "c", swiss_german_zh: "a", ...fields,
  });

  it("builds the deck structure without any words", () => {
    const seed = buildSeed(decks, header);
    expect(seed).toContain("('C01-T01', 'C01', 'vocabulary'");
    expect(seed).not.toContain("vocabulary_items (code");
    expect(seed).not.toMatch(/values\s*\n\s*(on conflict|\))/);
  });

  it("escapes quotes and numbers cards per deck", () => {
    const seed = buildSeed(decks, cards(card({ swiss_german_zh: "Wie gaht's?", high_german: "Wie geht's?" })));
    expect(seed).toContain("'Wie gaht''s?'");
    expect(seed).toContain("('C01-T01', 'FC1', 1)");
  });

  it("puts each word's card in its decks, not the word itself", () => {
    const seed = buildSeed(decks, cards(card()));
    expect(seed).toContain("insert into public.deck_items (deck_id, card_id, position)");
    expect(seed).toContain("join public.cards c on c.vocabulary_id = v.id");
  });

  it("gives a card one form per dialect it has, with its recording", () => {
    const seed = buildSeed(
      decks,
      cards(card({ swiss_german_be: "Merci vilmau", audio_be: "be/merci.mp3", swiss_german_zh: "Merci vilmal" })),
    );
    expect(seed).toContain("('FC1', 'b', 'word')");
    expect(seed).toContain("('FC1', 'be', 'Merci vilmau', array[]::text[], 'be/merci.mp3')");
    expect(seed).toContain("('FC1', 'zh', 'Merci vilmal', array[]::text[], null)");
    const onlyBern = buildSeed(decks, cards(card({ swiss_german_be: "Tschou", swiss_german_zh: "" })));
    expect(onlyBern).toContain("('FC1', 'be', 'Tschou', array[]::text[], null)");
    expect(onlyBern).not.toContain("'zh'");
  });

  it("needs a form in at least one dialect, and audio and variants only with their form", () => {
    expect(() => buildSeed(decks, cards(card({ swiss_german_zh: "" })))).toThrow(/no Swiss German/);
    expect(() => buildSeed(decks, cards(card({ audio_be: "be/a.mp3" })))).toThrow(/audio_be but no swiss_german_be/);
    expect(() => buildSeed(decks, cards(card({ variants_be: "Salü" })))).toThrow(/variants_be but no swiss_german_be/);
  });

  it("lists a form's variants, separated by semicolons", () => {
    const seed = buildSeed(decks, cards(card({ swiss_german_be: "Tschou", variants_be: " Salü ;Hallo; " })));
    expect(seed).toContain("('FC1', 'be', 'Tschou', array['Salü', 'Hallo'], null)");
  });

  it("rejects an unknown dialect and the old one-dialect columns", () => {
    const unknown = "code\tdeck_codes\thigh_german\tmeaning_en\tswiss_german_xx\nFC1\tC01-T01\tb\tc\ta\n";
    expect(() => buildSeed(decks, unknown)).toThrow(/unknown dialect: xx/);
    const old = "code\tdeck_codes\tdialect\tswiss_german\thigh_german\tmeaning_en\nFC1\tC01-T01\tzh\ta\tb\tc\n";
    expect(() => buildSeed(decks, old)).toThrow(/column per dialect/);
  });

  it("rejects unknown deck colours", () => {
    const pink = "code\tparent_code\ttitle_en\temoji\tdescription_en\tcolor\nC01\t\tLife\t🏙️\t\tteal\n";
    expect(() => buildSeed(pink, header)).toThrow(/unknown color/);
  });

  it("writes a translation row for each language with content, and requires English", () => {
    const seed = buildSeed(decks, cards(card({ meaning_en: "Hi", notes_en: "Polite.", notes_de: "Höflich." })));
    expect(seed).toContain("('C01', 'en', 'Life', null)");
    expect(seed).toContain("('C01', 'de', 'Leben', null)");
    expect(seed).not.toContain("('C01-T01', 'de'");
    expect(seed).toContain("('FC1', 'en', 'Hi', 'Polite.')");
    expect(seed).toContain("('FC1', 'de', null, 'Höflich.')");
    expect(() => buildSeed(decks, cards(card({ meaning_en: "" })))).toThrow(/meaning_en/);
  });

  it("rejects cards on a level with children", () => {
    expect(() => buildSeed(decks, cards(card({ deck_codes: "C01" })))).toThrow(/lowest level/);
  });

  it("stores each card's type, a word unless it says otherwise", () => {
    const seed = buildSeed(decks, cards(card(), card({ code: "FC2", high_german: "e", type: "Sentence" })));
    expect(seed).toContain("('FC1', 'b', 'word')");
    expect(seed).toContain("('FC2', 'e', 'sentence')");
    expect(() => buildSeed(decks, cards(card({ type: "Verb" })))).toThrow(/unknown type/);
  });

  it("rejects unknown decks and duplicate codes", () => {
    expect(() => buildSeed(decks, cards(card({ deck_codes: "C09" })))).toThrow(/unknown deck/);
    expect(() => buildSeed(decks, cards(card(), card()))).toThrow(/Duplicate/);
  });
});

describe("buildSeed drafts", () => {
  const decks =
    "code\tparent_code\ttitle_en\tkind\tdraft\n" +
    "C01\t\tLife\t\t\nC01-T01\tC01\tGreetings\t\t\n" +
    "C02\t\tWork\t\tyes\nC02-T01\tC02\tMeetings\t\t\n";
  const words = "code\tdeck_codes\tswiss_german_zh\thigh_german\tmeaning_en\nFC1\tC01-T01\ta\tb\tc\n";

  it("keeps drafts and their children unpublished", () => {
    const seed = buildSeed(decks, words);
    expect(seed).toContain("('C01-T01', 'C01', 'vocabulary', null, null, 1, true)");
    expect(seed).toContain("('C02-T01', 'C02', 'vocabulary', null, null, 1, false)");
  });

  it("only knows decks of words", () => {
    expect(() => buildSeed(decks.replace("Life\t", "Life\tgrammar"), words)).toThrow(/unknown kind/);
  });
});

describe("payloadProblem", () => {
  it("accepts translated text where the learner reads their own language", () => {
    const payload = { context: { en: "Who?", de: "Wer?" }, prompt: "Mir sind spaat.", options: [{ en: "we" }, "me"], answer: 0 };
    expect(payloadProblem("pick", payload)).toBeNull();
    expect(payloadProblem("pick", { ...payload, context: { de: "Wer?" } })).toMatch(/context/);
  });

  it("rejects unknown types, unknown fields and missing ones", () => {
    expect(payloadProblem("match", {})).toMatch(/unknown type/);
    expect(payloadProblem("pick", { prompt: "a", options: ["a", "b"], answer: 0, hint: "x" })).toMatch(/unknown field hint/);
    expect(payloadProblem("build", { prompt: "a", tiles: ["a", "b"] })).toMatch(/missing answer/);
  });

  it("needs a build answer the tiles can make", () => {
    const payload = { prompt: "We go.", tiles: ["Mir", "gönd"], answer: ["Mir", "gönd"] };
    expect(payloadProblem("build", payload)).toBeNull();
    expect(payloadProblem("build", { ...payload, answer: ["Mir", "Mir"] })).toMatch(/more often/);
  });

  it("needs a real mistake of words next to each other", () => {
    const payload = { sentence: "Ich gseh du morn.", wrong: [2], options: ["di", "du"], answer: 0 };
    expect(payloadProblem("spot_error", payload)).toBeNull();
    expect(payloadProblem("spot_error", { ...payload, wrong: [1, 3] })).toMatch(/next to each other/);
    expect(payloadProblem("spot_error", { ...payload, wrong: [4] })).toMatch(/positions/);
    expect(payloadProblem("spot_error", { ...payload, sentence: "Ich gseh di.", wrong: [2] })).toMatch(/same as the mistake/);
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

  it("drops the limit of new cards once it's lifted for the day, but still caps reviews", () => {
    expect(todaysQueue(2, summary, true)).toMatchObject({ dueNow: 3, waiting: 40, newLeft: LIFTED_NEW_CARDS });
  });
});

describe("weekOf", () => {
  it("marks this week's days with practice, Monday first, and finds today", () => {
    // 17 November 2026 is a Tuesday.
    const practised = new Set(["2026-11-15", "2026-11-16", "2026-11-17"]);
    expect(weekOf("2026-11-17", practised)).toEqual({
      days: [true, true, false, false, false, false, false],
      today: 1,
    });
  });

  it("puts a Sunday at the end of the week", () => {
    expect(weekOf("2026-11-22", new Set(["2026-11-22"])).today).toBe(6);
  });
});

describe("zurichDay", () => {
  it("names the day on Zürich time, whatever the server's time zone", () => {
    expect(zurichDay(new Date("2026-11-17T22:30:00Z"))).toBe("2026-11-17");
    expect(zurichDay(new Date("2026-11-17T23:30:00Z"))).toBe("2026-11-18");
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

describe("vocabulary filter", () => {
  it("reads the search parameter, mixing everything by default", () => {
    expect(vocabularyFilter("words")).toBe("words");
    expect(vocabularyFilter("phrases")).toBe("phrases");
    expect(vocabularyFilter(undefined)).toBe("all");
    expect(vocabularyFilter(["words"])).toBe("all");
  });

  it("keeps words or sentences and expressions apart", () => {
    expect(typesOf("all")).toBeUndefined();
    expect(typesOf("phrases")).toEqual(["sentence", "expression"]);
    expect(keeps("words", "word")).toBe(true);
    expect(keeps("words", "expression")).toBe(false);
    expect(keeps("phrases", "sentence")).toBe(true);
    expect(keeps("all", "sentence")).toBe(true);
  });

  it("only offers the choice when a deck has both", () => {
    expect(hasWordsAndPhrases({ card_count: 10, phrase_count: 3 })).toBe(true);
    expect(hasWordsAndPhrases({ card_count: 10, phrase_count: 0 })).toBe(false);
    expect(hasWordsAndPhrases({ card_count: 3, phrase_count: 3 })).toBe(false);
  });
});

describe("alternate", () => {
  it("lets words and sentences take turns, then fills up with the rest", () => {
    expect(alternate(["w1", "w2", "w3", "w4"], ["s1"], 10)).toEqual(["w1", "s1", "w2", "w3", "w4"]);
    expect(alternate(["w1", "w2"], ["s1", "s2"], 3)).toEqual(["w1", "s1", "w2"]);
    expect(alternate([], ["s1", "s2"], 5)).toEqual(["s1", "s2"]);
    expect(alternate(["w1"], ["s1"], 0)).toEqual([]);
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
