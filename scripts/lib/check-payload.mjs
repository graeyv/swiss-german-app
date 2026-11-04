// Checks a grammar exercise's payload against its task in src/lib/exercises/tasks.ts, so a typo
// in content/grammar_exercises.tsv fails the content build instead of breaking a session.

// Matches the check on public.grammar_exercises.type.
export const EXERCISE_TYPES = ["pick", "build", "spot_error"];

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
