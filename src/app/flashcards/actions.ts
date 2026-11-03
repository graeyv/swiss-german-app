"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDeckTree } from "@/app/(tabs)/flashcards/deck-data";
import { goalReached, NEW_CARDS_RANGE } from "@/lib/flashcards/daily-plan";
import {
  type CardRow,
  FSRS_MODEL,
  previewIntervals,
  scheduleReview,
} from "@/lib/flashcards/scheduling";
import type { CardFront, Flashcard } from "@/lib/types";
import { getDailyPlan } from "./daily-plan-data";

type ReviewResult =
  | { error: string }
  | { dueAt: string; reviewId: string; intervals: Flashcard["intervals"] };

// The overview and deck pages show today's counts. Running sessions aren't refreshed: they keep
// their own queue, and reloading them would redo every card's interval previews.
function revalidateFlashcardPages() {
  revalidatePath("/flashcards");
  revalidatePath("/flashcards/decks/[code]", "page");
}

const CARD_COLUMNS =
  "state, schedule_status, stability, difficulty, due_at, last_review_at, reps, lapses, learning_step, scheduled_days";

export async function submitReview(
  reviewId: string,
  vocabularyId: string,
  grade: 1 | 2 | 3 | 4,
): Promise<ReviewResult> {
  if (![1, 2, 3, 4].includes(grade)) return { error: "Unknown grade" };

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("review_items")
    .select(CARD_COLUMNS)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle<CardRow>();
  if (readError) return { error: readError.message };

  const now = new Date();
  const { card, log } = await scheduleReview(row, vocabularyId, grade, now);

  const { error } = await supabase.rpc("save_review", {
    p_review_id: reviewId,
    p_vocabulary_id: vocabularyId,
    p_expected_reps: row?.reps ?? 0,
    p_model: FSRS_MODEL,
    p_card: card,
    p_log: log,
  });
  if (error) return { error: error.message };

  revalidateFlashcardPages();
  return {
    dueAt: card.due_at,
    reviewId: randomUUID(),
    intervals: await previewIntervals(card, vocabularyId, now),
  };
}

export async function updateDailyPlan(newCardsPerDay: number): Promise<{ error?: string }> {
  if (
    !Number.isInteger(newCardsPerDay) ||
    newCardsPerDay < NEW_CARDS_RANGE.min ||
    newCardsPerDay > NEW_CARDS_RANGE.max
  ) {
    return { error: "Invalid number of new cards" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // An update that matches no row isn't an error, so check that the profile was found.
  const { data, error } = await supabase
    .from("profiles")
    .update({ new_cards_per_day: newCardsPerDay })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };

  revalidateFlashcardPages();
  return {};
}

export async function updateCardFront(cardFront: CardFront): Promise<{ error?: string }> {
  if (cardFront !== "swiss_german" && cardFront !== "english") {
    return { error: "Unknown card side" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // An update that matches no row isn't an error, so check that the profile was found.
  const { data, error } = await supabase
    .from("profiles")
    .update({ card_front: cardFront })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };
  return {};
}

// Asked when a session ends, to celebrate if that session completed today's goal.
export async function isTodaysGoalReached(): Promise<boolean> {
  const supabase = await createClient();
  const [tree, { newCardsPerDay, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);
  return goalReached(newCardsPerDay, summary, tree.some((deck) => deck.new_count > 0));
}
