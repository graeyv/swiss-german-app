import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/flashcards/data";
import { type DeckNode, findDeck, overviewHref } from "@/lib/flashcards/decks";
import { deckAvailability } from "@/lib/flashcards/session";
import { hasWordsAndPhrases } from "@/lib/flashcards/vocabulary-filter";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TOPIC_ILLUSTRATIONS } from "@/app/topic-illustrations";
import { Icon } from "@/app/ui/icons";
import { TopicBanner } from "@/app/ui/topic-banner";
import { TopBar } from "@/app/top-bar";
import { dictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { Counts } from "../../counts";
import { deckIcon } from "../../deck-icons";
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
  const illustration = TOPIC_ILLUSTRATIONS[deck.code];

  return (
    <>
      <title>{t.title(deck.title)}</title>

      {/* Directly in the page's column, so it stays at the top while the page scrolls. */}
      <TopBar back={{ href: parent ? `/flashcards/decks/${parent.code}` : overviewHref(deck.kind) }} backText={parent?.title ?? t.flashcards.title} className="-mt-6 -mb-4" />

      {/* The topic's illustration as a banner, or without one, the deck's icon. */}
      <div className="flex flex-col gap-6">
        {illustration ? (
          <TopicBanner image={illustration} />
        ) : (
          <Icon name={deckIcon(deck.code)} size={28} className="text-teal-soft" />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-bold">{deck.title}</h1>
          {deck.description && <p className="text-body text-teal-soft">{deck.description}</p>}
        </div>
      </div>

      {/* A topic without cards yet says so, rather than that today's cards are done. */}
      {deck.card_count === 0 ? (
        <p className="flex min-h-14 items-center rounded-2xl bg-mist px-4 font-semibold text-teal-soft">
          {t.flashcards.comingSoon}
        </p>
      ) : (
        <ShuffleButton deck={deck} availability={deckAvailability(deck, limits)} locale={locale} />
      )}

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
      <p className="flex min-h-14 items-center gap-2 rounded-2xl bg-yellow px-4 font-semibold text-teal">
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
      <Icon name="shuffle" size={20} />
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

  // Still without cards: shown so the structure is visible, but there's nothing to open yet.
  if (deck.card_count === 0) {
    return (
      <div className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4">
        <Icon name={deckIcon(deck.code)} size={28} className="text-teal-soft" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-bold">{deck.title}</span>
          <span className="text-caption text-teal-soft">{dictionary(locale).flashcards.comingSoon}</span>
        </span>
      </div>
    );
  }

  if (deck.children.length === 0) {
    return (
      <SubcategorySheet
        code={deck.code}
        kind={deck.kind}
        title={deck.title}
        icon={deckIcon(deck.code)}
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
      className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4 transition-transform active:scale-[0.98]"
    >
      <Icon name={deckIcon(deck.code)} size={28} className="text-teal-soft" />
      <span className="min-w-0 flex-1 text-body font-bold">{deck.title}</span>
      <Counts newWords={newWords} due={due} locale={locale} />
      <Icon name="forward" />
    </Link>
  );
}
