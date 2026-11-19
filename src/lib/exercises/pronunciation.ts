// Pronunciation exercises: hearing which letters a Swiss reader says differently, and saying words
// and sentences oneself. Their words are High German, written as usual, with the letters that
// sound different in square brackets: "[Ch]a[r]a[k]te[r]". The components are in
// src/app/exercises/pronunciation.

// A recording's path in public/, null until it's recorded.
export type Recording = string | null;

// Tap the letters that sound different: every word has some. Then the word plays in Standard
// German and in the dialect.
export type LettersTask = {
  type: "letters";
  word: string;
  audio?: { standardGerman: Recording; dialect: Recording };
};

// Say the word first, then hear it. A tip underlines the letters to watch.
export type SayTask = {
  type: "say";
  word: string;
  audio?: Recording;
};

// Hear a sentence, then say it after. Its letters to watch are in brackets too, if any.
export type RepeatTask = {
  type: "repeat";
  sentence: string;
  audio?: Recording;
};

export type PronunciationTask = LettersTask | SayTask | RepeatTask;

export const PRONUNCIATION_TYPES = ["letters", "say", "repeat"];

export function isPronunciationTask(task: { type: string }): task is PronunciationTask {
  return PRONUNCIATION_TYPES.includes(task.type);
}

// A letter, or letters marked together, such as "Ch". marked: it sounds different.
export type LetterTile = { text: string; marked: boolean };

// A word split into tiles: each bracketed group as one marked tile, every other letter on its own.
export function letterTiles(word: string): LetterTile[] {
  return [...word.matchAll(/\[([^[\]]+)\]|([^[\]])/g)].map((match) =>
    match[1] ? { text: match[1], marked: true } : { text: match[2], marked: false },
  );
}

// The word without its brackets, as it's written.
export function plainWord(word: string) {
  return word.replace(/[[\]]/g, "");
}

// The letters of a word that sound different, each once, in capitals: "[Ch]a[r]a[k]te[r]" has
// CH, R and K.
export function markedLetters(word: string) {
  return [...new Set(letterTiles(word).filter(({ marked }) => marked).map(({ text }) => text.toUpperCase()))];
}

// Letters as a list: "K", "K und ST", "T, Ä und R". and is the language's word between the last
// two, with spaces.
export function listOf(items: string[], and: string) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")}${and}${items.at(-1)}` : items.join("");
}

// Right only if the learner tapped exactly the marked tiles, by their positions.
export function isLettersRight(task: LettersTask, tapped: number[]) {
  return letterTiles(task.word).every((tile, position) => tile.marked === tapped.includes(position));
}

// The rule that explains marked letters, by its title: "K und CK" explains "k" and "ck", "T und P"
// explains "P" and "pp". Undefined if none does.
export function ruleForLetters<R extends { title: string }>(rules: R[], letters: string): R | undefined {
  const upper = letters.toUpperCase();
  // A doubled letter, such as "pp", sounds like the single one.
  const single = /^(.)\1$/.test(upper) ? upper[0] : upper;
  return rules.find((rule) => rule.title.toUpperCase().split(" UND ").includes(single));
}
