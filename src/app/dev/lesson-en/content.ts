// The English track's Pronunciation module while it's being written: three lessons, grouped by
// whether the letter and its sound are familiar from English. Lesson 1 has its text, as written by
// the user; the others have their topics' titles only. Moves into content/lessons once settled.

// A letter, how it sounds compared with a word the learner knows, and a Swiss German word with it,
// to listen to. In like, the letters of the English word that make the sound are in brackets, such
// as "f[a]ther", to mark them as the pronunciation exercises do. No recordings yet.
export type Sound = { letter: string; like: string; word: string; meaning: string };

// Without theory, a topic is still to be written.
export type Topic = { id: string; title: string; theory?: string; sounds?: Sound[] };

export type Lesson = { id: string; title: string; topics: Topic[] };

export const MODULE = {
  title: "Pronunciation",
  number: 2,
  subtitle: "Different from English",
  expectations: [{ icon: "intersect", title: "Understand how Swiss German relates to Standard German" }],
};

export const LESSONS: Lesson[] = [
  {
    id: "familiar",
    title: "Familiar letters, familiar sounds",
    topics: [
      {
        id: "introduction",
        title: "Start with what you know",
        theory:
          "In this lesson, we start with letters and sounds that should already feel familiar. Many sounds in Swiss German are similar to sounds in English, French, Spanish or Portuguese.\n\nThe goal is to build on what you already know and become comfortable recognising and pronouncing these sounds in everyday Swiss German words.",
      },
      {
        id: "vowels",
        title: "Familiar Vowel Sounds",
        theory: "Some basic vowel sounds are close to sounds you may already know.",
        sounds: [
          { letter: "A", like: "Similar to a in f[a]ther", word: "Mami", meaning: "Mum" },
          { letter: "E", like: "Similar to e in b[e]d", word: "Bett", meaning: "Bed" },
          { letter: "I", like: "Similar to i in s[i]t", word: "Fisch", meaning: "Fish" },
          { letter: "O", like: "Similar to o in n[o]", word: "Brot", meaning: "Bread" },
          { letter: "U", like: "Similar to oo in f[oo]d", word: "Huus", meaning: "House" },
        ],
      },
      {
        id: "consonants",
        title: "Familiar Consonant Sounds",
        theory: "These consonants are generally pronounced in a familiar way.",
        sounds: [
          { letter: "B", like: "Like b in [b]ook", word: "Brot", meaning: "Bread" },
          { letter: "D", like: "Like d in [d]ay", word: "Danke", meaning: "Thank you" },
          { letter: "F", like: "Like f in [f]ish", word: "Fisch", meaning: "Fish" },
          { letter: "G", like: "Like g in [g]o", word: "Guet", meaning: "Good" },
          { letter: "H", like: "Like h in [h]ello", word: "Hundert", meaning: "Hundred" },
          { letter: "L", like: "Like l in [l]ove", word: "Läbe", meaning: "Life" },
          { letter: "M", like: "Like m in [m]other", word: "Mami", meaning: "Mum" },
          { letter: "N", like: "Like n in [n]o", word: "Nei", meaning: "No" },
          { letter: "P", like: "Like p in [p]ark", word: "Papi", meaning: "Dad" },
          { letter: "S", like: "Like s in [s]un", word: "Sunne", meaning: "Sun" },
          { letter: "T", like: "Like t in [t]able", word: "Tag", meaning: "Day" },
        ],
      },
    ],
  },
  {
    id: "different-letters",
    title: "Familiar sounds, different letters",
    topics: [
      { id: "introduction", title: "Introduction" },
      { id: "j", title: "The Letter J" },
      { id: "w", title: "The Letter W" },
      { id: "z", title: "The Letter Z" },
      { id: "sch", title: "The Combination SCH" },
    ],
  },
  {
    id: "new-sounds",
    title: "Sounds English doesn't have",
    topics: [
      { id: "introduction", title: "Introduction" },
      { id: "r", title: "The Letter R" },
      { id: "ae", title: "The Special Vowel Ä" },
      { id: "oe", title: "The Special Vowel Ö" },
      { id: "ue", title: "The Special Vowel Ü" },
      { id: "ch", title: "The Combination CH" },
      { id: "k", title: "The Letter K" },
      { id: "st", title: "The Combination ST" },
      { id: "sp", title: "The Combination SP" },
    ],
  },
];

export const BASE = "/dev/lesson-en";

export function topicHref(lesson: Lesson, topic: Topic) {
  return `${BASE}/${lesson.id}/${topic.id}`;
}

// The topics written so far, which are the ones to open.
export function written(lesson: Lesson) {
  return lesson.topics.filter((topic) => topic.theory !== undefined);
}
