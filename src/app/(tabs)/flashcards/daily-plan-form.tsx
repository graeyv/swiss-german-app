"use client";

import { useState, useTransition } from "react";
import { updateDailyPlan } from "@/app/flashcards/actions";
import {
  estimateMinutes,
  NEW_CARDS_RANGE,
  PRESETS,
  presetName,
} from "@/lib/flashcards/daily-plan";

const textButton = "min-h-11 font-semibold text-accent underline-offset-4 hover:underline";

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

export function DailyPlanForm({ newCardsPerDay }: { newCardsPerDay: number }) {
  const [open, setOpen] = useState(false);
  // The goal as last saved, so the closed line updates without waiting for the page to refresh.
  const [saved, setSaved] = useState(newCardsPerDay);
  const [serverValue, setServerValue] = useState(newCardsPerDay);
  const [draft, setDraft] = useState(newCardsPerDay);
  const [custom, setCustom] = useState(false);
  // What the learner is typing, until they leave the field or press Enter.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startSaving] = useTransition();

  if (newCardsPerDay !== serverValue) {
    setServerValue(newCardsPerDay);
    setSaved(newCardsPerDay);
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4 text-sm text-muted">
        <p>
          Daily goal:{" "}
          <span className="font-semibold text-foreground">
            {saved === 0 ? "reviews only" : `${saved} new ${saved === 1 ? "card" : "cards"}`}
          </span>
        </p>
        <button
          onClick={() => {
            setDraft(saved);
            setCustom(presetName(saved) === undefined);
            setTyped(null);
            setError(null);
            setOpen(true);
          }}
          className={textButton}
        >
          Adjust
        </button>
      </div>
    );
  }

  // Every choice saves straight away. Server actions run one at a time, so the last one wins.
  function choose(value: number) {
    setDraft(value);
    setError(null);
    startSaving(async () => {
      const result = await updateDailyPlan(value);
      if (result.error) setError(result.error);
      else setSaved(value);
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
    "size-11 rounded-full border border-line text-lg font-semibold transition-colors enabled:hover:border-accent disabled:opacity-40";

  return (
    <div className="flex flex-col gap-2">
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

      <div className="flex items-center justify-between gap-4">
        {custom ? (
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
        ) : (
          <p aria-live="polite" className="text-sm text-danger">
            {error && `Not saved: ${error}`}
          </p>
        )}
        <button onClick={() => setOpen(false)} className={textButton}>
          Done
        </button>
      </div>

      {custom && error && (
        <p aria-live="polite" className="text-sm text-danger">
          Not saved: {error}
        </p>
      )}
    </div>
  );
}
