"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import { isReadyDialect } from "@/lib/dialects";
import { createClient } from "@/lib/supabase/server";

type Answers = {
  // The dialect to learn, or null if none was chosen.
  dialect: string | null;
  newCardsPerDay: number;
};

export async function finishOnboarding(answers: Answers): Promise<{ error: string }> {
  if (answers.dialect !== null && !isReadyDialect(answers.dialect)) return { error: "Unknown dialect" };
  if (!PRESETS.some((preset) => preset.newCardsPerDay === answers.newCardsPerDay)) {
    return { error: "Unknown pace" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      // Left as it was when skipped without a dialect to choose.
      ...(answers.dialect ? { dialect_id: answers.dialect } : {}),
      new_cards_per_day: answers.newCardsPerDay,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };

  revalidatePath("/", "layout");
  // To Lernen, whose suggestion card ("Hier beginnen") is the one clear first step.
  redirect("/learn");
}
