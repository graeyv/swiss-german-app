"use client";

import { useState, useTransition } from "react";
import { updateDailyPlan } from "@/app/flashcards/actions";
import {
  estimateMinutes,
  NEW_CARDS_RANGE,
  PRESETS,
  presetName,
} from "@/lib/flashcards/daily-plan";

type TodaysGoalProps = {
  newCardsPerDay: number;
  introducedToday: number;
  reviewsDone: number;
  // Reviews done plus those still due today, so the remainder matches the review button.
  reviewsTotal: number;
};

export function TodaysGoal({
  newCardsPerDay,
  introducedToday,
  reviewsDone,
  reviewsTotal,
}: TodaysGoalProps) {
  const [editing, setEditing] = useState(false);
  // The goal as last saved, so the card updates without waiting for the page to refresh.
  const [saved, setSaved] = useState(newCardsPerDay);
  const [serverValue, setServerValue] = useState(newCardsPerDay);

  if (newCardsPerDay !== serverValue) {
    setServerValue(newCardsPerDay);
    setSaved(newCardsPerDay);
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-linear-135 from-highlight to-surface to-75% p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight">Today&rsquo;s goal</h2>
        <button
          onClick={() => setEditing(!editing)}
          aria-expanded={editing}
          aria-label={editing ? "Done editing daily goal" : "Edit daily goal"}
          className="-mr-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          {editing ? (
            "Done"
          ) : (
            <>
              <GearIcon />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {saved > 0 && (
          <Progress label="New words" done={Math.min(introducedToday, saved)} total={saved} />
        )}
        <Progress label="Cards reviewed" done={reviewsDone} total={reviewsTotal} />
      </div>

      {editing && <GoalEditor saved={saved} onSaved={setSaved} />}
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

function PaceDetails({ newCardsPerDay }: { newCardsPerDay: number }) {
  if (newCardsPerDay === 0) return <span className="text-xs text-muted">Reviews only</span>;
  return (
    <span className="text-xs leading-tight text-muted">
      {newCardsPerDay} new
      <br />
      {estimateMinutes(newCardsPerDay).total} min
    </span>
  );
}

function GoalEditor({ saved, onSaved }: { saved: number; onSaved: (value: number) => void }) {
  const [draft, setDraft] = useState(saved);
  // A goal that matches no pace opens with Custom selected, so its number stays visible.
  const [custom, setCustom] = useState(presetName(saved) === undefined);
  // What the learner is typing, until they leave the field or press Enter.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startSaving] = useTransition();

  // Every choice saves straight away. Server actions run one at a time, so the last one wins.
  function choose(value: number) {
    setDraft(value);
    setError(null);
    startSaving(async () => {
      const result = await updateDailyPlan(value);
      if (result.error) setError(result.error);
      else onSaved(value);
    });
  }

  // A typed number is kept within range, and anything that isn't a number is discarded.
  function commitTyped() {
    if (typed === null) return;
    const value = Number.parseInt(typed, 10);
    setTyped(null);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(NEW_CARDS_RANGE.max, Math.max(NEW_CARDS_RANGE.min, value));
    if (clamped !== draft) choose(clamped);
  }

  const segment = (selected: boolean) =>
    `flex min-h-12 flex-col items-center justify-center rounded-xl px-1 transition-colors ${
      selected ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
    }`;
  const stepButton =
    "size-11 rounded-full border border-line bg-surface text-lg font-semibold transition-colors enabled:hover:border-accent disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div role="group" aria-label="Daily pace" className="grid grid-cols-4 gap-1 rounded-2xl bg-line p-1">
        {PRESETS.map(({ name, newCardsPerDay: value }) => {
          const selected = !custom && draft === value;
          return (
            <button
              key={name}
              aria-pressed={selected}
              onClick={() => {
                setCustom(false);
                choose(value);
              }}
              className={segment(selected)}
            >
              <span className="text-sm font-semibold">{name}</span>
              <PaceDetails newCardsPerDay={value} />
            </button>
          );
        })}
        <button aria-pressed={custom} onClick={() => setCustom(true)} className={segment(custom)}>
          <span className="text-sm font-semibold">Custom</span>
          {custom ? (
            <PaceDetails newCardsPerDay={draft} />
          ) : (
            <span className="text-xs leading-tight text-muted">
              Any
              <br />
              amount
            </span>
          )}
        </button>
      </div>

      {custom && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <button
            onClick={() => choose(draft - 1)}
            disabled={draft <= NEW_CARDS_RANGE.min}
            aria-label="Fewer new cards"
            className={stepButton}
          >
            –
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={NEW_CARDS_RANGE.min}
            max={NEW_CARDS_RANGE.max}
            aria-label="New cards per day"
            value={typed ?? String(draft)}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={commitTyped}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-11 w-14 [appearance:textfield] rounded-lg border border-line bg-surface text-center text-base font-semibold text-foreground tabular-nums outline-offset-2 focus:outline-2 focus:outline-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => choose(draft + 1)}
            disabled={draft >= NEW_CARDS_RANGE.max}
            aria-label="More new cards"
            className={stepButton}
          >
            +
          </button>
          new cards a day
        </div>
      )}

      {error && (
        <p aria-live="polite" className="text-sm text-danger">
          Not saved: {error}
        </p>
      )}
    </div>
  );
}
