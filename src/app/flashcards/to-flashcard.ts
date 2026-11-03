import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import { type CardRow, previewIntervals } from "@/lib/flashcards/scheduling";
import type { Flashcard } from "@/lib/types";

type WordRow = {
  vocabulary_id: string;
  swiss_german: string;
  high_german: string;
  english: string;
  notes: string | null;
  audio_path: string | null;
};

export async function toFlashcard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  word: WordRow,
  card: CardRow | null,
  now: Date,
): Promise<Flashcard> {
  return {
    vocabulary_id: word.vocabulary_id,
    swiss_german: word.swiss_german,
    high_german: word.high_german,
    english: word.english,
    notes: word.notes,
    audio_url: word.audio_path
      ? supabase.storage.from("lesson-audio").getPublicUrl(word.audio_path).data.publicUrl
      : null,
    kind: !card || card.state === 0 ? "new" : card.state === 2 ? "review" : "learning",
    review_id: randomUUID(),
    intervals: await previewIntervals(card, word.vocabulary_id, now),
  };
}
