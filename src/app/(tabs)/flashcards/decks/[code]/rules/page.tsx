import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { findDeck, overviewHref } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { TINTS } from "../../../deck-card";

export default function RuleListPage({ params }: PageProps<"/flashcards/decks/[code]/rules">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <RuleList params={params} />
    </Suspense>
  );
}

// The grammar rules of a deck with their explanations, the grammar counterpart of the word list.
async function RuleList({ params }: Pick<PageProps<"/flashcards/decks/[code]/rules">, "params">) {
  const { code } = await params;
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);
  const [{ tree, limits }, rules] = await Promise.all([
    getToday(supabase),
    supabase.rpc("deck_grammar_points", { p_deck_code: code }),
  ]);
  if (rules.error) throw new Error(rules.error.message);

  const found = findDeck(tree, code);
  if (!found || found.deck.kind !== "grammar") notFound();
  const { deck, ancestors } = found;
  const parent = ancestors.at(-1);
  const { newWords, due } = deckAvailability(deck, limits);

  return (
    <>
      <title>{t.title(t.flashcards.ruleListTitle(deck.title))}</title>

      <div className="flex flex-col gap-4">
        <Link
          href={parent ? `/flashcards/decks/${parent.code}` : overviewHref("grammar")}
          className="-ml-1 flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-foreground"
        >
          ‹ {parent?.title ?? t.flashcards.title}
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
            <p className="text-sm text-muted">{t.flashcards.rules(deck.card_count)}</p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {rules.data.map((rule) => (
          <li key={rule.card_id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold leading-snug">{rule.title}</h2>
              {/* state is null for rules the learner hasn't met. */}
              {rule.state === null && (
                <span className="shrink-0 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                  {t.flashcards.newRule}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted">{rule.explanation}</p>
          </li>
        ))}
      </ul>

      {/* Same rules as the subcategory sheet: within today's goal, or nothing to start. */}
      {newWords + due > 0 ? (
        <Link
          href={`/flashcards/session/${deck.code}`}
          className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t.flashcards.practise}
        </Link>
      ) : (
        <p className="w-full rounded-full bg-line px-6 py-3 text-center font-semibold text-muted">
          {t.flashcards.nothingLeft}
        </p>
      )}
    </>
  );
}
