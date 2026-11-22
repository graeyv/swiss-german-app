// The English track's Pronunciation module while it's being written: three lessons, grouped by
// whether the letter and its sound are familiar from English, as written by the user. Moves into
// content/lessons once settled.

// A Swiss German word and what it means, to listen to. No recordings yet.
export type Word = { word: string; meaning: string };

// A letter, how it sounds compared with a word the learner knows, and Swiss German words with it.
// In like, the letters of the English word that make the sound are in brackets, such as
// "f[a]ther", to mark them as the pronunciation exercises do. A topic with only one letter, such as
// J, says what it sounds like in its theory instead, marked the same way, and has no like.
export type Sound = { letter: string; like?: string; words: Word[] };

// Without theory, a topic is still to be written. Its theory and tip can mark letters with
// brackets, as like does. A tip adds a way into the sound the text doesn't give, such as another
// language's word, and shows last in a yellow card.
export type Topic = { id: string; title: string; theory?: string; tip?: string; sounds?: Sound[] };

export type Lesson = { id: string; title: string; topics: Topic[] };

export const MODULE = {
  title: "Pronunciation",
  number: 2,
  subtitle: "How Bärndütsch sounds",
  description:
    "Start with the sounds you already know from English, then those written differently, and finally the ones that are new.",
  expectations: [
    { icon: "headphones", title: "Hear the sounds of Bärndütsch" },
    { icon: "speaking", title: "Say them yourself" },
  ],
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
          "Many Bärndütsch sounds are ones you already know from English, and if you speak French, Spanish or Portuguese, from those too. We start with these, so you can recognise and say them in everyday words.",
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
        theory: "These consonants are said as in English.",
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
          "Some letters you know are said differently in Bärndütsch. The sounds themselves are familiar: only the letter that stands for them is new.",
      },
      {
        id: "j",
        title: "J",
        theory: "In Bärndütsch, J is pronounced like the English Y in [y]es.",
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
        theory: "In Bärndütsch, W is pronounced like the English V in [v]ery.",
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
        theory: "In Bärndütsch, Z is pronounced like TS in the English words ca[ts] or [Ts]unami.",
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
    title: "New sounds or new letters",
    topics: [
      {
        id: "introduction",
        title: "Something new",
        theory:
          "Now it gets new: sounds English doesn't have, such as CH and R, and letters it doesn't have, such as Ä, Ö and Ü. They take a little more practice.",
      },
      {
        id: "r",
        title: "R",
        theory:
          "In Bärndütsch, R is rolled with the tip of the tongue, quite unlike the English R.",
        tip: "If you speak Spanish or Italian, you can try the rolled R as a starting point, as in Italian [r]osso or Spanish pe[rr]o.",
        sounds: [
          {
            letter: "R",
            words: [
              { word: "Rot", meaning: "Red" },
              { word: "Räge", meaning: "Rain" },
              { word: "Richtig", meaning: "Correct" },
            ],
          },
        ],
      },
      {
        id: "ae",
        title: "Ä",
        theory:
          "In Bärndütsch, Ä is a very open vowel, close to the a in c[a]t or b[a]t as said in British English.",
        sounds: [
          {
            letter: "Ä",
            words: [
              { word: "Mässer", meaning: "Knife" },
              { word: "Bär", meaning: "Bear" },
              { word: "Stärn", meaning: "Star" },
            ],
          },
        ],
      },
      {
        id: "oe",
        title: "Ö",
        theory:
          "Ö doesn't exist in English, but it's close to the vowel in b[ir]d or h[er] in British English.",
        sounds: [
          {
            letter: "Ö",
            words: [
              { word: "Schön", meaning: "Beautiful" },
              { word: "Löffu", meaning: "Spoon" },
              { word: "Öffne", meaning: "Open" },
            ],
          },
        ],
      },
      {
        id: "ue",
        title: "Ü",
        theory:
          "Ü doesn't exist in English either. Say a long ee as in s[ee], and while you keep saying it, push your lips forward into a small circle, as if you were about to whistle.",
        tip: "If you know French: Ü sounds like the u in t[u].",
        sounds: [
          {
            letter: "Ü",
            words: [
              { word: "Tür", meaning: "Door" },
              { word: "Müed", meaning: "Tired" },
              { word: "Nüt", meaning: "Nothing" },
            ],
          },
        ],
      },
      {
        id: "ch",
        title: "CH",
        theory:
          "CH is one of the most typical sounds of Bärndütsch: a strong, breathy sound made at the back of the mouth, a bit like gently clearing your throat.",
        tip: "If you know Spanish, CH is like the j in [J]osé. The French r in [r]ouge comes close too.",
        sounds: [
          {
            letter: "CH",
            words: [
              { word: "Chind", meaning: "Child" },
              { word: "Dach", meaning: "Roof" },
              { word: "Buech", meaning: "Book" },
            ],
          },
        ],
      },
      {
        id: "k",
        title: "K",
        theory:
          "In Bärndütsch, K is followed by a short CH, the breathy sound from the topic before. So Kiosk sounds almost like “kchiosk”.",
        sounds: [
          {
            letter: "K",
            words: [
              { word: "Knapp", meaning: "Close" },
              { word: "Karussell", meaning: "Carousel" },
              { word: "Kiosk", meaning: "Kiosk" },
            ],
          },
        ],
      },
      {
        id: "st",
        title: "ST",
        theory:
          "In Bärndütsch, ST is said as SHT, at the start of a word and in the middle too: the sh in [sh]oe, followed by t. Strass sounds like “shtrass”.",
        sounds: [
          {
            letter: "ST",
            words: [
              { word: "Strass", meaning: "Street" },
              { word: "Stäge", meaning: "Stairs" },
              { word: "Stadt", meaning: "City" },
            ],
          },
        ],
      },
      {
        id: "sp",
        title: "SP",
        theory:
          "In Bärndütsch, SP is said as SHP, at the start of a word and in the middle too: the sh in [sh]oe, followed by p. Sport sounds like “shport”.",
        sounds: [
          {
            letter: "SP",
            words: [
              { word: "Sport", meaning: "Sport" },
              { word: "Spiu", meaning: "Game" },
              { word: "Spaghetti", meaning: "Spaghetti" },
            ],
          },
        ],
      },
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
