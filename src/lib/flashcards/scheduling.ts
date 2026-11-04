import { DefaultScheduler, type Grade } from "ts-fsrs";
import { en } from "@/lib/i18n/en";

type IntervalUnits = typeof en.intervals;

export const FSRS_MODEL = "FSRS-6";

const schedulerPromise = DefaultScheduler({
  version: FSRS_MODEL,
  desiredRetention: 0.9,
  enableFuzz: true,
});

// Mirrors the FSRS columns of public.review_items.
export type CardRow = {
  state: number;
  schedule_status: string;
  stability: number;
  difficulty: number;
  due_at: string;
  last_review_at: string | null;
  reps: number;
  lapses: number;
  learning_step: number;
  scheduled_days: number;
};

export type Previews = Record<Grade, string>;

async function restoreCard(row: CardRow | null, cardId: string, now: Date) {
  const scheduler = await schedulerPromise;
  // A word queued by a lesson has a row, but no rating yet.
  if (!row || row.state === 0) {
    return { ...scheduler.newCard({ now }), cardId };
  }
  return {
    ...scheduler.newCard({ now }),
    cardId,
    state: row.state,
    scheduleStatus: row.schedule_status,
    stability: row.stability,
    difficulty: row.difficulty,
    dueAt: new Date(row.due_at),
    lastReviewAt: row.last_review_at ? new Date(row.last_review_at) : null,
    reps: row.reps,
    lapses: row.lapses,
    learningStep: row.learning_step,
    scheduledDays: row.scheduled_days,
  } as ReturnType<Awaited<typeof schedulerPromise>["newCard"]>;
}

// Units come from the interface language, such as "min" in English or "Min." in German.
export function formatInterval(milliseconds: number, units: IntervalUnits = en.intervals) {
  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} ${units.minutes}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${units.hours}`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} ${units.days}`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months} ${units.months}`;
  return `${Math.round(days / 365)} ${units.years}`;
}

export async function previewIntervals(
  row: CardRow | null,
  cardId: string,
  now: Date,
  units: IntervalUnits = en.intervals,
): Promise<Previews> {
  const scheduler = await schedulerPromise;
  const card = await restoreCard(row, cardId, now);
  const previews = {} as Previews;
  for (const { grade, card: next } of scheduler.preview({ card, now })) {
    previews[grade] = formatInterval(next.dueAt.getTime() - now.getTime(), units);
  }
  return previews;
}

// The next card state and the log entry, in the shape the save_review function takes.
export async function scheduleReview(
  row: CardRow | null,
  cardId: string,
  grade: Grade,
  now: Date,
) {
  const scheduler = await schedulerPromise;
  const { card, revlog } = scheduler.review({
    card: await restoreCard(row, cardId, now),
    grade,
    now,
  });

  return {
    card: {
      state: card.state,
      schedule_status: card.scheduleStatus,
      stability: card.stability,
      difficulty: card.difficulty,
      due_at: card.dueAt.toISOString(),
      last_review_at: card.lastReviewAt?.toISOString() ?? null,
      reps: card.reps,
      lapses: card.lapses,
      learning_step: card.learningStep,
      scheduled_days: card.scheduledDays,
    } satisfies CardRow,
    log: {
      rating: revlog.rating,
      reviewed_at: revlog.reviewTime.toISOString(),
      state: revlog.state,
      schedule_status: revlog.scheduleStatus,
      stability: revlog.stability,
      difficulty: revlog.difficulty,
      due_at: revlog.dueAt.toISOString(),
      last_review_at: revlog.lastReviewAt?.toISOString() ?? null,
      learning_step: revlog.learningStep,
      scheduled_days: revlog.scheduledDays,
    },
  };
}
