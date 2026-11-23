// Pronunciation exercises: hearing which letters a Swiss reader says differently, and saying words
// and sentences oneself. In the German track, their words are High German, written as usual, with
// the letters that sound different in square brackets: "[Ch]a[r]a[k]te[r]". In the English track,
// they're the dialect's own words, and two more exercises ask what a letter sounds like and which
// word was heard. The components are in src/app/exercises/pronunciation.

// A recording's path in public/, null until it's recorded.
export type Recording = string | null;

// Tap the letters that sound different: every word has some. Then the word plays in Standard
// German and in the dialect.
export type LettersTask = {
  type: "letters";
  word: string;
  audio?: { standardGerman: Recording; dialect: Recording };
};

// Say the word first, then hear it. A tip underlines the letters to watch, if any are marked.
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

// What a letter sounds like in the dialect, from two or three English comparisons, such as "v in
// [v]ery" and "w in [w]ater", the first the right one, with the sound's letters in brackets. Once
// answered, example shows a word with the letter, to hear it.
export type SoundsLikeTask = {
  type: "sounds_like";
  letter: string;
  options: string[];
  example: { word: string; meaning: string; audio?: Recording };
};

// A word plays, and the learner picks it from two or three that differ in one sound, such as
// "schon" and "schön": the first is the one that plays. letter: the sound it tests, such as "Ö",
// whose rule a mistake leads to.
export type HearTask = {
  type: "hear";
  letter: string;
  options: { word: string; meaning: string }[];
  audio?: Recording;
};

export type PronunciationTask = LettersTask | SayTask | RepeatTask | SoundsLikeTask | HearTask;

export const PRONUNCIATION_TYPES = ["letters", "say", "repeat", "sounds_like", "hear"];

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

// The order to show count options in, the same each time for the same key, so the right one, which
// is always first in the file, isn't always first on screen: turned by a number made from the key.
export function optionOrder(count: number, key: string): number[] {
  const turn = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % count;
  return Array.from({ length: count }, (_, index) => (index + turn) % count);
}

// Right only if the learner tapped exactly the marked tiles, by their positions.
export function isLettersRight(task: LettersTask, tapped: number[]) {
  return letterTiles(task.word).every((tile, position) => tile.marked === tapped.includes(position));
}

// The rule that explains marked letters, by its title: "K und CK" explains "k" and "ck", "T und P"
// explains "P" and "pp". Or else the rule with a card for them, as "Vowels" explains "A" in the
// English track. Undefined if none does.
export function ruleForLetters<R extends { title: string; sounds?: { letter: string }[] }>(
  rules: R[],
  letters: string,
): R | undefined {
  const upper = letters.toUpperCase();
  // A doubled letter, such as "pp", sounds like the single one.
  const single = /^(.)\1$/.test(upper) ? upper[0] : upper;
  return (
    rules.find((rule) => rule.title.toUpperCase().split(" UND ").includes(single)) ??
    rules.find((rule) => rule.sounds?.some((sound) => sound.letter.toUpperCase() === single))
  );
}
