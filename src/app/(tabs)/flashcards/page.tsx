import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buildDeckTree, type DeckNode, type DeckRow } from "@/lib/flashcards/decks";
import { NEW_CARDS_PER_DAY } from "@/lib/flashcards/scheduling";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Flashcards – Grüezi" };

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your decks…</p>}>
      <Decks />
    </Suspense>
  );
}

async function Decks() {
  const supabase = await createClient();

  const [decks, summary] = await Promise.all([
    supabase.rpc("flashcard_decks"),
    supabase.rpc("flashcard_summary").single<{ due_count: number; introduced_today: number }>(),
  ]);

  if (decks.error) throw new Error(decks.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const tree = buildDeckTree(decks.data as DeckRow[]);
  const { due_count: dueCount, introduced_today: introducedToday } = summary.data;
  const newLeft = Math.max(0, NEW_CARDS_PER_DAY - introducedToday);

  if (tree.length === 0) {
    return (
      <p className="text-muted">
        No decks yet. Add the flashcards with <code>npm run db:content</code>.
      </p>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dueCount === 0 ? "Nothing to review" : `${dueCount} to review`}
          </h1>
          <p className="mt-1 text-muted">{newLeft} new cards left today</p>
        </div>
        {dueCount > 0 && (
          <Link
            href="/flashcards/review"
            className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Start review
          </Link>
        )}
      </section>

      <section className="flex flex-col gap-3">
        {tree.map((deck) => (
          <Deck key={deck.id} deck={deck} newLeft={newLeft} />
        ))}
      </section>
    </>
  );
}

function Deck({ deck, newLeft }: { deck: DeckNode; newLeft: number }) {
  const details = (
    <>
      <span className="flex-1">
        <span className="block font-semibold">{deck.title}</span>
        <span className="block text-sm text-muted">
          {deck.due_count} due · {deck.new_count} new · {deck.card_count} total
        </span>
      </span>
      {deck.new_count > 0 && newLeft > 0 && (
        <Link
          href={`/flashcards/learn/${deck.code}`}
          className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >
          Learn new
        </Link>
      )}
    </>
  );

  if (deck.children.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
        {details}
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer items-center gap-4 p-4">
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
        {details}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {deck.children.map((child) => (
          <Deck key={child.id} deck={child} newLeft={newLeft} />
        ))}
      </div>
    </details>
  );
}
