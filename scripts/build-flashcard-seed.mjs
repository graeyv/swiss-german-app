// Turns the flashcard content in content/ into supabase/seeds/flashcards.sql: decks.tsv,
// cards.tsv (words), grammar_points.tsv and grammar_exercises.tsv.
//
// Translated columns end in a language code, such as title_en or notes_de. English is
// required, because it's what every other language falls back to. Adding a language means
// adding its columns, such as meaning_fr, once it's in public.locales.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { payloadProblem } from "./lib/check-payload.mjs";

// Matches the check on public.decks.color.
const DECK_COLORS = ["pink", "blue", "green", "yellow", "purple", "orange"];
// Matches the check on public.decks.kind.
const DECK_KINDS = ["vocabulary", "grammar"];
// Matches the check on public.vocabulary_items.type. An empty type is a word.
const CARD_TYPES = ["word", "sentence", "expression"];

// A card's type in lower case, so "Sentence" from a spreadsheet works too.
const typeOf = (card) => card.type?.toLowerCase() || "word";

function parseTsv(text, name) {
  const [header, ...lines] = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!header) return [];
  const columns = header.split("\t");
  return lines.map((line, index) => {
    const values = line.split("\t");
    if (values.length > columns.length) {
      throw new Error(`${name} line ${index + 2}: more values than columns`);
    }
    return Object.fromEntries(columns.map((column, i) => [column, values[i]?.trim() ?? ""]));
  });
}

function quote(value) {
  return value ? `'${value.replaceAll("'", "''")}'` : "null";
}

// A list of codes for SQL, which may be empty.
function codeArray(codes) {
  return codes.length ? `array[${codes.map(quote).join(", ")}]` : "array[]::text[]";
}

function findDuplicate(values) {
  return values.find((value, index) => values.indexOf(value) !== index);
}

// The languages a file has columns for, from fields such as title_en and title_de.
function localesOf(rows, fields) {
  const pattern = new RegExp(`^(?:${fields.join("|")})_([a-z]{2})$`);
  return [...new Set(Object.keys(rows[0] ?? {}).flatMap((key) => pattern.exec(key)?.[1] ?? []))];
}

// One translation row per language that has at least one of the fields filled in.
function translationRows(rows, fields, codeOf) {
  return localesOf(rows, fields).flatMap((locale) =>
    rows
      .filter((row) => fields.some((field) => row[`${field}_${locale}`]))
      .map(
        (row) =>
          `  (${[codeOf(row), locale, ...fields.map((field) => row[`${field}_${locale}`])].map(quote).join(", ")})`,
      ),
  );
}

const withDeckCodes = (row) => ({
  ...row,
  deckCodes: row.deck_codes.split(",").map((code) => code.trim()).filter(Boolean),
});

