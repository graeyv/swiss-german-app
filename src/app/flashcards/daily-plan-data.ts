import { DEFAULT_NEW_CARDS, type FlashcardSummary } from "@/lib/flashcards/daily-plan";
import type { createClient } from "@/lib/supabase/server";
import type { CardFront } from "@/lib/types";

export async function getCardFront(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<CardFront> {
  const { data, error } = await supabase
    .from("profiles")
    .select("card_front")
    .maybeSingle<{ card_front: CardFront }>();
  if (error) throw new Error(error.message);
  return data?.card_front ?? "swiss_german";
}

export async function getDailyPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ newCardsPerDay: number; summary: FlashcardSummary }> {
  const [profile, summary] = await Promise.all([
    supabase
      .from("profiles")
      .select("new_cards_per_day")
      .maybeSingle<{ new_cards_per_day: number }>(),
    supabase.rpc("flashcard_summary").single<FlashcardSummary>(),
  ]);

  if (profile.error) throw new Error(profile.error.message);
  if (summary.error) throw new Error(summary.error.message);

  return {
    newCardsPerDay: profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS,
    summary: summary.data,
  };
}
