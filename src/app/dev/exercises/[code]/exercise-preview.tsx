"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExerciseStage } from "@/app/flashcards/exercise-stage";
import type { Locale } from "@/lib/i18n";
import type { GrammarCard } from "@/lib/types";

type ExercisePreviewProps = {
  card: GrammarCard;
  locale: Locale;
  // Which exercise this is, for the developer.
  label: string;
  // Where Continue goes: the next exercise, or the list after the last one.
  nextHref: string;
};

// The grammar card of a session, with nothing saved: answers count as saved straight away.
export function ExercisePreview({ card, locale, label, nextHref }: ExercisePreviewProps) {
  const router = useRouter();
  // A new attempt starts the exercise over.
  const [attempt, setAttempt] = useState(0);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <Link
          href="/dev/exercises"
          aria-label="Back to all exercises"
          className="-ml-2 flex size-11 shrink-0 items-center justify-center text-xl text-muted"
        >
          ×
        </Link>
        <p className="flex-1 truncate font-mono text-sm text-muted">{label}</p>
        <button
          onClick={() => setAttempt((count) => count + 1)}
          className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold transition-colors hover:border-accent"
        >
          Retry
        </button>
      </header>

      <ExerciseStage
        key={attempt}
        card={card}
        locale={locale}
        stacked={false}
        saving={false}
        saved
        saveError={null}
        onAnswer={() => {}}
        onContinue={() => router.push(nextHref)}
      />
    </main>
  );
}
