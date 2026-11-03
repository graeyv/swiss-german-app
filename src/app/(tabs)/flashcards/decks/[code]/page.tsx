import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDailyPlan } from "@/app/flashcards/daily-plan-data";
import { todaysQueue } from "@/lib/flashcards/daily-plan";
import { findDeck } from "@/lib/flashcards/decks";
import { createClient } from "@/lib/supabase/server";
import { DeckGrid } from "../../deck-card";
import { getDeckTree } from "../../deck-data";

export default function DeckPage({ params }: PageProps<"/flashcards/decks/[code]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Deck params={params} />
    </Suspense>
  );
}

async function Deck({ params }: Pick<PageProps<"/flashcards/decks/[code]">, "params">) {
  const { code } = await params;
  const supabase = await createClient();
  const [tree, { newCardsPerDay, summary }] = await Promise.all([
    getDeckTree(supabase),
    getDailyPlan(supabase),
  ]);

  const found = findDeck(tree, code);
  if (!found) notFound();
  const { deck, ancestors } = found;
  const parent = ancestors.at(-1);
  const { newLeft } = todaysQueue(newCardsPerDay, summary);

  return (
    <>
      <title>{`${deck.title} – Grüezi`}</title>

      <div className="flex flex-col gap-4">
        <Link
          href={parent ? `/flashcards/decks/${parent.code}` : "/flashcards"}
          className="-ml-1 flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-foreground"
        >
          ‹ {parent?.title ?? "Flashcards"}
        </Link>

        <div className="flex items-center gap-4">
          <span aria-hidden className="text-5xl">
            {deck.emoji ?? "📚"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deck.title}</h1>
            <p className="text-sm text-muted">
              {deck.card_count} {deck.card_count === 1 ? "word" : "words"} · {deck.new_count} new ·{" "}
              {deck.due_count} due
            </p>
          </div>
        </div>

        {deck.new_count > 0 &&
          (newLeft > 0 ? (
            <Link
              href={`/flashcards/learn/${deck.code}`}
              className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Learn new words
            </Link>
          ) : (
            <p className="text-sm text-muted">
              You&rsquo;ve reached today&rsquo;s goal for new words. Come back tomorrow for more.
            </p>
          ))}
      </div>

      {deck.children.length > 0 && <DeckGrid decks={deck.children} />}
    </>
  );
}
