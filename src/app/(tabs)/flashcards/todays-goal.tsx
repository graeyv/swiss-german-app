"use client";

import { useRef, useState, useTransition } from "react";
import { updateDailyPlan } from "@/app/flashcards/actions";
import { PRESETS, presetName, reviewLimit } from "@/lib/flashcards/daily-plan";
import { BottomSheet } from "./bottom-sheet";

type TodaysGoalProps = {
  newCardsPerDay: number;
  introducedToday: number;
  reviewsDone: number;
  // Words reviewed plus those still due today, counting only words learned before today.
  reviewsTotal: number;
  reached: boolean;
};

export function TodaysGoal({
  newCardsPerDay,
  introducedToday,
  reviewsDone,
  reviewsTotal,
  reached,
}: TodaysGoalProps) {
  const sheet = useRef<HTMLDialogElement>(null);
  // The goal as last saved, so the card updates without waiting for the page to refresh.
  const [saved, setSaved] = useState(newCardsPerDay);
  const [serverValue, setServerValue] = useState(newCardsPerDay);
  // The pace picked in the sheet, saved only with "Save changes". Null when none is picked,
  // which happens when the saved goal matches no pace.
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  if (newCardsPerDay !== serverValue) {
    setServerValue(newCardsPerDay);
    setSaved(newCardsPerDay);
  }

  function open() {
    setSelected(presetName(saved) ? saved : null);
    setError(null);
    sheet.current?.showModal();
  }

  function save() {
    if (selected === null) return;
    setError(null);
    startSaving(async () => {
      const result = await updateDailyPlan(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(selected);
      sheet.current?.close();
    });
  }

  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border border-line bg-linear-135 to-surface to-75% p-5 ${
        reached ? "from-tint-green" : "from-highlight"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          Today&rsquo;s goal
          {reached && (
            <span className="rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-surface motion-safe:animate-pop">
              🎉 Reached
            </span>
          )}
        </h2>
        <button
          onClick={open}
          aria-label="Edit daily goal"
          className="-mr-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <GearIcon />
          Edit
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {saved > 0 && (
          <Progress label="New words" done={Math.min(introducedToday, saved)} total={saved} />
        )}
        <Progress label="Cards reviewed" done={reviewsDone} total={reviewsTotal} />
      </div>

      <BottomSheet ref={sheet} label="Choose your daily learning pace">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Choose your daily learning pace</h2>
          <button
            onClick={() => sheet.current?.close()}
            aria-label="Close"
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div role="group" aria-label="Daily learning pace" className="grid grid-cols-3 gap-2">
          {PRESETS.map(({ name, newCardsPerDay: value }) => (
            <button
              key={name}
              aria-pressed={selected === value}
              onClick={() => setSelected(value)}
              className={`flex min-h-24 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
                selected === value
                  ? "border-accent bg-accent/10"
                  : "border-line hover:border-accent/50"
              }`}
            >
              <strong className="font-semibold">{name}</strong>
              <span className="text-xs font-semibold">{value} new cards</span>
              <span className="text-xs text-muted">up to {reviewLimit(value)} reviews</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-muted">
          Your review schedule is calculated automatically from the number of new cards you
          choose. How many reviews you get varies with your progress: it&rsquo;s a daily maximum,
          not an amount you have to complete.
        </p>

        {error && (
          <p aria-live="polite" className="text-sm text-danger">
            Not saved: {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={selected === null || saving}
          className="w-full rounded-full bg-accent px-6 py-4 text-lg font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </BottomSheet>
    </section>
  );
}

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.min(100, (done / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-muted">{label}</span>
        <strong className="tabular-nums">{total === 0 ? "Nothing due" : `${done} / ${total}`}</strong>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path
        fillRule="evenodd"
        d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
