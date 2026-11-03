import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDailyPlan } from "@/app/flashcards/daily-plan-data";
import { todaysQueue } from "@/lib/flashcards/daily-plan";
import { type DeckNode, findDeck, subcategoryHref } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { createClient } from "@/lib/supabase/server";
import { TINTS } from "../../deck-card";
import { getDeckTree } from "../../deck-data";

type Availability = ReturnType<typeof deckAvailability>;

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
  const limits = todaysQueue(newCardsPerDay, summary);

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
          <span
            aria-hidden
            className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${TINTS[deck.color]}`}
          >
            {deck.emoji ?? "📚"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deck.title}</h1>
            {deck.description && <p className="text-sm text-muted">{deck.description}</p>}
          </div>
        </div>
      </div>

      <ShuffleButton deck={deck} availability={deckAvailability(deck, limits)} />

      {deck.children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Subcategories</h2>
          <ul className="flex flex-col gap-2">
            {deck.children.map((child) => (
              <li key={child.id}>
                <Subcategory deck={child} availability={deckAvailability(child, limits)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function ShuffleButton({ deck, availability }: { deck: DeckNode; availability: Availability }) {
  const { newWords, due } = availability;

  if (newWords + due === 0) {
    return (
      <p className="rounded-2xl border border-line p-5 text-center text-muted">
        All done in {deck.title} for today. Come back tomorrow.
      </p>
    );
  }

  return (
    <Link
      href={`/flashcards/session/${deck.code}?shuffle=1`}
      className="flex items-center gap-4 rounded-2xl bg-accent p-5 text-accent-foreground transition-transform active:scale-[0.98]"
    >
      <span aria-hidden className="text-3xl">
        🔀
      </span>
      <span className="flex flex-1 flex-col">
        <strong className="text-lg">Shuffle learning in this category</strong>
        <span className="text-sm opacity-90">
          {newWords} new · {due} due
        </span>
      </span>
      <span aria-hidden className="text-2xl">
        ›
      </span>
    </Link>
  );
}

function Subcategory({ deck, availability }: { deck: DeckNode; availability: Availability }) {
  const { newWords, due } = availability;
  const done = newWords + due === 0;
  // A subcategory with its own subcategories stays browsable even when today's work is done.
  const browsable = deck.children.length > 0;

  const content = (
    <>
      <span
        aria-hidden
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl ${TINTS[deck.color]}`}
      >
        {deck.emoji ?? "📚"}
      </span>
      <span className="min-w-0 flex-1 font-semibold leading-snug">{deck.title}</span>
      {done ? (
        <span className="flex shrink-0 gap-1.5 text-sm text-muted">
          Done for today
          {browsable && <span aria-hidden>›</span>}
        </span>
      ) : (
        <span className="flex shrink-0 gap-1.5 text-xs font-semibold">
          {newWords > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">{newWords} new</span>
          )}
          {due > 0 && <span className="rounded-full bg-line px-2 py-1">{due} due</span>}
          <span aria-hidden className="self-center text-base text-muted">
            ›
          </span>
        </span>
      )}
    </>
  );

  const row = "flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-3";
  if (done && !browsable) return <div className={`${row} opacity-60`}>{content}</div>;

  return (
    <Link
      href={subcategoryHref(deck)}
      className={`${row} transition-colors hover:border-accent active:scale-[0.99]`}
    >
      {content}
    </Link>
  );
}
