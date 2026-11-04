import Link from "next/link";
import { type DeckKind, overviewHref } from "@/lib/flashcards/decks";
import { dictionary, type Locale } from "@/lib/i18n";

const KINDS: DeckKind[] = ["vocabulary", "grammar"];

// Switches the overview between word decks and grammar decks. Each is its own address, so the
// back button and links from a deck return to the same one.
export function KindSwitch({ kind, locale }: { kind: DeckKind; locale: Locale }) {
  const t = dictionary(locale).flashcards;

  return (
    <nav aria-label={t.kindLabel} className="grid grid-cols-2 gap-1 rounded-full bg-line p-1">
      {KINDS.map((option) => (
        <Link
          key={option}
          href={overviewHref(option)}
          aria-current={option === kind ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-full font-semibold transition-colors ${
            option === kind ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {t[option]}
        </Link>
      ))}
    </nav>
  );
}
