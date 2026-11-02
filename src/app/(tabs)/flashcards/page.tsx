import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDailyPlan } from "@/app/flashcards/daily-plan-data";
import { todaysQueue } from "@/lib/flashcards/daily-plan";
import { buildDeckTree, type DeckNode, type DeckRow } from "@/lib/flashcards/decks";
import { createClient } from "@/lib/supabase/server";
import { DailyPlanForm } from "./daily-plan-form";

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

  const [decks, { newCardsPerDay, summary }] = await Promise.all([
    supabase.rpc("flashcard_decks"),
    getDailyPlan(supabase),
  ]);

  if (decks.error) throw new Error(decks.error.message);

  const tree = buildDeckTree(decks.data as DeckRow[]);
  const { dueNow, waiting, newLeft } = todaysQueue(newCardsPerDay, summary);

  if (tree.length === 0) {
    return (
      <p className="text-muted">
        No decks yet. Add the flashcards with <code>npm run db:content</code>.
      </p>
    );
  }

  return (
    <>
      <h1 className="sr-only">Flashcards</h1>

      <section className="flex flex-col gap-3">
        {dueNow > 0 && (
          <Link
            href="/flashcards/review"
            className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Review {dueNow} {dueNow === 1 ? "card" : "cards"}
          </Link>
        )}
        {dueNow === 0 && waiting > 0 && (
          <p className="text-muted">
            Daily review goal reached.{" "}
            <Link
              href="/flashcards/review?all=1"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              Keep going ({waiting} more)
            </Link>
          </p>
        )}
        <DailyPlanForm newCardsPerDay={newCardsPerDay} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Decks</h2>
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
