import type { Metadata } from "next";
import { Suspense } from "react";
import { NEW_CARDS_PER_DAY } from "@/lib/flashcards/scheduling";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "../../review-session";
import { toFlashcard } from "../../to-flashcard";

export const metadata: Metadata = { title: "New cards – Grüezi" };

export default function LearnNewPage({ params }: PageProps<"/flashcards/learn/[code]">) {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Loading your cards…</p>}>
      <NewCards params={params} />
    </Suspense>
  );
}

async function NewCards({ params }: Pick<PageProps<"/flashcards/learn/[code]">, "params">) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: summary, error: summaryError } = await supabase
    .rpc("flashcard_summary")
    .single<{ introduced_today: number }>();
  if (summaryError) throw new Error(summaryError.message);

  const { data, error } = await supabase.rpc("new_flashcards", {
    p_deck_code: code,
    p_limit: Math.max(0, NEW_CARDS_PER_DAY - summary.introduced_today),
  });
  if (error) throw new Error(error.message);

  const now = new Date();
  const cards = await Promise.all(
    (data as Parameters<typeof toFlashcard>[1][]).map((word) =>
      toFlashcard(supabase, word, null, now),
    ),
  );

  return (
    <ReviewSession
      cards={cards}
      emptyMessage="No new cards here for today. Come back tomorrow for more."
    />
  );
}