export function buildSeed(decksTsv, cardsTsv, grammarPointsTsv = "", grammarExercisesTsv = "") {
  const decks = parseTsv(decksTsv, "decks.tsv");
  const cards = parseTsv(cardsTsv, "cards.tsv").map(withDeckCodes);
  const points = parseTsv(grammarPointsTsv, "grammar_points.tsv").map(withDeckCodes);
  const exercises = parseTsv(grammarExercisesTsv, "grammar_exercises.tsv");

  const decksByCode = new Map(decks.map((deck) => [deck.code, deck]));
  const parentCodes = new Set(decks.map((deck) => deck.parent_code).filter(Boolean));

  const duplicateDeck = findDuplicate(decks.map((deck) => deck.code));
  if (duplicateDeck) throw new Error(`Duplicate deck code: ${duplicateDeck}`);
  const duplicateCard = findDuplicate(cards.map((card) => card.code));
  if (duplicateCard) throw new Error(`Duplicate card code: ${duplicateCard}`);
  const duplicatePoint = findDuplicate(points.map((point) => point.code));
  if (duplicatePoint) throw new Error(`Duplicate grammar point code: ${duplicatePoint}`);
  const duplicateExercise = findDuplicate(exercises.map((exercise) => exercise.code));
  if (duplicateExercise) throw new Error(`Duplicate exercise code: ${duplicateExercise}`);

  for (const deck of decks) {
    if (!deck.code || !deck.title_en) {
      throw new Error(`Deck is missing a code or an English title: ${deck.code}`);
    }
    if (deck.color && !DECK_COLORS.includes(deck.color)) {
      throw new Error(`Deck ${deck.code} has an unknown color: ${deck.color}`);
    }
    if (deck.parent_code && !decksByCode.has(deck.parent_code)) {
      throw new Error(`Deck ${deck.code} has an unknown parent: ${deck.parent_code}`);
    }
    if (deck.kind && !DECK_KINDS.includes(deck.kind)) {
      throw new Error(`Deck ${deck.code} has an unknown kind: ${deck.kind}`);
    }
    if (deck.draft && deck.draft !== "yes") {
      throw new Error(`Deck ${deck.code} has draft "${deck.draft}": leave it empty or write yes`);
    }
  }
  for (const locale of localesOf(decks, ["title", "description"])) {
    const untitled = decks.find((deck) => deck[`description_${locale}`] && !deck[`title_${locale}`]);
    if (untitled) throw new Error(`Deck ${untitled.code} has a description_${locale} but no title_${locale}`);
  }

  // A deck without a kind takes its parent's, and a top-level one holds words. A draft deck
  // and everything below it stays unpublished.
  const kindOf = (deck) => {
    const parentKind = deck.parent_code ? kindOf(decksByCode.get(deck.parent_code)) : null;
    if (deck.kind && parentKind && deck.kind !== parentKind) {
      throw new Error(`Deck ${deck.code} is ${deck.kind}, but its parent is ${parentKind}`);
    }
    return deck.kind || parentKind || "vocabulary";
  };
  const isDraft = (deck) =>
    deck.draft === "yes" || (!!deck.parent_code && isDraft(decksByCode.get(deck.parent_code)));

  // Cards and grammar points sit on the lowest level of decks of their kind.
  const checkDecks = (row, label, kind) => {
    if (row.deckCodes.length === 0) throw new Error(`${label} has no deck`);
    for (const code of row.deckCodes) {
      const deck = decksByCode.get(code);
      if (!deck) throw new Error(`${label} has an unknown deck: ${code}`);
      if (parentCodes.has(code)) {
        throw new Error(`${label} is on ${code}, but only the lowest level holds cards`);
      }
      if (kindOf(deck) !== kind) throw new Error(`${label} is on ${code}, which isn't a ${kind} deck`);
    }
  };

  for (const card of cards) {
    for (const column of ["code", "dialect", "swiss_german", "high_german", "meaning_en"]) {
      if (!card[column]) throw new Error(`Card ${card.code} is missing ${column}`);
    }
    if (!CARD_TYPES.includes(typeOf(card))) {
      throw new Error(`Card ${card.code} has an unknown type: ${card.type}`);
    }
    checkDecks(card, `Card ${card.code}`, "vocabulary");
  }

  const pointsByCode = new Map(points.map((point) => [point.code, point]));
  for (const point of points) {
    for (const column of ["code", "title_en", "explanation_en"]) {
      if (!point[column]) throw new Error(`Grammar point ${point.code} is missing ${column}`);
    }
    checkDecks(point, `Grammar point ${point.code}`, "grammar");
  }

  const payloads = new Map();
  for (const exercise of exercises) {
    const label = `Exercise ${exercise.code}`;
    for (const column of ["code", "point", "type", "level", "payload"]) {
      if (!exercise[column]) throw new Error(`${label} is missing ${column}`);
    }
    const point = pointsByCode.get(exercise.point);
    if (!point) throw new Error(`${label} has an unknown grammar point: ${exercise.point}`);
    if (!["1", "2", "3"].includes(exercise.level)) throw new Error(`${label} needs level 1, 2 or 3`);
    if (point.dialect && exercise.dialect && exercise.dialect !== point.dialect) {
      throw new Error(`${label} is for ${exercise.dialect}, but its grammar point is only for ${point.dialect}`);
    }
    let payload;
    try {
      payload = JSON.parse(exercise.payload);
    } catch {
      throw new Error(`${label} has a payload that isn't valid JSON`);
    }
    const problem = payloadProblem(exercise.type, payload);
    if (problem) throw new Error(`${label}: ${problem}`);
    payloads.set(exercise.code, JSON.stringify(payload));
  }
  // The first time a learner meets a rule, they get an exercise that only asks them to recognise it.
  for (const point of points) {
    if (!exercises.some((exercise) => exercise.point === point.code && exercise.level === "1")) {
      throw new Error(`Grammar point ${point.code} needs at least one level 1 exercise`);
    }
  }

  // Position counts within each parent, or each deck, following the order of the file.
  const positions = new Map();
  const nextPosition = (key) => {
    const position = (positions.get(key) ?? 0) + 1;
    positions.set(key, position);
    return position;
  };

  const deckRows = decks.map(
    (deck) =>
      `  (${[deck.code, deck.parent_code, kindOf(deck), deck.emoji, deck.color].map(quote).join(", ")}, ${nextPosition(`deck:${deck.parent_code}`)}, ${!isDraft(deck)})`,
  );
  const cardRows = cards.map(
    (card) =>
      `  (${[card.code, card.dialect, card.swiss_german, card.high_german, card.audio_path, typeOf(card)].map(quote).join(", ")})`,
  );
  const itemRows = cards.flatMap((card) =>
    card.deckCodes.map(
      (code) => `  (${quote(code)}, ${quote(card.code)}, ${nextPosition(`item:${code}`)})`,
    ),
  );
  const pointItemRows = points.flatMap((point) =>
    point.deckCodes.map(
      (code) => `  (${quote(code)}, ${quote(point.code)}, ${nextPosition(`item:${code}`)})`,
    ),
  );
  const deckTranslationRows = translationRows(decks, ["title", "description"], (deck) => deck.code);
  const cardTranslationRows = translationRows(cards, ["meaning", "notes"], (card) => card.code);
  const pointTranslationRows = translationRows(points, ["title", "explanation"], (point) => point.code);

  const grammarSql = points.length
    ? `
insert into public.grammar_points (code, dialect_id) values
${points.map((point) => `  (${quote(point.code)}, ${quote(point.dialect)})`).join(",\n")}
on conflict (code) do update
  set dialect_id = excluded.dialect_id;

delete from public.grammar_point_translations
where grammar_point_id in (
  select id from public.grammar_points where code = any (${codeArray(points.map((point) => point.code))})
);

insert into public.grammar_point_translations (grammar_point_id, locale, title, explanation)
select g.id, t.locale, t.title, t.explanation
from (values
${pointTranslationRows.join(",\n")}
) as t (point_code, locale, title, explanation)
join public.grammar_points g on g.code = t.point_code;

insert into public.grammar_exercises (code, grammar_point_id, type, level, dialect_id, payload)
select e.code, g.id, e.type, e.level, e.dialect_id, e.payload::jsonb
from (values
${exercises
  .map(
    (exercise) =>
      `  (${[exercise.code, exercise.point, exercise.type].map(quote).join(", ")}, ${exercise.level}, ${quote(exercise.dialect)}, ${quote(payloads.get(exercise.code))})`,
  )
  .join(",\n")}
) as e (code, point_code, type, level, dialect_id, payload)
join public.grammar_points g on g.code = e.point_code
on conflict (code) do update
  set grammar_point_id = excluded.grammar_point_id,
      type = excluded.type,
      level = excluded.level,
      dialect_id = excluded.dialect_id,
      payload = excluded.payload;
`
    : "";

  const pointItemsSql = pointItemRows.length
    ? `
insert into public.deck_items (deck_id, card_id, position)
select d.id, c.id, i.position
from (values
${pointItemRows.join(",\n")}
) as i (deck_code, point_code, position)
join public.decks d on d.code = i.deck_code
join public.grammar_points g on g.code = i.point_code
join public.cards c on c.grammar_point_id = g.id;
`
    : "";

  return `-- Generated by scripts/build-flashcard-seed.mjs from content/. Edit those files instead.
-- Safe to run more than once. Words and grammar points dropped from content/ stay in the
-- database without a deck, because deleting them would delete learners' review history.
-- Dropped exercises are deleted: reviews that showed one keep their place in the log.
begin;

create temporary table seed_decks (
  code text, parent_code text, kind text, emoji text, color text, position integer, published boolean
) on commit drop;

insert into seed_decks (code, parent_code, kind, emoji, color, position, published) values
${deckRows.join(",\n")};

insert into public.decks (code, kind, emoji, color, position, published)
select code, kind, emoji, color, position, published from seed_decks
on conflict (code) do update
  set kind = excluded.kind,
      emoji = excluded.emoji,
      color = excluded.color,
      position = excluded.position,
      published = excluded.published;

update public.decks d
set parent_id = p.id
from seed_decks s
left join public.decks p on p.code = s.parent_code
where d.code = s.code;

delete from public.decks where code not in (select code from seed_decks);

-- Translations are rewritten in full, so one removed from content/ disappears here too.
delete from public.deck_translations;

insert into public.deck_translations (deck_id, locale, title, description)
select d.id, t.locale, t.title, t.description
from (values
${deckTranslationRows.join(",\n")}
) as t (deck_code, locale, title, description)
join public.decks d on d.code = t.deck_code;

insert into public.vocabulary_items (code, dialect_id, swiss_german, high_german, audio_path, type) values
${cardRows.join(",\n")}
on conflict (code) do update
  set dialect_id = excluded.dialect_id,
      swiss_german = excluded.swiss_german,
      high_german = excluded.high_german,
      audio_path = excluded.audio_path,
      type = excluded.type;

delete from public.vocabulary_translations
where vocabulary_id in (
  select id from public.vocabulary_items where code in (${cards.map((card) => quote(card.code)).join(", ")})
);

insert into public.vocabulary_translations (vocabulary_id, locale, meaning, notes)
select v.id, t.locale, t.meaning, t.notes
from (values
${cardTranslationRows.join(",\n")}
) as t (card_code, locale, meaning, notes)
join public.vocabulary_items v on v.code = t.card_code;
${grammarSql}
delete from public.grammar_exercises
where not (code = any (${codeArray(exercises.map((exercise) => exercise.code))}));

delete from public.deck_items;

-- Each word and grammar point gets its card when it's first inserted, from a trigger.
insert into public.deck_items (deck_id, card_id, position)
select d.id, c.id, i.position
from (values
${itemRows.join(",\n")}
) as i (deck_code, card_code, position)
join public.decks d on d.code = i.deck_code
join public.vocabulary_items v on v.code = i.card_code
join public.cards c on c.vocabulary_id = v.id;
${pointItemsSql}
commit;
`;
}

// The grammar files are optional, so content can start with words only.
const readOptional = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "");

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = buildSeed(
    readFileSync("content/decks.tsv", "utf8"),
    readFileSync("content/cards.tsv", "utf8"),
    readOptional("content/grammar_points.tsv"),
    readOptional("content/grammar_exercises.tsv"),
  );
  writeFileSync("supabase/seeds/flashcards.sql", seed);
  console.log("Wrote supabase/seeds/flashcards.sql");
}
