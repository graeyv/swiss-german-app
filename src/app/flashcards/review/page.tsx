import type { Metadata } from "next";
import { Suspense } from "react";
import type { CardRow } from "@/lib/flashcards/scheduling";
import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "../review-session";
import { toFlashcard } from "../to-flashcard";

export const metadata: Metadata = { title: "Review – Grüezi" };

const SESSION_SIZE = 100;

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Loading your cards…</p>}>
      <DueCards />
    </Suspense>
  );
}

async function DueCards() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("due_flashcards", { p_limit: SESSION_SIZE });
  if (error) throw new Error(error.message);

  const now = new Date();
  const cards = await Promise.all(
    (data as (Parameters<typeof toFlashcard>[1] & CardRow)[]).map((row) =>
      toFlashcard(supabase, row, row, now),
    ),
  );

  return <ReviewSession cards={cards} emptyMessage="You're all caught up. Nothing is due." />;
}
