import { describe, expect, it } from "vitest";
import {
  answerReview,
  answerText,
  type BuildTask,
  correctedSentence,
  isBuildCorrect,
  isSpotErrorCorrect,
  type SpotErrorTask,
  sentenceWords,
} from "./tasks";

const build: BuildTask = {
  type: "build",
  prompt: "We're going home.",
  tiles: ["Mir", "gönd", "hei", "Ich", "gang", "hei"],
  answer: ["Mir", "gönd", "hei"],
};

const spotError: SpotErrorTask = {
  type: "spot_error",
  sentence: "Grüezi Herr Keller, häsch du Ziit?",
  wrong: [3, 4],
  options: ["händ Si", "häsch du", "hät er"],
  answer: 0,
};

describe("isBuildCorrect", () => {
  it("accepts the answer and treats tiles with the same word alike", () => {
    expect(isBuildCorrect(build, [0, 1, 2])).toBe(true);
    expect(isBuildCorrect(build, [0, 1, 5])).toBe(true);
  });

  it("rejects the wrong order, a distractor, or a missing word", () => {
    expect(isBuildCorrect(build, [1, 0, 2])).toBe(false);
    expect(isBuildCorrect(build, [3, 1, 2])).toBe(false);
    expect(isBuildCorrect(build, [0, 1])).toBe(false);
  });
});

describe("spot the error", () => {
  it("splits a sentence at spaces, keeping punctuation with its word", () => {
    expect(sentenceWords(" Ich  ha hei gange. ")).toEqual(["Ich", "ha", "hei", "gange."]);
  });

  it("needs both the mistake and its correction", () => {
    expect(isSpotErrorCorrect(spotError, 3, 0)).toBe(true);
    expect(isSpotErrorCorrect(spotError, 4, 0)).toBe(true);
    expect(isSpotErrorCorrect(spotError, 2, 0)).toBe(false);
    expect(isSpotErrorCorrect(spotError, 3, 1)).toBe(false);
  });

  it("replaces a mistake of several words with its correction", () => {
    expect(correctedSentence(spotError)).toBe("Grüezi Herr Keller, händ Si Ziit?");
  });

  it("keeps the punctuation after a corrected word", () => {
    const task: SpotErrorTask = {
      type: "spot_error",
      sentence: "Ich gseh du morn, oder du?",
      wrong: [5],
      options: ["di", "du"],
      answer: 0,
    };
    expect(correctedSentence(task)).toBe("Ich gseh du morn, oder di?");
  });
});

describe("answerReview", () => {
  const gap = { type: "pick" as const, prompt: "Ich ___ gloffe.", options: ["ha", "bi"], answer: 1 };

  it("fills a gap with the answer given and the right one, marked", () => {
    expect(answerReview(gap, { type: "pick", picked: 1 })).toEqual({
      correct: true,
      asked: null,
      given: [{ text: "Ich " }, { text: "bi", mark: "right" }, { text: " gloffe." }],
      solution: [{ text: "Ich " }, { text: "bi", mark: "right" }, { text: " gloffe." }],
    });
    expect(answerReview(gap, { type: "pick", picked: 0 }).given).toEqual([
      { text: "Ich " },
      { text: "ha", mark: "wrong" },
      { text: " gloffe." },
    ]);
  });

  it("shows a pick without a gap under what was asked", () => {
    const meaning = { type: "pick" as const, prompt: "Mir sind spaat.", options: ["we", "me"], answer: 0 };
    expect(answerReview(meaning, { type: "pick", picked: 1 })).toEqual({
      correct: false,
      asked: "Mir sind spaat.",
      given: [{ text: "me", mark: "wrong" }],
      solution: [{ text: "we", mark: "right" }],
    });
  });

  it("marks a built sentence word by word", () => {
    const review = answerReview(build, { type: "build", placed: [3, 1, 2] });
    expect(review.correct).toBe(false);
    expect(review.given).toEqual([
      { text: "Ich", mark: "wrong" },
      { text: " " },
      { text: "gönd" },
      { text: " " },
      { text: "hei" },
    ]);
    expect(review.solution).toEqual([
      { text: "Mir", mark: "right" },
      { text: " " },
      { text: "gönd" },
      { text: " " },
      { text: "hei" },
    ]);
    expect(answerReview(build, { type: "build", placed: [0, 1, 2] }).solution).toEqual([
      { text: "Mir gönd hei", mark: "right" },
    ]);
  });

  it("puts the learner's correction where they saw the mistake, keeping punctuation", () => {
    const task: SpotErrorTask = {
      type: "spot_error",
      sentence: "Ich gseh du morn.",
      wrong: [2],
      options: ["di", "dir"],
      answer: 0,
    };
    const solution = [{ text: "Ich gseh " }, { text: "di", mark: "right" }, { text: " morn." }];
    expect(answerReview(task, { type: "spot_error", tapped: 2, picked: 1 })).toEqual({
      correct: false,
      asked: null,
      given: [{ text: "Ich gseh " }, { text: "dir", mark: "wrong" }, { text: " morn." }],
      solution,
    });
    expect(answerReview(task, { type: "spot_error", tapped: 3, picked: 0 }).given).toEqual([
      { text: "Ich gseh du " },
      { text: "di", mark: "wrong" },
      { text: "." },
    ]);
    expect(answerReview(spotError, { type: "spot_error", tapped: 4, picked: 0 }).given).toEqual([
      { text: "Grüezi Herr Keller, " },
      { text: "händ Si", mark: "right" },
      { text: " Ziit?" },
    ]);
  });
});

describe("answerText", () => {
  it("gives the right answer of each kind of task as text", () => {
    expect(answerText({ type: "pick", prompt: "Ich ___ gloffe.", options: ["ha", "bi"], answer: 1 })).toBe("bi");
    expect(answerText(build)).toBe("Mir gönd hei");
    expect(answerText(spotError)).toBe("Grüezi Herr Keller, händ Si Ziit?");
  });
});
