// Turns the flashcard content in content/ into supabase/seeds/flashcards.sql: decks.tsv and
// cards.tsv (words).
//
// Translated columns end in a language code, such as title_en or notes_de. English is
// required, because it's what every other language falls back to. Adding a language means
// adding its columns, such as meaning_fr, once it's in public.locales.
//
// A card is the same for every dialect, with a form per dialect: swiss_german_be and audio_be for
// Bärndütsch, swiss_german_zh and audio_zh for Züritüütsch. variants_be and variants_zh hold other
// ways of saying it in that dialect, separated by semicolons, such as "Salü; Hallo". A card needs at least one form, and
// learners only see it in a dialect it has a form for. Adding a dialect means adding its
// columns, once it's in public.dialects (supabase/seed.sql).
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Matches the check on public.decks.color.
const DECK_COLORS = ["pink", "blue", "green", "yellow", "purple", "orange"];
// Matches the check on public.decks.kind.
const DECK_KINDS = ["vocabulary"];
// Matches the check on public.vocabulary_items.type. An empty type is a word.
const CARD_TYPES = ["word", "sentence", "expression"];
// The dialects in public.dialects, which supabase/seed.sql adds.
const DIALECTS = ["be", "zh"];

// The dialects the cards file has columns for, from columns such as swiss_german_be.
function dialectsOf(cards) {
  return Object.keys(cards[0] ?? {}).flatMap((key) => /^swiss_german_([a-z]{2})$/.exec(key)?.[1] ?? []);
}

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

// A card's variants in a dialect, from a cell such as "Salü; Hallo".
function variantsOf(cell) {
  return (cell ?? "").split(";").map((variant) => variant.trim()).filter(Boolean);
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

export function buildSeed(decksTsv, cardsTsv) {
  const decks = parseTsv(decksTsv, "decks.tsv");
  const cards = parseTsv(cardsTsv, "cards.tsv").map(withDeckCodes);

  const decksByCode = new Map(decks.map((deck) => [deck.code, deck]));
  const parentCodes = new Set(decks.map((deck) => deck.parent_code).filter(Boolean));

  const duplicateDeck = findDuplicate(decks.map((deck) => deck.code));
  if (duplicateDeck) throw new Error(`Duplicate deck code: ${duplicateDeck}`);
  const duplicateCard = findDuplicate(cards.map((card) => card.code));
  if (duplicateCard) throw new Error(`Duplicate card code: ${duplicateCard}`);

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

  // Cards sit on the lowest level of decks of their kind.
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

  const dialects = dialectsOf(cards);
  if (cards.length && ["dialect", "swiss_german", "audio_path"].some((column) => column in cards[0])) {
    throw new Error("cards.tsv has a column per dialect now: swiss_german_be, audio_be and so on");
  }
  const unknownDialect = dialects.find((dialect) => !DIALECTS.includes(dialect));
  if (unknownDialect) throw new Error(`cards.tsv has columns for an unknown dialect: ${unknownDialect}`);
  for (const card of cards) {
    for (const column of ["code", "high_german", "meaning_en"]) {
      if (!card[column]) throw new Error(`Card ${card.code} is missing ${column}`);
    }
    if (!dialects.some((dialect) => card[`swiss_german_${dialect}`])) {
      throw new Error(`Card ${card.code} has no Swiss German in any dialect`);
    }
    for (const field of ["audio", "variants"]) {
      const stray = dialects.find((dialect) => card[`${field}_${dialect}`] && !card[`swiss_german_${dialect}`]);
      if (stray) throw new Error(`Card ${card.code} has ${field}_${stray} but no swiss_german_${stray}`);
    }
    if (!CARD_TYPES.includes(typeOf(card))) {
      throw new Error(`Card ${card.code} has an unknown type: ${card.type}`);
    }
    checkDecks(card, `Card ${card.code}`, "vocabulary");
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
    (card) => `  (${[card.code, card.high_german, typeOf(card)].map(quote).join(", ")})`,
  );
  const formRows = cards.flatMap((card) =>
    dialects
      .filter((dialect) => card[`swiss_german_${dialect}`])
      .map(
        (dialect) =>
          `  (${[card.code, dialect, card[`swiss_german_${dialect}`]].map(quote).join(", ")}, ${codeArray(variantsOf(card[`variants_${dialect}`]))}, ${quote(card[`audio_${dialect}`])})`,
      ),
  );
  const itemRows = cards.flatMap((card) =>
    card.deckCodes.map(
      (code) => `  (${quote(code)}, ${quote(card.code)}, ${nextPosition(`item:${code}`)})`,
    ),
  );
  const deckTranslationRows = translationRows(decks, ["title", "description"], (deck) => deck.code);
  const cardTranslationRows = translationRows(cards, ["meaning", "notes"], (card) => card.code);

  // Words are optional too, so content can hold only the deck structure for a while.
  const vocabularySql = cards.length
    ? `
insert into public.vocabulary_items (code, high_german, type) values
${cardRows.join(",\n")}
on conflict (code) do update
  set high_german = excluded.high_german,
      type = excluded.type;

-- Forms are rewritten in full, so a dialect removed from a card disappears here too.
delete from public.vocabulary_forms
where vocabulary_id in (
  select id from public.vocabulary_items where code in (${cards.map((card) => quote(card.code)).join(", ")})
);

insert into public.vocabulary_forms (vocabulary_id, dialect_id, swiss_german, variants, audio_path)
select v.id, f.dialect_id, f.swiss_german, f.variants, f.audio_path
from (values
${formRows.join(",\n")}
) as f (card_code, dialect_id, swiss_german, variants, audio_path)
join public.vocabulary_items v on v.code = f.card_code;

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
`
    : "";

  const itemsSql = itemRows.length
    ? `
-- Each word gets its card when it's first inserted, from a trigger.
insert into public.deck_items (deck_id, card_id, position)
select d.id, c.id, i.position
from (values
${itemRows.join(",\n")}
) as i (deck_code, card_code, position)
join public.decks d on d.code = i.deck_code
join public.vocabulary_items v on v.code = i.card_code
join public.cards c on c.vocabulary_id = v.id;
`
    : "";

  return `-- Generated by scripts/build-flashcard-seed.mjs from content/. Edit those files instead.
-- Safe to run more than once. Words dropped from content/ stay in the database without a deck,
-- because deleting them would delete learners' review history.
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

${vocabularySql}
delete from public.deck_items;

${itemsSql}
commit;
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = buildSeed(readFileSync("content/decks.tsv", "utf8"), readFileSync("content/cards.tsv", "utf8"));
  writeFileSync("supabase/seeds/flashcards.sql", seed);
  console.log("Wrote supabase/seeds/flashcards.sql");
}
