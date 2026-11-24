import { dictionary, type Locale, translationOf } from "@/lib/i18n";
import type { WordCard } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export type WordCardContent = Pick<WordCard, "status" | "swiss_german" | "variants" | "high_german" | "meaning" | "notes">;

// What one side of a word card shows, inside its face, without turning or sound: the session's
// card and its preview at /dev/design are both built from it. side is the language on it, place
// whether it's the front, which comes first, or the back. See DESIGN.md, "Word card".
export function WordCardSide({
  card,
  side,
  place,
  dialectName,
  locale,
}: {
  card: WordCardContent;
  side: "swiss_german" | "translation";
  place: "front" | "back";
  // The learner's dialect by its own name, such as "Bärndütsch", above the Swiss German.
  dialectName?: string;
  locale: Locale;
}) {
  const texts = dictionary(locale);
  const t = texts.session;
  // The front's word is the larger, as it's the whole of that side.
  const size = place === "front" ? "text-5xl" : "text-4xl";

  const content =
    side === "swiss_german" ? (
      <>
        {/* On the German track, where many words are written the same on both sides, the Swiss
            German says which it is: the dialect, as the learner chose it. Against English it's
            plain which is which. */}
        {dialectName && texts.translationIsStandardGerman && (
          <span lang="gsw" className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
            {dialectName}
          </span>
        )}
        <span lang="gsw" className={`${size} font-bold tracking-tight break-words`}>
          {card.swiss_german}
        </span>
        {/* Other ways of saying it, in a quiet line under it. */}
        {card.variants.length > 0 && (
          <span lang="gsw" className="text-lg text-teal-soft">
            {t.also}: {card.variants.join(" · ")}
          </span>
        )}
        {/* Unless the translation already is Standard German, that goes with the Swiss German, as
            the two are learned together. */}
        {!texts.translationIsStandardGerman && (
          <span className="text-muted">
            {texts.standardGerman} <span lang="de">{card.high_german}</span>
          </span>
        )}
      </>
    ) : (
      <>
        <span lang={locale} className={`${size} font-bold tracking-tight break-words`}>
          {translationOf(card, locale)}
        </span>
        {/* A word's tip is for the English track: it explains the word to those who don't know
            German, and only exists in English for now. */}
        {card.notes && !texts.translationIsStandardGerman && (
          <span className="mt-2 max-w-sm rounded-xl bg-highlight px-4 py-3 text-sm">{card.notes}</span>
        )}
      </>
    );

  return place === "front" ? (
    <>
      <StatusBadge status={card.status} t={t} />
      <span className="flex flex-1 flex-col items-center justify-center gap-2 px-2 text-center">{content}</span>
      <span className="mx-auto flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        <span aria-hidden>👆</span> {t.tapToReveal}
      </span>
    </>
  ) : (
    // Only the answer: the question was on the front.
    <span className="flex flex-1 flex-col items-center justify-center gap-3 text-center">{content}</span>
  );
}
