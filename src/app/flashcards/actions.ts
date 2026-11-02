"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type CardRow,
  FSRS_MODEL,
  previewIntervals,
  scheduleReview,
} from "@/lib/flashcards/scheduling";
import type { Flashcard } from "@/lib/types";

type ReviewResult =
  | { error: string }
  | { dueAt: string; reviewId: string; intervals: Flashcard["intervals"] };

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

  revalidatePath("/flashcards");
  return {
    dueAt: card.due_at,
    reviewId: randomUUID(),
    intervals: await previewIntervals(card, vocabularyId, now),
  };
}
