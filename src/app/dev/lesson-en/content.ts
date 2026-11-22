// The English track's Pronunciation module while it's being written: three lessons, grouped by
// whether the letter and its sound are familiar from English. Lessons 1 and 2 have their text, as
// written by the user; lesson 3 has its topics' titles only. Moves into content/lessons once
// settled.

// A Swiss German word and what it means, to listen to. No recordings yet.
export type Word = { word: string; meaning: string };

// A letter, how it sounds compared with a word the learner knows, and Swiss German words with it.
// In like, the letters of the English word that make the sound are in brackets, such as
// "f[a]ther", to mark them as the pronunciation exercises do. A topic with only one letter, such as
// J, says what it sounds like in its theory instead, marked the same way, and has no like.
export type Sound = { letter: string; like?: string; words: Word[] };

// Without theory, a topic is still to be written. Its theory can mark letters with brackets, as
// like does.
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
          "Many Swiss German sounds are ones you already know from English, and if you speak French, Spanish or Portuguese, from those too. We start with these, so you can recognise and say them in everyday words.",
      },
      {
        id: "vowels",
        title: "Vowels",
        theory: "Some basic vowel sounds are close to sounds you may already know.",
        sounds: [
          { letter: "A", like: "Similar to a in f[a]ther", words: [{ word: "Mami", meaning: "Mum" }] },
          { letter: "E", like: "Similar to e in b[e]d", words: [{ word: "Bett", meaning: "Bed" }] },
          { letter: "I", like: "Similar to i in s[i]t", words: [{ word: "Fisch", meaning: "Fish" }] },
          { letter: "O", like: "Similar to o in n[o]", words: [{ word: "Brot", meaning: "Bread" }] },
          { letter: "U", like: "Similar to oo in f[oo]d", words: [{ word: "Huus", meaning: "House" }] },
        ],
      },
      {
        id: "consonants",
        title: "Consonants",
        theory: "These consonants are generally pronounced in a familiar way.",
        sounds: [
          { letter: "B", like: "Like b in [b]ook", words: [{ word: "Brot", meaning: "Bread" }] },
          { letter: "D", like: "Like d in [d]ay", words: [{ word: "Danke", meaning: "Thank you" }] },
          { letter: "F", like: "Like f in [f]ish", words: [{ word: "Fisch", meaning: "Fish" }] },
          { letter: "G", like: "Like g in [g]o", words: [{ word: "Guet", meaning: "Good" }] },
          { letter: "H", like: "Like h in [h]ello", words: [{ word: "Hundert", meaning: "Hundred" }] },
          { letter: "L", like: "Like l in [l]ove", words: [{ word: "Läbe", meaning: "Life" }] },
          { letter: "M", like: "Like m in [m]other", words: [{ word: "Mami", meaning: "Mum" }] },
          { letter: "N", like: "Like n in [n]o", words: [{ word: "Nei", meaning: "No" }] },
          { letter: "P", like: "Like p in [p]ark", words: [{ word: "Papi", meaning: "Dad" }] },
          { letter: "S", like: "Like s in [s]un", words: [{ word: "Sunne", meaning: "Sun" }] },
          { letter: "T", like: "Like t in [t]able", words: [{ word: "Tag", meaning: "Day" }] },
        ],
      },
    ],
  },
  {
    id: "different-letters",
    title: "Familiar sounds, different letters",
    topics: [
      {
        id: "introduction",
        title: "Sounds you know, written differently",
        theory:
          "Some letters you know are said differently in Swiss German. The sounds themselves are familiar: only the letter that stands for them is new.",
      },
      {
        id: "j",
        title: "J",
        theory: "In Swiss German, J is pronounced like the English Y in [y]es.",
        sounds: [
          {
            letter: "J",
            words: [
              { word: "Ja", meaning: "Yes" },
              { word: "Jahr", meaning: "Year" },
              { word: "Jede", meaning: "Every" },
            ],
          },
        ],
      },
      {
        id: "w",
        title: "W",
        theory: "In Swiss German, W is generally pronounced like the English V in [v]ery.",
        sounds: [
          {
            letter: "W",
            words: [
              { word: "Wasser", meaning: "Water" },
              { word: "Wuche", meaning: "Week" },
              { word: "Winter", meaning: "Winter" },
            ],
          },
        ],
      },
      {
        id: "z",
        title: "Z",
        theory: "In Swiss German, Z is pronounced like TS in the English words ca[ts] or [Ts]unami.",
        sounds: [
          {
            letter: "Z",
            words: [
              { word: "Ziit", meaning: "Time" },
              { word: "Znacht", meaning: "Dinner" },
              { word: "Züri", meaning: "Zurich" },
            ],
          },
        ],
      },
      {
        id: "sch",
        title: "SCH",
        theory: "The combination SCH is pronounced like the English SH in [sh]oe.",
        sounds: [
          {
            letter: "SCH",
            words: [
              { word: "Schoggi", meaning: "Chocolate" },
              { word: "Schiff", meaning: "Ship" },
              { word: "Schueh", meaning: "Shoes" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "new-sounds",
    title: "Sounds English doesn't have",
    topics: [
      { id: "introduction", title: "Introduction" },
      { id: "r", title: "R" },
      { id: "ae", title: "Ä" },
      { id: "oe", title: "Ö" },
      { id: "ue", title: "Ü" },
      { id: "ch", title: "CH" },
      { id: "k", title: "K" },
      { id: "st", title: "ST" },
      { id: "sp", title: "SP" },
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
