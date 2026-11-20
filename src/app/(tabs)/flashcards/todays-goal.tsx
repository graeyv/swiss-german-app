"use client";

import { useRef, useState, useTransition } from "react";
import { updateDailyPlan } from "@/app/flashcards/actions";
import { LiftLimit } from "@/app/flashcards/lift-limit";
import { presetId } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { PaceOptions } from "./pace-options";
import { Icon } from "@/app/ui/icons";

type TodaysGoalProps = {
  newCardsPerDay: number;
  introducedToday: number;
  reviewsDone: number;
  // Words reviewed plus those still due today, counting only words learned before today.
  reviewsTotal: number;
  reached: boolean;
  // Whether today's limit of new cards is lifted, and whether lifting it would give more cards.
  lifted: boolean;
  canLift: boolean;
  locale: Locale;
};

export function TodaysGoal({
  newCardsPerDay,
  introducedToday,
  reviewsDone,
  reviewsTotal,
  reached,
  lifted,
  canLift,
  locale,
}: TodaysGoalProps) {
  const t = dictionary(locale).goal;
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
    setSelected(presetId(saved) ? saved : null);
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
    // On mist every day. A reached goal says so in a small yellow pill, the card's one yellow.
    <section className="flex flex-col gap-4 rounded-2xl bg-mist p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {t.heading}
          {reached && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow px-2.5 py-0.5 text-xs font-semibold motion-safe:animate-pop">
              <Icon name="check" size={12} />
              {t.reached}
            </span>
          )}
        </h2>
        <button
          onClick={open}
          aria-label={t.editLabel}
          className="-mr-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <GearIcon />
          {t.edit}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {lifted ? (
          // Without a limit there's nothing to fill, so the bar is full and shows the count.
          <Progress
            label={t.newWords}
            done={1}
            total={1}
            value={`${introducedToday} · ${t.noLimit}`}
            empty={t.nothingToReview}
          />
        ) : (
          saved > 0 && (
            <Progress
              label={t.newWords}
              done={Math.min(introducedToday, saved)}
              total={saved}
              empty={t.nothingToReview}
            />
          )
        )}
        <Progress
          label={t.cardsReviewed}
          done={reviewsDone}
          total={reviewsTotal}
          empty={t.nothingToReview}
        />
      </div>

      {lifted ? (
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-ivory px-3 py-1 text-sm font-semibold">
          <Icon name="clock" size={16} />
          {t.liftedUntilMidnight}
        </span>
      ) : (
        reached && canLift && <LiftLimit label={t.keepLearning} locale={locale} />
      )}

      <BottomSheet ref={sheet} label={t.sheetTitle}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">{t.sheetTitle}</h2>
          <button
            onClick={() => sheet.current?.close()}
            aria-label={t.close}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <PaceOptions selected={selected} onSelect={setSelected} locale={locale} />

        <p className="text-sm text-muted">{t.note}</p>

        {error && (
          <p aria-live="polite" className="text-sm text-danger">
            {t.notSaved(error)}
          </p>
        )}

        <button
          onClick={save}
          disabled={selected === null || saving}
          className="w-full rounded-full bg-accent px-6 py-4 text-lg font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t.saving : t.save}
        </button>
      </BottomSheet>
    </section>
  );
}

type ProgressProps = {
  label: string;
  done: number;
  total: number;
  empty: string;
  // Shown instead of "done / total", such as "12 · ohne Limit".
  value?: string;
};

function Progress({ label, done, total, empty, value }: ProgressProps) {
  const percent = total === 0 ? 0 : Math.min(100, (done / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-muted">{label}</span>
        <strong className="tabular-nums">{value ?? (total === 0 ? empty : `${done} / ${total}`)}</strong>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-ivory"
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function GearIcon() {
  return <Icon name="gear" size={16} />;
}
