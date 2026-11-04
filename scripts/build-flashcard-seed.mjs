// Turns content/decks.tsv and content/cards.tsv into supabase/seeds/flashcards.sql.
//
// Translated columns end in a language code, such as title_en or notes_de. English is
// required, because it's what every other language falls back to. Adding a language means
// adding its columns, such as meaning_fr, once it's in public.locales.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Matches the check on public.decks.color.
const DECK_COLORS = ["pink", "blue", "green", "yellow", "purple", "orange"];

function parseTsv(text, name) {
  const [header, ...lines] = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
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

export function buildSeed(decksTsv, cardsTsv) {
  const decks = parseTsv(decksTsv, "decks.tsv");
  const cards = parseTsv(cardsTsv, "cards.tsv").map((card) => ({
    ...card,
    deckCodes: card.deck_codes.split(",").map((code) => code.trim()).filter(Boolean),
  }));

  const deckCodes = new Set(decks.map((deck) => deck.code));
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
    if (deck.parent_code && !deckCodes.has(deck.parent_code)) {
      throw new Error(`Deck ${deck.code} has an unknown parent: ${deck.parent_code}`);
    }
  }
  for (const locale of localesOf(decks, ["title", "description"])) {
    const untitled = decks.find((deck) => deck[`description_${locale}`] && !deck[`title_${locale}`]);
    if (untitled) throw new Error(`Deck ${untitled.code} has a description_${locale} but no title_${locale}`);
  }

  for (const card of cards) {
    for (const column of ["code", "dialect", "swiss_german", "high_german", "meaning_en"]) {
      if (!card[column]) throw new Error(`Card ${card.code} is missing ${column}`);
    }
    if (card.deckCodes.length === 0) throw new Error(`Card ${card.code} has no deck`);
    for (const code of card.deckCodes) {
      if (!deckCodes.has(code)) throw new Error(`Card ${card.code} has an unknown deck: ${code}`);
      if (parentCodes.has(code)) {
        throw new Error(`Card ${card.code} is on ${code}, but only the lowest level holds cards`);
      }
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
      `  (${[deck.code, deck.parent_code, deck.emoji, deck.color].map(quote).join(", ")}, ${nextPosition(`deck:${deck.parent_code}`)})`,
  );
  const cardRows = cards.map(
    (card) =>
      `  (${[card.code, card.dialect, card.swiss_german, card.high_german, card.audio_path].map(quote).join(", ")})`,
  );
  const itemRows = cards.flatMap((card) =>
    card.deckCodes.map(
      (code) => `  (${quote(code)}, ${quote(card.code)}, ${nextPosition(`item:${code}`)})`,
    ),
  );
  const deckTranslationRows = translationRows(decks, ["title", "description"], (deck) => deck.code);
  const cardTranslationRows = translationRows(cards, ["meaning", "notes"], (card) => card.code);

  return `-- Generated by scripts/build-flashcard-seed.mjs from content/. Edit those files instead.
-- Safe to run more than once. Words dropped from content/ stay in the database without a deck,
-- because deleting them would delete learners' review history.
begin;

create temporary table seed_decks (
  code text, parent_code text, emoji text, color text, position integer
) on commit drop;

insert into seed_decks (code, parent_code, emoji, color, position) values
${deckRows.join(",\n")};

insert into public.decks (code, emoji, color, position, published)
select code, emoji, color, position, true from seed_decks
on conflict (code) do update
  set emoji = excluded.emoji,
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

insert into public.vocabulary_items (code, dialect_id, swiss_german, high_german, audio_path) values
${cardRows.join(",\n")}
on conflict (code) do update
  set dialect_id = excluded.dialect_id,
      swiss_german = excluded.swiss_german,
      high_german = excluded.high_german,
      audio_path = excluded.audio_path;

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

delete from public.deck_items;

-- Each word gets its card when it's first inserted, from a trigger.
insert into public.deck_items (deck_id, card_id, position)
select d.id, c.id, i.position
from (values
${itemRows.join(",\n")}
) as i (deck_code, card_code, position)
join public.decks d on d.code = i.deck_code
join public.vocabulary_items v on v.code = i.card_code
join public.cards c on c.vocabulary_id = v.id;

commit;
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = buildSeed(
    readFileSync("content/decks.tsv", "utf8"),
    readFileSync("content/cards.tsv", "utf8"),
  );
  writeFileSync("supabase/seeds/flashcards.sql", seed);
  console.log("Wrote supabase/seeds/flashcards.sql");
}
