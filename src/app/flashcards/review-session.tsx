"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState, useTransition } from "react";
import { advanceQueue } from "@/lib/flashcards/queue";
import type { CardFront, Flashcard } from "@/lib/types";
import { submitReview, updateCardFront } from "./actions";

type Grade = 1 | 2 | 3 | 4;

type ReviewSessionProps = {
  cards: Flashcard[];
  cardFront: CardFront;
  emptyMessage: string;
  // Where the learner returns to, such as the category the session started from.
  backHref: string;
  backLabel: string;
};

const GRADES = [
  { grade: 1, label: "Again", color: "text-danger" },
  { grade: 2, label: "Hard", color: "text-foreground" },
  { grade: 3, label: "Good", color: "text-success" },
  { grade: 4, label: "Easy", color: "text-accent" },
] as const;

const KIND_BADGES: Record<Flashcard["kind"], { label: string; className: string }> = {
  new: { label: "New", className: "bg-accent/10 text-accent" },
  learning: { label: "Learning", className: "bg-tint-yellow" },
  review: { label: "Review", className: "bg-line" },
};

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export function ReviewSession({
  cards,
  cardFront,
  emptyMessage,
  backHref,
  backLabel,
}: ReviewSessionProps) {
  // Null until the first grade, so a session that hasn't started shows the latest cards.
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  // Cards finished for this session. A missed card goes back into the queue instead.
  const [completed, setCompleted] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [newLearned, setNewLearned] = useState(0);
  const [front, setFront] = useState(cardFront);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const activeQueue = queue ?? cards;
  const finished = queue !== null && queue.length === 0;
  const total = completed + activeQueue.length;

  // Next.js keeps visited routes hidden with their state. Leaving an unfinished session keeps
  // the learner's place, but a finished one must start over when reopened.
  useLayoutEffect(() => {
    if (!finished) return;
    return () => {
      setQueue(null);
      setCompleted(0);
      setReviewedCount(0);
      setNewLearned(0);
      setSaveError(null);
    };
  }, [finished]);

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <div>
          <p className="font-semibold text-success">Session complete</p>
          <h1 className="text-4xl font-bold tracking-tight">
            {reviewedCount} {reviewedCount === 1 ? "card" : "cards"} practised
          </h1>
          {newLearned > 0 && (
            <p className="mt-1 text-muted">
              Including {newLearned} new {newLearned === 1 ? "word" : "words"}.
            </p>
          )}
        </div>
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

  function grade(value: Grade) {
    setSaveError(null);
    startSaving(async () => {
      const result = await submitReview(card.review_id, card.vocabulary_id, value);
      if ("error" in result) {
        setSaveError(result.error);
        return;
      }
      const repeat: Flashcard = {
        ...card,
        kind: "learning",
        review_id: result.reviewId,
        intervals: result.intervals,
      };
      const next = advanceQueue(activeQueue, repeat, new Date(result.dueAt), new Date());
      if (next.length < activeQueue.length) setCompleted((count) => count + 1);
      if (card.kind === "new") setNewLearned((count) => count + 1);
      setReviewedCount((count) => count + 1);
      setQueue(next);
    });
  }

  // The card turns over straight away. Saving the choice for other sessions happens meanwhile.
  function swapFront() {
    const next = front === "swiss_german" ? "english" : "swiss_german";
    setFront(next);
    void updateCardFront(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Leave session"
          className="-ml-2 flex size-11 shrink-0 items-center justify-center text-xl text-muted"
        >
          ×
        </Link>
        <div
          role="progressbar"
          aria-label="Session progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          className="h-2 flex-1 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {completed} / {total}
        </p>
        <button
          onClick={swapFront}
          aria-label={
            front === "swiss_german"
              ? "Showing Swiss German first. Show English first instead"
              : "Showing English first. Show Swiss German first instead"
          }
          title="Swap card direction"
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
        >
          <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M13.2 2.24a.75.75 0 0 0 .04 1.06l2.1 1.95H6.75a.75.75 0 0 0 0 1.5h8.59l-2.1 1.95a.75.75 0 1 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 0 0-1.06.04Zm-6.4 8a.75.75 0 0 0-1.06-.04l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h8.59a.75.75 0 0 0 0-1.5H4.66l2.1-1.95a.75.75 0 0 0 .04-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      <CardStage
        key={card.review_id}
        card={card}
        front={front}
        stacked={activeQueue.length > 1}
        saving={saving}
        saveError={saveError}
        onGrade={grade}
      />
    </main>
  );
}

type CardStageProps = {
  card: Flashcard;
  front: CardFront;
  // Whether more cards wait behind this one, shown as a stack.
  stacked: boolean;
  saving: boolean;
  saveError: string | null;
  onGrade: (grade: Grade) => void;
};

// Keyed by the card's attempt, so each card starts face down.
function CardStage({ card, front, stacked, saving, saveError, onGrade }: CardStageProps) {
  const [revealed, setRevealed] = useState(false);

  // Space or Enter flips the card, and 1–4 grade it once it's revealed.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("a, button, input")) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      } else if (revealed && !saving && ["1", "2", "3", "4"].includes(event.key)) {
        onGrade(Number(event.key) as Grade);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealed, saving, onGrade]);

  const badge = KIND_BADGES[card.kind];
  const swissGerman = { text: card.swiss_german, lang: "gsw" };
  const english = { text: card.english, lang: "en" };
  const [prompt, answer] = front === "swiss_german" ? [swissGerman, english] : [english, swissGerman];
  const face =
    "absolute inset-0 flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-lg backface-hidden";

  return (
    <>
      <div className="relative flex flex-1 flex-col">
        {stacked && (
          <>
            <div
              aria-hidden
              className="absolute inset-x-6 top-4 -bottom-4 rounded-3xl border border-line bg-surface opacity-50"
            />
            <div
              aria-hidden
              className="absolute inset-x-3 top-2 -bottom-2 rounded-3xl border border-line bg-surface opacity-80"
            />
          </>
        )}

        <div className="relative min-h-80 flex-1 perspective-distant">
          <button
            onClick={() => setRevealed(!revealed)}
            aria-pressed={revealed}
            className="absolute inset-0 rounded-3xl text-left outline-offset-4"
          >
            <span
              className={`relative block size-full transition-transform duration-500 transform-3d motion-reduce:transition-none ${
                revealed ? "rotate-y-180" : ""
              }`}
            >
              {/* Screen readers only read the side that is showing. */}
              <span aria-hidden={revealed} className={face}>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="flex flex-1 items-center justify-center px-2 text-center">
                  <span lang={prompt.lang} className="text-5xl font-bold tracking-tight break-words">
                    {prompt.text}
                  </span>
                </span>
                <span className="mx-auto flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                  <span aria-hidden>👆</span> Tap card to reveal
                </span>
              </span>

              <span aria-hidden={!revealed} className={`${face} rotate-y-180`}>
                <span lang={prompt.lang} className="text-lg font-semibold text-muted">
                  {prompt.text}
                </span>
                <span className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <span lang={answer.lang} className="text-4xl font-bold tracking-tight break-words">
                    {answer.text}
                  </span>
                  <span className="text-muted">
                    Standard German: <span lang="de">{card.high_german}</span>
                  </span>
                  {card.notes && (
                    <span className="mt-2 max-w-sm rounded-xl bg-highlight px-4 py-3 text-sm">
                      {card.notes}
                    </span>
                  )}
                </span>
              </span>
            </span>
          </button>

          {/* Hearing the word first would give the answer away when English is the prompt. */}
          {(front === "swiss_german" || revealed) && <AudioButton url={card.audio_url} />}
        </div>
      </div>

      <footer className="flex min-h-24 flex-col justify-end gap-3">
        {saveError && (
          <p aria-live="polite" className="text-sm text-danger">
            Your answer wasn&rsquo;t saved: {saveError}. Choose again to retry.
          </p>
        )}
        {revealed && (
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map(({ grade: value, label, color }) => (
              <button
                key={value}
                disabled={saving}
                onClick={() => onGrade(value)}
                className="flex min-h-16 flex-col items-center justify-center rounded-2xl border border-line bg-surface shadow-sm transition-colors enabled:hover:border-accent disabled:opacity-50"
              >
                <span className={`font-semibold ${color}`}>{label}</span>
                <span className="text-xs text-muted">{card.intervals[value]}</span>
              </button>
            ))}
          </div>
        )}
      </footer>
    </>
  );
}

function AudioButton({ url }: { url: string | null }) {
  return (
    <button
      onClick={() => url && void new Audio(url).play().catch(() => {})}
      disabled={!url}
      aria-label={url ? "Play pronunciation" : "No recording yet"}
      title={url ? "Play pronunciation" : "No recording yet"}
      className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors enabled:hover:bg-accent/20 disabled:bg-line disabled:text-muted"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path d="M10.5 3.75a.75.75 0 0 0-1.264-.546L5.203 7H2.667a.75.75 0 0 0-.7.48A6.985 6.985 0 0 0 1.5 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h2.535l4.033 3.796a.75.75 0 0 0 1.264-.546V3.75ZM16.45 5.05a.75.75 0 0 0-1.06 1.061 5.5 5.5 0 0 1 0 7.778.75.75 0 0 0 1.06 1.06 7 7 0 0 0 0-9.899Z" />
        <path d="M14.329 7.172a.75.75 0 0 0-1.061 1.06 2.5 2.5 0 0 1 0 3.536.75.75 0 0 0 1.06 1.06 4 4 0 0 0 0-5.656Z" />
      </svg>
    </button>
  );
}
