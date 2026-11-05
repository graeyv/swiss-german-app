import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { type DeckNode, findDeck, overviewHref } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { TINTS } from "../../deck-card";
import { Counts } from "../../counts";
import { SubcategorySheet } from "./subcategory-sheet";

type Availability = ReturnType<typeof deckAvailability>;

export default function DeckPage({ params }: PageProps<"/flashcards/decks/[code]">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Deck params={params} />
    </Suspense>
  );
}

async function Deck({ params }: Pick<PageProps<"/flashcards/decks/[code]">, "params">) {
  const { code } = await params;
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const { tree, limits } = await getToday(supabase);
  const t = dictionary(locale);

  const found = findDeck(tree, code);
  if (!found) notFound();
  const { deck, ancestors } = found;
  const parent = ancestors.at(-1);

  return (
    <>
      <title>{t.title(deck.title)}</title>

      <div className="flex flex-col gap-4">
        <Link
          href={parent ? `/flashcards/decks/${parent.code}` : overviewHref(deck.kind)}
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
            {deck.description && <p className="text-sm text-muted">{deck.description}</p>}
          </div>
        </div>
      </div>

      <ShuffleButton deck={deck} availability={deckAvailability(deck, limits)} locale={locale} />

      {deck.children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t.flashcards.subcategories}
          </h2>
          <ul className="flex flex-col gap-2">
            {deck.children.map((child) => (
              <li key={child.id}>
                <Subcategory
                  deck={child}
                  availability={deckAvailability(child, limits)}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

type DeckProps = { deck: DeckNode; availability: Availability; locale: Locale };

function ShuffleButton({ deck, availability, locale }: DeckProps) {
  const { newWords, due } = availability;
  const t = dictionary(locale).flashcards;

  // Takes the shuffle card's place and shape, so finishing reads as an achievement.
  if (newWords + due === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-tint-green p-5">
        <span aria-hidden className="text-3xl">
          ✅
        </span>
        <span className="flex flex-col">
          <strong className="text-lg text-success">{t.allDone}</strong>
          <span className="text-sm text-muted">{t.comeBackTomorrow(deck.title)}</span>
        </span>
      </div>
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
        <strong className="text-lg">{t.shuffle}</strong>
        <span className="text-sm opacity-90">
          {t.newCount(newWords)} · {t.reviewCount(due)}
        </span>
      </span>
      <span aria-hidden className="text-2xl">
        ›
      </span>
    </Link>
  );
}

// Only the lowest level holds cards, so it offers flashcards and its word list. A subcategory
// with its own subcategories opens its page instead, whatever its depth.
function Subcategory({ deck, availability, locale }: DeckProps) {
  const { newWords, due } = availability;

  if (deck.children.length === 0) {
    return (
      <SubcategorySheet
        code={deck.code}
        kind={deck.kind}
        title={deck.title}
        emoji={deck.emoji ?? "📚"}
        tint={TINTS[deck.color]}
        newWords={newWords}
        due={due}
        locale={locale}
      />
    );
  }

  return (
    <Link
      href={`/flashcards/decks/${deck.code}`}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-accent active:scale-[0.99]"
    >
      <span
        aria-hidden
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl ${TINTS[deck.color]}`}
      >
        {deck.emoji ?? "📚"}
      </span>
      <span className="min-w-0 flex-1 font-semibold leading-snug">{deck.title}</span>
      <Counts newWords={newWords} due={due} locale={locale} />
      <span aria-hidden className="text-muted">
        ›
      </span>
    </Link>
  );
}
