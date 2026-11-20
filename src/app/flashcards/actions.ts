"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToday } from "@/lib/flashcards/data";
import { NEW_CARDS_RANGE, weekOf, zurichDay } from "@/lib/flashcards/daily-plan";
import { FSRS_MODEL, previewIntervals, scheduleReview } from "@/lib/flashcards/scheduling";
import { getDictionary } from "@/lib/i18n/server";
import type { CardFront, WordCard } from "@/lib/types";
import type { Grade } from "./grade-buttons";

export type SavedReview = {
  dueAt: string;
  // For the card's next attempt, if it comes back in this session.
  reviewId: string;
  // Interval previews for rating the word again.
  intervals: WordCard["intervals"];
};

// The overview and deck pages show today's counts, and the profile the learner's progress and
// pace. Running sessions aren't refreshed: they keep their own queue, and reloading them would
// redo every card's interval previews.
function revalidateFlashcardPages() {
  revalidatePath("/flashcards");
  revalidatePath("/flashcards/decks/[code]", "page");
  revalidatePath("/profile");
}

const CARD_COLUMNS =
  "state, schedule_status, stability, difficulty, due_at, last_review_at, reps, lapses, learning_step, scheduled_days";

// A word's rating, from 1 (Again) to 4 (Easy), saved with its next due date.
export async function submitReview(
  reviewId: string,
  cardId: string,
  grade: Grade,
): Promise<SavedReview | { error: string }> {
  if (![1, 2, 3, 4].includes(grade)) return { error: "Unknown answer" };

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("review_items")
    .select(CARD_COLUMNS)
    .eq("card_id", cardId)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const now = new Date();
  const { card, log } = await scheduleReview(row, cardId, grade, now);

  const { error } = await supabase.rpc("save_review", {
    p_review_id: reviewId,
    p_card_id: cardId,
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
    intervals: await previewIntervals(card, cardId, now, (await getDictionary()).intervals),
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

// Lifts today's limit of new cards, until midnight on Zürich time. The next day it applies again.
export async function liftDailyLimit(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // An update that matches no row isn't an error, so check that the profile was found.
  const { data, error } = await supabase
    .from("profiles")
    .update({ limit_lifted_on: zurichDay(new Date()) })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };

  revalidateFlashcardPages();
  revalidatePath("/flashcards/session/[code]", "page");
  return {};
}

// Whether a word's recording plays by itself as soon as its Swiss German shows.
export async function updateAutoplay(autoplay: boolean): Promise<{ error?: string }> {
  if (typeof autoplay !== "boolean") return { error: "Unknown setting" };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // An update that matches no row isn't an error, so check that the profile was found.
  const { data, error } = await supabase
    .from("profiles")
    .update({ autoplay_audio: autoplay })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };
  revalidatePath("/profile");
  return {};
}

export async function updateCardFront(cardFront: CardFront): Promise<{ error?: string }> {
  if (cardFront !== "swiss_german" && cardFront !== "translation") {
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
  revalidatePath("/profile");
  return {};
}

// Asked when a session ends, to celebrate if that session completed today's goal.
// Whether today's goal is reached, for the end of a session, with what celebrates it: the streak,
// and this week's days with practice.
export type TodaysGoal = { reached: boolean; streak: number; week: ReturnType<typeof weekOf> };

export async function getTodaysGoal(): Promise<TodaysGoal> {
  const supabase = await createClient();
  const now = new Date();
  // A week back is enough for this week's days.
  const since = new Date(now.getTime() - 8 * 86_400_000).toISOString();
  const [today, stats, reviews] = await Promise.all([
    getToday(supabase),
    supabase.rpc("profile_stats").single(),
    supabase.from("review_log").select("reviewed_at").gte("reviewed_at", since),
  ]);
  if (stats.error) throw new Error(stats.error.message);
  if (reviews.error) throw new Error(reviews.error.message);

  const practised = new Set(reviews.data.map(({ reviewed_at }) => zurichDay(new Date(reviewed_at))));
  return { reached: today.goalReached, streak: stats.data.streak, week: weekOf(zurichDay(now), practised) };
}
