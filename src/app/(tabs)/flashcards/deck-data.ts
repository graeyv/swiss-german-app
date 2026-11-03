import { buildDeckTree, type DeckRow } from "@/lib/flashcards/decks";
import type { createClient } from "@/lib/supabase/server";

export async function getDeckTree(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.rpc("flashcard_decks");
  if (error) throw new Error(error.message);
  return buildDeckTree(data as DeckRow[]);
}
