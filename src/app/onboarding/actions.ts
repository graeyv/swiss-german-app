"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import { isLevel, type Level } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

type Answers = {
  // Null when the learner skipped the question.
  level: Level | null;
  interests: string[];
  newCardsPerDay: number;
};

export async function finishOnboarding(answers: Answers): Promise<{ error: string }> {
  if (answers.level !== null && !isLevel(answers.level)) return { error: "Unknown level" };
  if (!PRESETS.some((preset) => preset.newCardsPerDay === answers.newCardsPerDay)) {
    return { error: "Unknown pace" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // Only topics that exist count, so a stale or tampered list can't pile up.
  const { data: topics, error: topicsError } = await supabase
    .from("decks")
    .select("code")
    .is("parent_id", null)
    .in("code", answers.interests);
  if (topicsError) return { error: topicsError.message };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      swiss_german_level: answers.level,
      interests: topics.map((topic) => topic.code),
      new_cards_per_day: answers.newCardsPerDay,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };

  revalidatePath("/", "layout");
  redirect("/flashcards");
}
