import { describe, expect, it } from "vitest";
import {
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

describe("answerText", () => {
  it("gives the right answer of each kind of task as text", () => {
    expect(answerText({ type: "pick", prompt: "Ich ___ gloffe.", options: ["ha", "bi"], answer: 1 })).toBe("bi");
    expect(answerText(build)).toBe("Mir gönd hei");
    expect(answerText(spotError)).toBe("Grüezi Herr Keller, händ Si Ziit?");
  });
});
