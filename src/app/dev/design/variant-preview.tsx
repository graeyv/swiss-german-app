import type { ReactNode } from "react";
import { CARD_FACE } from "@/app/flashcards/card-stack";
import { StatusBadge } from "@/app/flashcards/status-badge";
import { Icon } from "@/app/ui/icons";
import { dictionary } from "@/lib/i18n";

// Developer preview only: a flashcard whose word has variants, such as Tschou, also said Salü or
// Hallo. The main form stays large; the variants follow in a quiet line wherever it shows, so
// learners know at once that more than one answer is right. Built like the cards in a session.

const t = dictionary("de").session;
const MAIN = "Tschou";
const VARIANTS = ["Salü", "Hallo"];
const TRANSLATION = "Hallo (informell)";
const NOTE = "Sagt man auch zum Abschied.";

// The variants in a quiet line under the main form, as on the real cards.
function Variants({ size }: { size: "large" | "small" }) {
  return (
    <span lang="gsw" className={`text-teal-soft ${size === "large" ? "text-lg" : "text-base"}`}>
      auch: {VARIANTS.join(" · ")}
    </span>
  );
}

// A card side, still and side by side rather than turning, at the height of a card in a session.
function Face({ children, audio }: { children: ReactNode; audio?: boolean }) {
  return (
    <div className="relative h-80">
      <div className={CARD_FACE.replace("backface-hidden", "")}>{children}</div>
      {audio && (
        <span className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon name="speaker" size={20} />
        </span>
      )}
    </div>
  );
}

function SwissGermanFront() {
  return (
    <Face audio>
      <StatusBadge status="new" t={t} />
      <span className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
        <span lang="gsw" className="text-5xl font-bold tracking-tight">
          {MAIN}
        </span>
        <Variants size="large" />
      </span>
      <span className="mx-auto rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        {t.tapToReveal}
      </span>
    </Face>
  );
}

function SwissGermanBack() {
  return (
    <Face audio>
      <span className="flex flex-col">
        <span lang="gsw" className="text-lg font-semibold text-muted">
          {MAIN}
        </span>
        <Variants size="small" />
      </span>
      <span className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="text-4xl font-bold tracking-tight">{TRANSLATION}</span>
        <span className="mt-2 max-w-sm rounded-xl bg-highlight px-4 py-3 text-sm">{NOTE}</span>
      </span>
    </Face>
  );
}

function TranslationFront() {
  return (
    <Face>
      <StatusBadge status="new" t={t} />
      <span className="flex flex-1 items-center justify-center px-2 text-center">
        <span className="text-5xl font-bold tracking-tight">{TRANSLATION}</span>
      </span>
      <span className="mx-auto rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        {t.tapToReveal}
      </span>
    </Face>
  );
}

function TranslationBack() {
  return (
    <Face audio>
      <span className="text-lg font-semibold text-muted">{TRANSLATION}</span>
      <span className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <span lang="gsw" className="text-4xl font-bold tracking-tight">
          {MAIN}
        </span>
        <Variants size="large" />
        <span className="mt-3 max-w-sm rounded-xl bg-highlight px-4 py-3 text-sm">{NOTE}</span>
      </span>
    </Face>
  );
}

function Side({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption text-teal-soft">{title}</span>
      {children}
    </div>
  );
}

export function VariantPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="text-body font-bold">Schweizerdeutsch zuerst</span>
        <Side title="Vorderseite">
          <SwissGermanFront />
        </Side>
        <Side title="Rückseite">
          <SwissGermanBack />
        </Side>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-body font-bold">Hochdeutsch zuerst</span>
        <Side title="Vorderseite">
          <TranslationFront />
        </Side>
        <Side title="Rückseite">
          <TranslationBack />
        </Side>
      </div>
    </div>
  );
}
