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

// placed holds positions in tiles, in the order the learner put them.
export function isBuildCorrect(task: BuildTask, placed: number[]) {
  return placed.map((i) => task.tiles[i]).join(" ") === task.answer.join(" ");
}

// Right only if the learner found the mistake and picked its correction.
export function isSpotErrorCorrect(task: SpotErrorTask, tapped: number, picked: number) {
  return task.wrong.includes(tapped) && picked === task.answer;
}

// Punctuation at the end of a word, which stays when the word is corrected.
const TRAILING_PUNCTUATION = /[.,!?;:…»]+$/;

// The sentence with its mistake replaced by the correction.
export function correctedSentence(task: SpotErrorTask) {
  const words = sentenceWords(task.sentence);
  const first = Math.min(...task.wrong);
  const last = Math.max(...task.wrong);
  const punctuation = TRAILING_PUNCTUATION.exec(words[last])?.[0] ?? "";
  words.splice(first, task.wrong.length, task.options[task.answer] + punctuation);
  return words.join(" ");
}

// The solved task, to show once it's answered: the sentence with the right answer in it, under
// what was asked when that isn't part of the sentence.
export function solutionOf(task: Task): { asked: string | null; solution: string } {
  if (task.type === "pick") {
    const right = task.options[task.answer];
    return task.prompt.includes("___")
      ? { asked: null, solution: task.prompt.replaceAll("___", right) }
      : { asked: task.prompt, solution: right };
  }
  if (task.type === "build") return { asked: task.prompt, solution: task.answer.join(" ") };
  return { asked: null, solution: correctedSentence(task) };
}

// The right answer as text, to show after a wrong one.
export function answerText(task: Task) {
  if (task.type === "pick") return task.options[task.answer];
  if (task.type === "build") return task.answer.join(" ");
  return correctedSentence(task);
}
