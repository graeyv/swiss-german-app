import { PRESETS, reviewLimit } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";

type PaceOptionsProps = {
  // The selected pace's new cards per day, or null when none is.
  selected: number | null;
  onSelect: (newCardsPerDay: number) => void;
  locale: Locale;
  // A pace to mark as recommended, such as in onboarding.
  recommended?: (typeof PRESETS)[number]["id"];
  recommendedLabel?: string;
};

// The three daily paces, as in the daily goal settings and in onboarding.
export function PaceOptions({
  selected,
  onSelect,
  locale,
  recommended,
  recommendedLabel,
}: PaceOptionsProps) {
  const t = dictionary(locale).goal;

  return (
    <div role="group" aria-label={t.paceLabel} className="grid grid-cols-3 gap-2">
      {PRESETS.map(({ id, newCardsPerDay: value }) => (
        <button
          key={id}
          aria-pressed={selected === value}
          onClick={() => onSelect(value)}
          className={`flex min-h-24 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
            selected === value ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"
          }`}
        >
          {id === recommended && recommendedLabel && (
            <span className="mb-1 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold text-accent-foreground">
              {recommendedLabel}
            </span>
          )}
          <strong className="font-semibold">{t.presets[id]}</strong>
          <span className="text-xs font-semibold">{t.newCards(value)}</span>
          <span className="text-xs text-muted">{t.upToReviews(reviewLimit(value) ?? 0)}</span>
        </button>
      ))}
    </div>
  );
}
