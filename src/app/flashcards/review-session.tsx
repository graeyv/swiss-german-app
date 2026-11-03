"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { advanceQueue } from "@/lib/flashcards/queue";
import type { Flashcard } from "@/lib/types";
import { submitReview } from "./actions";

type ReviewSessionProps = {
  cards: Flashcard[];
  emptyMessage: string;
  // Where the learner returns to, such as the category the session started from.
  backHref: string;
  backLabel: string;
};

const GRADES = [
  { grade: 1, label: "Again" },
  { grade: 2, label: "Hard" },
  { grade: 3, label: "Good" },
  { grade: 4, label: "Easy" },
] as const;

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export function ReviewSession({ cards, emptyMessage, backHref, backLabel }: ReviewSessionProps) {
  // Null until the first grade, so a session that hasn't started shows the latest cards.
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const activeQueue = queue ?? cards;
  const finished = queue !== null && queue.length === 0;

  // Next.js keeps visited routes hidden with their state. Leaving an unfinished session keeps
  // the learner's place, but a finished one must start over when reopened.
  useLayoutEffect(() => {
    if (!finished) return;
    return () => {
      setQueue(null);
      setRevealed(false);
      setReviewedCount(0);
      setSaveError(null);
    };
  }, [finished]);

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="font-semibold text-success">Session complete</p>
        <h1 className="text-4xl font-bold tracking-tight">
          {reviewedCount} {reviewedCount === 1 ? "review" : "reviews"}
        </h1>
        <Link href={backHref} className={`${primaryButton} text-center`}>
          Back to {backLabel}
        </Link>
      </main>
    );
  }

  const card = activeQueue[0];
  if (!card) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="text-muted">{emptyMessage}</p>
        <Link href={backHref} className="underline underline-offset-4">
          Back to {backLabel}
        </Link>
      </main>
    );
  }

  function grade(value: 1 | 2 | 3 | 4) {
    setSaveError(null);
    startSaving(async () => {
      const result = await submitReview(card.review_id, card.vocabulary_id, value);
      if ("error" in result) {
        setSaveError(result.error);
        return;
      }
      const repeat = { ...card, review_id: result.reviewId, intervals: result.intervals };
      setQueue(advanceQueue(activeQueue, repeat, new Date(result.dueAt), new Date()));
      setReviewedCount((count) => count + 1);
      setRevealed(false);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-6">
      <header className="flex items-center gap-4">
        <Link
          href={backHref}
          aria-label="Leave session"
          className="-ml-2 flex size-11 items-center justify-center text-xl text-muted"
        >
          ×
        </Link>
        <p className="flex-1 text-right text-sm text-muted">{activeQueue.length} left</p>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-4xl font-bold tracking-tight" lang="gsw">
            {card.swiss_german}
          </p>
          {card.audio_url && (
            <button
              onClick={() => void new Audio(card.audio_url!).play()}
              className="mx-auto text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Play audio
            </button>
          )}
          {revealed && (
            <>
              <p className="mt-2 text-lg">{card.english}</p>
              <p className="text-muted">
                Standard German: <span lang="de">{card.high_german}</span>
              </p>
              {card.notes && <p className="mt-2 text-sm text-muted">{card.notes}</p>}
            </>
          )}
        </div>
      </div>

      <footer className="flex min-h-28 flex-col justify-end gap-3">
        {saveError && (
          <p aria-live="polite" className="text-danger">
            Your review wasn&rsquo;t saved: {saveError}. Choose a grade to try again.
          </p>
        )}
        {revealed ? (
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map(({ grade: value, label }) => (
              <button
                key={value}
                disabled={saving}
                onClick={() => grade(value)}
                className="flex flex-col items-center rounded-xl border-2 border-line bg-surface px-2 py-3 font-semibold transition-colors enabled:hover:border-accent disabled:opacity-50"
              >
                {label}
                <span className="text-xs font-normal text-muted">{card.intervals[value]}</span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} className={primaryButton}>
            Show answer
          </button>
        )}
      </footer>
    </main>
  );
}
