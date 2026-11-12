import Link from "next/link";
import { VOCABULARY_FILTERS, type VocabularyFilter } from "@/lib/flashcards/vocabulary-filter";
import { dictionary, type Locale } from "@/lib/i18n";

type FilterSwitchProps = {
  value: VocabularyFilter;
  locale: Locale;
} & (
  // Before starting flashcards, a choice made in place.
  | { onChange: (filter: VocabularyFilter) => void; hrefOf?: never }
  // On the word list, each choice is its own address, so back and reload keep it.
  | { hrefOf: (filter: VocabularyFilter) => string; onChange?: never }
);

const option = (selected: boolean) =>
  `flex min-h-11 items-center justify-center rounded-xl px-2 py-1.5 text-center text-sm leading-tight font-semibold transition-colors ${
    selected ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
  }`;

// All cards, words only, or sentences (and expressions) only. A longer label in another language
// may wrap to two lines on a phone, so the options are rounded boxes rather than pills.
export function FilterSwitch({ value, locale, onChange, hrefOf }: FilterSwitchProps) {
  const t = dictionary(locale).flashcards;

  if (hrefOf) {
    return (
      <nav aria-label={t.filterLabel} className="grid grid-cols-3 gap-1 rounded-2xl bg-line p-1">
        {VOCABULARY_FILTERS.map((filter) => (
          <Link
            key={filter}
            href={hrefOf(filter)}
            replace
            scroll={false}
            aria-current={filter === value ? "page" : undefined}
            className={option(filter === value)}
          >
            {t.filters[filter]}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div role="radiogroup" aria-label={t.filterLabel} className="grid grid-cols-3 gap-1 rounded-2xl bg-line p-1">
      {VOCABULARY_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="radio"
          aria-checked={filter === value}
          onClick={() => onChange(filter)}
          className={option(filter === value)}
        >
          {t.filters[filter]}
        </button>
      ))}
    </div>
  );
}
