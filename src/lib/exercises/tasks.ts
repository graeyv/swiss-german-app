// Exercises a learner answers, in the shape the components in src/app/exercises take. Lessons
// store their own payloads (Exercise in src/lib/types.ts) and convert them into these.

// Pick one option. Choosing a form, filling a gap and checking a meaning are all this task,
// framed differently by the prompt. Each "___" in the prompt shows as a gap.
export type PickTask = {
  type: "pick";
  // A line above the prompt, such as who the learner is talking to.
  context?: string;
  prompt: string;
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

// The sentence with its mistake replaced by the correction.
export function correctedSentence(task: SpotErrorTask) {
  const words = sentenceWords(task.sentence);
  const first = Math.min(...task.wrong);
  words.splice(first, task.wrong.length, task.options[task.answer]);
  return words.join(" ");
}

// The right answer as text, to show after a wrong one.
export function answerText(task: Task) {
  if (task.type === "pick") return task.options[task.answer];
  if (task.type === "build") return task.answer.join(" ");
  return correctedSentence(task);
}
