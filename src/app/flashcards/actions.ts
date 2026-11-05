"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToday } from "@/lib/flashcards/data";
import { NEW_CARDS_RANGE } from "@/lib/flashcards/daily-plan";
import { gradeFromAnswer } from "@/lib/flashcards/grammar";
import { FSRS_MODEL, previewIntervals, scheduleReview } from "@/lib/flashcards/scheduling";
import { getDictionary } from "@/lib/i18n/server";
import type { CardFront, WordCard } from "@/lib/types";

// A word is rated by the learner. A grammar card is answered, and the answer decides the grade.
export type ReviewAnswer = { grade: 1 | 2 | 3 | 4 } | { exerciseId: string; correct: boolean };

export type SavedReview = {
  dueAt: string;
  // For the card's next attempt, if it comes back in this session.
  reviewId: string;
  // Where the card now is in its schedule, which the next exercise depends on.
  state: number;
  scheduledDays: number;
  // Interval previews for rating a word again. Null for grammar cards, which aren't rated.
  intervals: WordCard["intervals"] | null;
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

export async function submitReview(
  reviewId: string,
  cardId: string,
  answer: ReviewAnswer,
): Promise<SavedReview | { error: string }> {
  const rated = "grade" in answer;
  if (rated ? ![1, 2, 3, 4].includes(answer.grade) : typeof answer.correct !== "boolean") {
    return { error: "Unknown answer" };
  }
  const grade = rated ? answer.grade : gradeFromAnswer(answer.correct);

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("review_items")
    .select(CARD_COLUMNS)
    .eq("card_id", cardId)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const now = new Date();
  const { card, log } = await scheduleReview(row, cardId, grade, now);

  // The database checks that the exercise is one of the card's.
  const { error } = await supabase.rpc("save_review", {
    p_review_id: reviewId,
    p_card_id: cardId,
    p_expected_reps: row?.reps ?? 0,
    p_model: FSRS_MODEL,
    p_card: card,
    p_log: log,
    ...(rated ? {} : { p_exercise_id: answer.exerciseId, p_correct: answer.correct }),
  });
  if (error) return { error: error.message };

  revalidateFlashcardPages();
  return {
    dueAt: card.due_at,
    reviewId: randomUUID(),
    state: card.state,
    scheduledDays: card.scheduled_days,
    intervals: rated
      ? await previewIntervals(card, cardId, now, (await getDictionary()).intervals)
      : null,
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
export async function isTodaysGoalReached(): Promise<boolean> {
  const supabase = await createClient();
  return (await getToday(supabase)).goalReached;
}
