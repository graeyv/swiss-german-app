import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { type DeckNode, findDeck, overviewHref } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { hasWordsAndPhrases } from "@/lib/flashcards/vocabulary-filter";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
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

      {/* Directly in the page's column, so it stays at the top while the page scrolls. */}
      <TopBar back={{ href: parent ? `/flashcards/decks/${parent.code}` : overviewHref(deck.kind) }} backText={parent?.title ?? t.flashcards.title} className="-mt-6 -mb-4" />

      <div className="flex flex-col gap-4">
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

  // Takes the shuffle button's place and shape, so finishing reads as an achievement and the page
  // doesn't jump.
  if (newWords + due === 0) {
    return (
      <p className="flex min-h-14 items-center gap-2 rounded-2xl bg-tint-green px-4 font-semibold text-success">
        <span aria-hidden>✅</span>
        {t.allDone}
      </p>
    );
  }

  // A filled button with the cards' soft corners: no icon tile and no arrow, so it reads as an
  // action rather than one more topic. The counts are what a session would hold today.
  return (
    <Link
      href={`/flashcards/session/${deck.code}?shuffle=1`}
      aria-label={`${t.shuffle(deck.title)}: ${t.newCount(newWords)}, ${t.reviewCount(due)}`}
      className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-accent px-4 py-2 text-accent-foreground shadow-sm transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
        <path d="M3 6h2.5c1.6 0 3 .8 3.9 2.1l2.2 3.8c.9 1.3 2.3 2.1 3.9 2.1H17M3 14h2.5c1.6 0 3-.8 3.9-2.1M12.6 8.1c.9-1.3 2.3-2.1 3.9-2.1H17M15 4l2 2-2 2M15 12l2 2-2 2" />
      </svg>
      {/* Wraps before the chips do, should a label be long on a narrow phone. */}
      <span className="min-w-0 flex-1 leading-snug font-semibold">{t.shuffleAll}</span>
      <span className="flex shrink-0 gap-1.5 text-xs font-semibold">
        {newWords > 0 && <span className="rounded-full bg-white/20 px-2 py-1">{t.newCount(newWords)}</span>}
        {due > 0 && <span className="rounded-full bg-white/20 px-2 py-1">{t.reviewCount(due)}</span>}
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
        mixed={deck.kind === "vocabulary" && hasWordsAndPhrases(deck)}
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
