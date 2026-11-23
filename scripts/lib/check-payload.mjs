// Checks an exercise in a lesson file (content/lessons) against its task in
// src/lib/exercises/tasks.ts, so a typo fails the tests (src/lib/learn/lessons.test.ts) instead of
// breaking a round.

// The task types the round can show. letters, say, repeat, sounds_like and hear are the
// pronunciation exercises in src/lib/exercises/pronunciation.ts.
export const EXERCISE_TYPES = ["pick", "build", "spot_error", "letters", "say", "repeat", "sounds_like", "hear"];

// A High German word with the letters that sound different in square brackets, such as
// "[Ch]a[r]a[k]te[r]": no empty or nested brackets, and no spaces.
const MARKED_WORD = /^(?:[^\s[\]]|\[[^\s[\]]+\])+$/;

// A sentence, with any letters to watch in square brackets, as in a word.
const MARKED_SENTENCE = /^(?:[^[\]]|\[[^\s[\]]+\])+$/;

// A recording's path in public/, or null until it's recorded.
function isRecording(value) {
  return value === null || (typeof value === "string" && value.startsWith("/"));
}

// Matches sentenceWords in src/lib/exercises/tasks.ts.
export function sentenceWords(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

// Text the learner reads in their own language: a string, or translations with English.
function isText(value) {
  if (typeof value === "string") return value.trim() !== "";
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    typeof value.en === "string" &&
    value.en.trim() !== "" &&
    entries.every(([locale, text]) => /^[a-z]{2}$/.test(locale) && typeof text === "string")
  );
}

// Swiss German, which isn't translated.
function isSwissGerman(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isIndex(value, list) {
  return Number.isInteger(value) && value >= 0 && value < list.length;
}

const FIELDS = {
  pick: { required: ["prompt", "options", "answer"], optional: ["context"] },
  build: { required: ["prompt", "tiles", "answer"], optional: [] },
  spot_error: { required: ["sentence", "wrong", "options", "answer"], optional: ["context"] },
  letters: { required: ["word"], optional: ["audio"] },
  say: { required: ["word"], optional: ["audio"] },
  repeat: { required: ["sentence"], optional: ["audio"] },
  sounds_like: { required: ["letter", "options", "example"], optional: [] },
  hear: { required: ["letter", "options"], optional: ["audio"] },
};

// Returns what's wrong with the payload, or null if nothing is.
export function payloadProblem(type, payload) {
  const fields = FIELDS[type];
  if (!fields) return `unknown type ${type}, expected one of ${EXERCISE_TYPES.join(", ")}`;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "payload isn't an object";

  const allowed = [...fields.required, ...fields.optional];
  const unknown = Object.keys(payload).find((key) => !allowed.includes(key));
  if (unknown) return `unknown field ${unknown}`;
  const missing = fields.required.find((key) => !(key in payload));
  if (missing) return `missing ${missing}`;

  if (type === "pick") {
    if ("context" in payload && !isText(payload.context)) return "context isn't text";
    if (!isText(payload.prompt)) return "prompt isn't text";
    if (!Array.isArray(payload.options) || payload.options.length < 2 || !payload.options.every(isText)) {
      return "options need at least two texts";
    }
    if (!isIndex(payload.answer, payload.options)) return "answer isn't the position of an option";
    return null;
  }

  if (type === "build") {
    if (!isText(payload.prompt)) return "prompt isn't text";
    if (!Array.isArray(payload.tiles) || payload.tiles.length < 2 || !payload.tiles.every(isSwissGerman)) {
      return "tiles need at least two words";
    }
    if (!Array.isArray(payload.answer) || payload.answer.length === 0 || !payload.answer.every(isSwissGerman)) {
      return "answer needs at least one word";
    }
    const left = [...payload.tiles];
    for (const word of payload.answer) {
      const i = left.indexOf(word);
      if (i === -1) return `answer uses "${word}" more often than the tiles have it`;
      left.splice(i, 1);
    }
    return null;
  }

  if (type === "letters" || type === "say") {
    if (typeof payload.word !== "string" || !MARKED_WORD.test(payload.word)) {
      return "word needs letters, with those that sound different in [brackets]";
    }
    // A word to say can have nothing to watch, as the English track's familiar letters.
    if (type === "letters" && !/\[/.test(payload.word)) return "word needs letters that sound different in [brackets]";
    if (type === "letters" && "audio" in payload) {
      const { audio } = payload;
      const keys = audio && typeof audio === "object" ? Object.keys(audio).sort().join() : "";
      if (keys !== "dialect,standardGerman" || !isRecording(audio.standardGerman) || !isRecording(audio.dialect)) {
        return "audio needs standardGerman and dialect, each a path or null";
      }
    }
    if (type === "say" && "audio" in payload && !isRecording(payload.audio)) return "audio is a path or null";
    return null;
  }

  if (type === "sounds_like") {
    if (!isText(payload.letter)) return "letter isn't text";
    const { options, example } = payload;
    if (!Array.isArray(options) || options.length < 2 || options.length > 3) return "options needs two or three comparisons";
    if (!options.every((option) => typeof option === "string" && MARKED_SENTENCE.test(option) && /\[/.test(option))) {
      return "each option needs its sound's letters in [brackets]";
    }
    if (new Set(options).size !== options.length) return "options repeat";
    if (!example || typeof example !== "object" || !isText(example.word) || !isText(example.meaning)) {
      return "example needs a word and its meaning";
    }
    if ("audio" in example && !isRecording(example.audio)) return "example's audio is a path or null";
    return null;
  }

  if (type === "hear") {
    if (!isText(payload.letter)) return "letter, the sound it tests, isn't text";
    const { options } = payload;
    if (!Array.isArray(options) || options.length < 2 || options.length > 3) return "options needs two or three words";
    if (!options.every((option) => option && isText(option.word) && isText(option.meaning))) {
      return "each option needs a word and its meaning";
    }
    if (new Set(options.map((option) => option.word)).size !== options.length) return "options repeat";
    if ("audio" in payload && !isRecording(payload.audio)) return "audio is a path or null";
    return null;
  }

  if (type === "repeat") {
    if (!isSwissGerman(payload.sentence) || !MARKED_SENTENCE.test(payload.sentence)) {
      return "sentence needs text, with any letters to watch in [brackets]";
    }
    if ("audio" in payload && !isRecording(payload.audio)) return "audio is a path or null";
    return null;
  }

  if ("context" in payload && !isText(payload.context)) return "context isn't text";
  if (!isSwissGerman(payload.sentence)) return "sentence isn't text";
  const words = sentenceWords(payload.sentence);
  const { wrong } = payload;
  if (!Array.isArray(wrong) || wrong.length === 0 || !wrong.every((i) => isIndex(i, words))) {
    return "wrong needs the positions of the wrong words, counting from 0";
  }
  if (wrong.some((i, n) => n > 0 && i !== wrong[n - 1] + 1)) return "wrong words must be next to each other, in order";
  if (!Array.isArray(payload.options) || payload.options.length < 2 || !payload.options.every(isSwissGerman)) {
    return "options need at least two corrections";
  }
  if (!isIndex(payload.answer, payload.options)) return "answer isn't the position of an option";
  const mistake = wrong.map((i) => words[i]).join(" ").replace(/[.,!?;:…»]+$/, "");
  if (payload.options[payload.answer] === mistake) {
    return "the correction is the same as the mistake";
  }
  return null;
}
