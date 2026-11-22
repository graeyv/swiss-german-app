// Loading flashcard data on the server, shared by the flashcards pages and actions.
//
// The generated database types mark every column a database function returns as never empty,
// which isn't true (a deck's emoji can be null, for example). Results are therefore read into
// the row types in this folder, which say which columns can be empty.
import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import type { Dictionary } from "@/lib/i18n";
import type { CardFront, Flashcard, WordCard } from "@/lib/types";
import { DEFAULT_NEW_CARDS, type FlashcardSummary, goalReached, todaysQueue, zurichDay } from "./daily-plan";
import { buildDeckTree, DECK_COLORS, type DeckColor, type DeckRow, sortByInterests } from "./decks";
import { type CardRow, previewIntervals } from "./scheduling";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getDeckTree(supabase: Supabase) {
  const { data, error } = await supabase.rpc("flashcard_decks");
  if (error) throw new Error(error.message);
  const rows: DeckRow[] = data.map((row) => ({
    ...row,
    kind: "vocabulary",
    color: DECK_COLORS.includes(row.color as DeckColor) ? (row.color as DeckColor) : null,
  }));
  return buildDeckTree(rows);
}

async function getDailyPlan(supabase: Supabase) {
  const [profile, summary] = await Promise.all([
    supabase.from("profiles").select("new_cards_per_day, interests, limit_lifted_on").maybeSingle(),
    supabase.rpc("flashcard_summary").single(),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const flashcardSummary: FlashcardSummary = summary.data;
  return {
    newCardsPerDay: profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS,
    interests: profile.data?.interests ?? [],
    // Whether the learner lifted today's limit of new cards.
    lifted: profile.data?.limit_lifted_on === zurichDay(new Date()),
    summary: flashcardSummary,
  };
}

// Everything the flashcards screens need about today: the decks with their counts (the
// learner's chosen topics first), the daily goal, what's left of it, and whether it's reached.
export async function getToday(supabase: Supabase) {
  const [tree, { newCardsPerDay, interests, lifted, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);
  return {
    tree: sortByInterests(tree, interests),
    newCardsPerDay,
    summary,
    lifted,
    limits: todaysQueue(newCardsPerDay, summary, lifted),
    // More new cards than today's limit allows, so lifting it would give the learner more.
    canLift: !lifted && tree.some((deck) => deck.new_count > 0),
    goalReached: goalReached(newCardsPerDay, summary, tree.some((deck) => deck.new_count > 0)),
  };
}

// How the learner wants their cards: which side first, and whether a word's recording plays by
// itself when its Swiss German shows.
export async function getCardSettings(
  supabase: Supabase,
): Promise<{ cardFront: CardFront; autoplay: boolean; ratingTipSeen: boolean }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("card_front, autoplay_audio, rating_tip_seen")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    cardFront: data?.card_front === "translation" ? "translation" : "swiss_german",
    autoplay: data?.autoplay_audio ?? true,
    ratingTipSeen: data?.rating_tip_seen ?? false,
  };
}

type WordRow = {
  card_id: string;
  swiss_german: string;
  variants: string[] | null;
  high_german: string;
  meaning: string;
  notes: string | null;
  audio_path: string | null;
};

function statusOf(card: CardRow | null): Flashcard["status"] {
  return !card || card.state === 0 ? "new" : card.state === 2 ? "review" : "learning";
}

// A word ready for a session, with its interval previews in the interface language. card is
// null for a new word.
export async function toWordCard(
  supabase: Supabase,
  word: WordRow,
  card: CardRow | null,
  now: Date,
  t: Dictionary,
): Promise<WordCard> {
  return {
    kind: "vocabulary",
    card_id: word.card_id,
    swiss_german: word.swiss_german,
    variants: word.variants ?? [],
    high_german: word.high_german,
    meaning: word.meaning,
    notes: word.notes,
    audio_url: word.audio_path
      ? supabase.storage.from("lesson-audio").getPublicUrl(word.audio_path).data.publicUrl
      : null,
    status: statusOf(card),
    review_id: randomUUID(),
    intervals: await previewIntervals(card, word.card_id, now, t.intervals),
  };
}
