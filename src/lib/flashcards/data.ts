// Loading flashcard data on the server, shared by the flashcards pages and actions.
//
// The generated database types mark every column a database function returns as never empty,
// which isn't true (a deck's emoji can be null, for example). Results are therefore read into
// the row types in this folder, which say which columns can be empty.
import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import type { Dictionary } from "@/lib/i18n";
import type { CardFront, Flashcard } from "@/lib/types";
import {
  DEFAULT_NEW_CARDS,
  type FlashcardSummary,
  goalReached,
  todaysQueue,
} from "./daily-plan";
import { buildDeckTree, DECK_COLORS, type DeckColor, type DeckRow } from "./decks";
import { type CardRow, previewIntervals } from "./scheduling";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getDeckTree(supabase: Supabase) {
  const { data, error } = await supabase.rpc("flashcard_decks");
  if (error) throw new Error(error.message);
  const rows: DeckRow[] = data.map((row) => ({
    ...row,
    color: DECK_COLORS.includes(row.color as DeckColor) ? (row.color as DeckColor) : null,
  }));
  return buildDeckTree(rows);
}

async function getDailyPlan(supabase: Supabase) {
  const [profile, summary] = await Promise.all([
    supabase.from("profiles").select("new_cards_per_day").maybeSingle(),
    supabase.rpc("flashcard_summary").single(),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const flashcardSummary: FlashcardSummary = summary.data;
  return {
    newCardsPerDay: profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS,
    summary: flashcardSummary,
  };
}

// Everything the flashcards screens need about today: the decks with their counts, the daily
// goal, what's left of it, and whether it's reached.
export async function getToday(supabase: Supabase) {
  const [tree, { newCardsPerDay, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);
  return {
    tree,
    newCardsPerDay,
    summary,
    limits: todaysQueue(newCardsPerDay, summary),
    goalReached: goalReached(newCardsPerDay, summary, tree.some((deck) => deck.new_count > 0)),
  };
}

export async function getCardFront(supabase: Supabase): Promise<CardFront> {
  const { data, error } = await supabase.from("profiles").select("card_front").maybeSingle();
  if (error) throw new Error(error.message);
  return data?.card_front === "translation" ? "translation" : "swiss_german";
}

type WordRow = {
  vocabulary_id: string;
  swiss_german: string;
  high_german: string;
  meaning: string;
  notes: string | null;
  audio_path: string | null;
};

// A word ready for a session, with its interval previews in the interface language. card is
// null for a new word.
export async function toFlashcard(
  supabase: Supabase,
  word: WordRow,
  card: CardRow | null,
  now: Date,
  t: Dictionary,
): Promise<Flashcard> {
  return {
    vocabulary_id: word.vocabulary_id,
    swiss_german: word.swiss_german,
    high_german: word.high_german,
    meaning: word.meaning,
    notes: word.notes,
    audio_url: word.audio_path
      ? supabase.storage.from("lesson-audio").getPublicUrl(word.audio_path).data.publicUrl
      : null,
    kind: !card || card.state === 0 ? "new" : card.state === 2 ? "review" : "learning",
    review_id: randomUUID(),
    intervals: await previewIntervals(card, word.vocabulary_id, now, t.intervals),
  };
}
