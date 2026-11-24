import type { ReactNode } from "react";
import { CARD_FACE } from "@/app/flashcards/card-stack";
import { type WordCardContent, WordCardSide } from "@/app/flashcards/word-card-side";
import { Icon } from "@/app/ui/icons";
import type { Locale } from "@/lib/i18n";

// Developer preview only: a word card's two sides, standing still side by side, in both tracks and
// both directions. Built from the session's own WordCardSide, so it shows what learners see: the
// variants under the Swiss German; on the German track the dialect's name above it; on the
// English track the Standard German with it and the word's note (yellow) with the translation;
// and the speaker only on the Swiss German side.

const WORD: WordCardContent = {
  status: "new",
  swiss_german: "Tschou",
  variants: ["Salü", "Hallo"],
  high_german: "Hallo",
  meaning: "Hi (informal)",
  notes: "Also said when leaving.",
};
const DIALECT = "Bärndütsch";

type Side = "swiss_german" | "translation";

// A side at the height of a card in a session, with the speaker where the session puts it.
function Face({ side, place, locale }: { side: Side; place: "front" | "back"; locale: Locale }) {
  return (
    <div className="relative h-80">
      <div className={CARD_FACE.replace("backface-hidden", "")}>
        <WordCardSide card={WORD} side={side} place={place} dialectName={DIALECT} locale={locale} />
      </div>
      {side === "swiss_german" && (
        <span className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon name="speaker" size={20} />
        </span>
      )}
    </div>
  );
}

function Labelled({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption text-teal-soft">{title}</span>
      {children}
    </div>
  );
}

function Example({ title, locale, front }: { title: string; locale: Locale; front: Side }) {
  const back = front === "swiss_german" ? "translation" : "swiss_german";
  return (
    <div className="flex flex-col gap-4">
      <span className="text-body font-bold">{title}</span>
      <Labelled title="Vorderseite">
        <Face side={front} place="front" locale={locale} />
      </Labelled>
      <Labelled title="Rückseite">
        <Face side={back} place="back" locale={locale} />
      </Labelled>
    </div>
  );
}

export function VariantPreview() {
  return (
    <div className="flex flex-col gap-10">
      <Example title="Deutscher Lernweg · Schweizerdeutsch zuerst" locale="de" front="swiss_german" />
      <Example title="Deutscher Lernweg · Hochdeutsch zuerst" locale="de" front="translation" />
      <Example title="Englischer Lernweg · Schweizerdeutsch zuerst" locale="en" front="swiss_german" />
      <Example title="Englischer Lernweg · Englisch zuerst" locale="en" front="translation" />
    </div>
  );
}
