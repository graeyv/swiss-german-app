// Loading flashcard data on the server, shared by the flashcards pages and actions.
//
// The generated database types mark every column a database function returns as never empty,
// which isn't true (a deck's emoji can be null, for example). Results are therefore read into
// the row types in this folder, which say which columns can be empty.
import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { CardFront, Flashcard, GrammarCard, WordCard } from "@/lib/types";
import {
  DEFAULT_NEW_CARDS,
  type FlashcardSummary,
  goalReached,
  todaysQueue,
} from "./daily-plan";
import { buildDeckTree, DECK_COLORS, type DeckColor, type DeckRow, sortByInterests } from "./decks";
import { type ExerciseRow, grammarExercise, pickExercise } from "./grammar";
import { type CardRow, previewIntervals } from "./scheduling";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getDeckTree(supabase: Supabase) {
  const { data, error } = await supabase.rpc("flashcard_decks");
  if (error) throw new Error(error.message);
  const rows: DeckRow[] = data.map((row) => ({
    ...row,
    kind: row.kind === "grammar" ? "grammar" : "vocabulary",
    color: DECK_COLORS.includes(row.color as DeckColor) ? (row.color as DeckColor) : null,
  }));
  return buildDeckTree(rows);
}

async function getDailyPlan(supabase: Supabase) {
  const [profile, summary] = await Promise.all([
    supabase.from("profiles").select("new_cards_per_day, interests").maybeSingle(),
    supabase.rpc("flashcard_summary").single(),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const flashcardSummary: FlashcardSummary = summary.data;
  return {
    newCardsPerDay: profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS,
    interests: profile.data?.interests ?? [],
    summary: flashcardSummary,
  };
}

// Everything the flashcards screens need about today: the decks with their counts (the
// learner's chosen topics first), the daily goal, what's left of it, and whether it's reached.
export async function getToday(supabase: Supabase) {
  const [tree, { newCardsPerDay, interests, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);
  return {
    tree: sortByInterests(tree, interests),
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
  card_id: string;
  swiss_german: string;
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

export type GrammarContent = { title: string; exercises: ExerciseRow[] };

// Each grammar card's rule and the exercises the learner can be shown, by card.
export async function getGrammarContent(supabase: Supabase, cardIds: string[]) {
  const content = new Map<string, GrammarContent>();
  if (cardIds.length === 0) return content;
  const { data, error } = await supabase.rpc("grammar_content", { p_card_ids: cardIds });
  if (error) throw new Error(error.message);
  for (const row of data) {
    content.set(row.card_id, {
      title: row.title,
      exercises: row.exercises as unknown as ExerciseRow[],
    });
  }
  return content;
}

// A grammar rule ready for a session, showing an exercise it's ready for. card is null for a
// new rule, and lastExerciseId the exercise it showed last time.
export function toGrammarCard(
  cardId: string,
  content: GrammarContent,
  card: CardRow | null,
  lastExerciseId: string | null,
  locale: Locale,
): GrammarCard {
  const exercises = content.exercises.map((row) => grammarExercise(row, locale));
  return {
    kind: "grammar",
    card_id: cardId,
    title: content.title,
    exercises,
    exercise: pickExercise(exercises, card, lastExerciseId),
    status: statusOf(card),
    review_id: randomUUID(),
  };
}
