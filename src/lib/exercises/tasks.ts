// Exercises a learner answers, in the shape the components in src/app/exercises take. Lessons
// store their own payloads (Exercise in src/lib/types.ts) and convert them into these.

// Pick one option. Choosing a form, filling a gap and checking a meaning are all this task,
// framed differently by the prompt. Each "___" in the prompt shows as a gap.
export type PickTask = {
  type: "pick";
  // A line above the prompt, such as who the learner is talking to.
  context?: string;
  prompt: string;
  // The prompt's language when it's Swiss German, so screen readers pronounce it as such.
  promptLang?: string;
  options: string[];
  answer: number;
};

// Put tiles in order. Tiles can include distractors. The answer is the words themselves, so two
// tiles with the same word are interchangeable.
export type BuildTask = {
  type: "build";
  prompt: string;
  tiles: string[];
  answer: string[];
};

// Find the mistake in a sentence, then pick its correction. wrong holds the positions of the
// words that make up the mistake, next to each other, counting from 0 in sentenceWords.
export type SpotErrorTask = {
  type: "spot_error";
  // A line above the sentence, which can make clear which word is the mistake.
  context?: string;
  sentence: string;
  wrong: number[];
  options: string[];
  answer: number;
};

export type Task = PickTask | BuildTask | SpotErrorTask;

export function sentenceWords(sentence: string) {
  return sentence.split(/\s+/).filter(Boolean);
}

// What the learner answered, for marking it and comparing it with the solution.
export type Response =
  // The position of the option picked.
  | { type: "pick"; picked: number }
  // Positions in tiles, in the order the learner put them.
  | { type: "build"; placed: number[] }
  // The position of the word tapped as the mistake, and of the correction picked.
  | { type: "spot_error"; tapped: number; picked: number };

export function isBuildCorrect(task: BuildTask, placed: number[]) {
  return placed.map((i) => task.tiles[i]).join(" ") === task.answer.join(" ");
}

// Right only if the learner found the mistake and picked its correction.
export function isSpotErrorCorrect(task: SpotErrorTask, tapped: number, picked: number) {
  return task.wrong.includes(tapped) && picked === task.answer;
}

export function isCorrect(task: Task, response: Response) {
  if (task.type === "pick" && response.type === "pick") return response.picked === task.answer;
  if (task.type === "build" && response.type === "build") return isBuildCorrect(task, response.placed);
  if (task.type === "spot_error" && response.type === "spot_error") {
    return isSpotErrorCorrect(task, response.tapped, response.picked);
  }
  return false;
}

// A piece of a sentence shown after answering. Marked pieces are what the learner got right or
// wrong, and are highlighted.
export type Segment = { text: string; mark?: "right" | "wrong" };

// Punctuation at the end of a word, which stays when the word is replaced.
const TRAILING_PUNCTUATION = /[.,!?;:…»]+$/;

// The words with count of them, from first, replaced by a marked replacement. Punctuation after
// the last replaced word stays, outside the mark.
function replaceWords(
  words: string[],
  first: number,
  count: number,
  replacement: string,
  mark: Segment["mark"],
): Segment[] {
  const last = first + count - 1;
  const punctuation = TRAILING_PUNCTUATION.exec(words[last])?.[0] ?? "";
  const before = words.slice(0, first).join(" ");
  const after = words.slice(last + 1).join(" ");
  const segments: Segment[] = [
    { text: before ? `${before} ` : "" },
    { text: replacement, mark },
    { text: punctuation + (after ? ` ${after}` : "") },
  ];
  return segments.filter((segment) => segment.text);
}

// Each gap in the prompt filled with a marked answer.
function fillGaps(prompt: string, answer: string, mark: Segment["mark"]): Segment[] {
  return prompt
    .split("___")
    .flatMap((part, i) => [...(i > 0 ? [{ text: answer, mark }] : []), { text: part }])
    .filter((segment) => segment.text);
}

const plain = (segments: Segment[]) => segments.map((segment) => segment.text).join("");

// The sentence with its mistake replaced by the correction.
export function correctedSentence(task: SpotErrorTask) {
  const words = sentenceWords(task.sentence);
  const correction = task.options[task.answer];
  return plain(replaceWords(words, Math.min(...task.wrong), task.wrong.length, correction, "right"));
}

// What to show once a task is answered: what was asked, when it isn't part of the sentence, the
// learner's answer with what's wrong marked, and the solution with the right answer marked.
// After a right answer, given and solution are the same.
export function answerReview(task: Task, response: Response) {
  const correct = isCorrect(task, response);
  let asked: string | null = null;
  let given: Segment[];
  let solution: Segment[];

  if (task.type === "pick") {
    const picked = response.type === "pick" ? task.options[response.picked] : "";
    const right = task.options[task.answer];
    if (task.prompt.includes("___")) {
      given = fillGaps(task.prompt, picked, correct ? "right" : "wrong");
      solution = fillGaps(task.prompt, right, "right");
    } else {
      asked = task.prompt;
      given = [{ text: picked, mark: correct ? "right" : "wrong" }];
      solution = [{ text: right, mark: "right" }];
    }
  } else if (task.type === "build") {
    asked = task.prompt;
    const placed = response.type === "build" ? response.placed.map((i) => task.tiles[i]) : [];
    // Word by word, so the learner sees where their sentence went wrong, and what goes there.
    given = placed.flatMap((word, i) => [
      ...(i > 0 ? [{ text: " " }] : []),
      word === task.answer[i] ? { text: word } : { text: word, mark: "wrong" as const },
    ]);
    solution = correct
      ? [{ text: task.answer.join(" "), mark: "right" }]
      : task.answer.flatMap((word, i) => [
          ...(i > 0 ? [{ text: " " }] : []),
          word === placed[i] ? { text: word } : { text: word, mark: "right" as const },
        ]);
  } else {
    const words = sentenceWords(task.sentence);
    const first = Math.min(...task.wrong);
    solution = replaceWords(words, first, task.wrong.length, task.options[task.answer], "right");
    if (response.type !== "spot_error") {
      given = [{ text: task.sentence }];
    } else if (task.wrong.includes(response.tapped)) {
      // The mistake was found, so the learner's correction replaces all of it.
      const mark = correct ? "right" : "wrong";
      given = replaceWords(words, first, task.wrong.length, task.options[response.picked], mark);
    } else {
      given = replaceWords(words, response.tapped, 1, task.options[response.picked], "wrong");
    }
  }

  return { correct, asked, given, solution };
}

// The right answer as text, to show after a wrong one.
export function answerText(task: Task) {
  if (task.type === "pick") return task.options[task.answer];
  if (task.type === "build") return task.answer.join(" ");
  return correctedSentence(task);
}
