import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { findDeck } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { createClient } from "@/lib/supabase/server";
import { TINTS } from "../../../deck-card";

export default function WordListPage({ params }: PageProps<"/flashcards/decks/[code]/words">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the words…</p>}>
      <WordList params={params} />
    </Suspense>
  );
}

async function WordList({ params }: Pick<PageProps<"/flashcards/decks/[code]/words">, "params">) {
  const { code } = await params;
  const supabase = await createClient();
  const [{ tree, limits }, words] = await Promise.all([
    getToday(supabase),
    supabase.rpc("deck_words", { p_deck_code: code }),
  ]);
  if (words.error) throw new Error(words.error.message);

  const found = findDeck(tree, code);
  if (!found) notFound();
  const { deck, ancestors } = found;
  const parent = ancestors.at(-1);
  const { newWords, due } = deckAvailability(deck, limits);

  return (
    <>
      <title>{`${deck.title} words – Grüezi`}</title>

      <div className="flex flex-col gap-4">
        <Link
          href={parent ? `/flashcards/decks/${parent.code}` : "/flashcards"}
          className="-ml-1 flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-foreground"
        >
          ‹ {parent?.title ?? "Flashcards"}
        </Link>

        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${TINTS[deck.color]}`}
          >
            {deck.emoji ?? "📚"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deck.title}</h1>
            <p className="text-sm text-muted">
              {deck.card_count} {deck.card_count === 1 ? "word" : "words"}
            </p>
          </div>
        </div>
      </div>

      {/* Both sides of each card next to each other. A table keeps every row in the same columns.
          Bold Swiss German beside English explains itself, so the headers are for screen readers. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="sr-only">
            <tr>
              <th scope="col">Swiss German</th>
              <th scope="col">English</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {words.data.map((word) => (
              <tr key={word.vocabulary_id} className="align-top">
                <td lang="gsw" className="px-4 py-3 font-semibold break-words">
                  {word.swiss_german}
                </td>
                <td className="px-4 py-3 break-words">
                  {word.english}
                  <span lang="de" className="block text-xs text-muted">
                    {word.high_german}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Same rules as the subcategory sheet: within today's goal, or nothing to start. */}
      {newWords + due > 0 ? (
        <Link
          href={`/flashcards/session/${deck.code}`}
          className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Start flashcards
        </Link>
      ) : (
        <p className="w-full rounded-full bg-line px-6 py-3 text-center font-semibold text-muted">
          Nothing left for today
        </p>
      )}
    </>
  );
}
