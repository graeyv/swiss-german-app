"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import type { Cheer } from "@/lib/flashcards/cheers";
import { dictionary, type Locale } from "@/lib/i18n";
import type { TodaysGoal } from "./actions";
import { LiftLimit } from "./lift-limit";

type SessionEndProps = {
  cheer: Cheer | null;
  newLearned: number;
  reviewed: number;
  // Today's goal, when this session reached it, to celebrate it. Null otherwise.
  goal: TodaysGoal | null;
  backHref: string;
  backLabel: string;
  // Whether lifting today's limit would bring more new cards of this topic.
  canLift: boolean;
  locale: Locale;
};

// The end of a session. It stays calm: a check on mist that draws itself, the cheer, and the
// numbers counting up. A session that reaches today's goal gets a moment: a larger yellow circle
// springs in with a ring and two waves of dots in the palette's colours, then the goal and this
// week, today's day popping in last. With reduced motion, everything shows as it ends up. See
// DESIGN.md.
export function SessionEnd({
  cheer,
  newLearned,
  reviewed,
  goal,
  backHref,
  backLabel,
  canLift,
  locale,
}: SessionEndProps) {
  const texts = dictionary(locale);
  const t = texts.session;

  // A short buzz for the goal, on phones that allow it. iPhones don't let websites vibrate.
  useEffect(() => {
    if (goal && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(30);
  }, [goal]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-4">
        {goal ? (
          <span className="relative flex size-24 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-yellow motion-safe:animate-ring motion-reduce:hidden"
              style={{ animationDelay: "0.3s" }}
            />
            <Burst />
            <span className="relative flex size-24 items-center justify-center rounded-full bg-yellow motion-safe:animate-spring-in">
              <DrawnCheck size="size-11" />
            </span>
          </span>
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-mist motion-safe:animate-pop">
            <DrawnCheck size="size-9" />
          </span>
        )}
        {cheer && (
          <h1
            lang="gsw"
            className="text-center text-4xl font-bold tracking-tight motion-safe:animate-pop"
            style={{ animationDelay: "0.2s" }}
          >
            {cheer}
          </h1>
        )}
        {goal && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-sm font-semibold motion-safe:animate-rise"
            style={{ animationDelay: "0.4s" }}
          >
            <Icon name="check" size={16} />
            {t.goalReached}
          </span>
        )}
      </div>

      {newLearned + reviewed > 0 && (
        <div
          className="grid auto-cols-fr grid-flow-col rounded-3xl bg-mist motion-safe:animate-rise"
          style={{ animationDelay: "0.5s" }}
        >
          {newLearned > 0 && <Stat value={newLearned} label={t.newWordsLearned(newLearned)} />}
          {reviewed > 0 && <Stat value={reviewed} label={t.wordsReviewed(reviewed)} />}
        </div>
      )}

      {goal && <Week goal={goal} locale={locale} />}

      <div className="flex flex-col gap-3">
        <ButtonLink href={backHref}>{t.backTo(backLabel)}</ButtonLink>
        {canLift && <LiftLimit label={texts.goal.liftLimit} locale={locale} variant="secondary" />}
      </div>
    </main>
  );
}

// One number of the session, counting up from zero.
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center px-4 py-4 text-center">
      <span className="text-3xl font-bold tabular-nums">
        <CountUp value={value} delay={600} />
      </span>
      <span className="text-sm text-teal-soft">{label}</span>
    </span>
  );
}

// A number counting up from zero to its value, once, over about 0.8 s, slowing down at the end.
// With reduced motion, it shows the value at once.
function CountUp({ value, delay }: { value: number; delay: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const progress = still ? 1 : Math.min(1, Math.max(0, (now - start) / 800));
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay]);
  return <>{shown}</>;
}

// A check drawn as a line, so it can draw itself.
function DrawnCheck({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        className="motion-safe:animate-draw"
        style={{ animationDelay: "0.3s" }}
      />
    </svg>
  );
}

// Fourteen dots in yellow, sage and teal flying out from the circle once, in two waves.
const DOTS = Array.from({ length: 14 }, (_, index) => ({
  angle: index * (360 / 14) + (index % 2) * 9,
  distance: [70, 92, 80][index % 3],
  colour: ["bg-yellow", "bg-sage", "bg-teal"][index % 3],
  size: ["size-2.5", "size-1.5", "size-2"][index % 3],
  delay: index % 2 ? 0.38 : 0.25,
}));

function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
      {DOTS.map((dot, index) => (
        <span
          key={index}
          className={`absolute top-1/2 left-1/2 rounded-full opacity-0 motion-safe:animate-burst ${dot.colour} ${dot.size}`}
          style={
            {
              "--angle": `${dot.angle}deg`,
              "--distance": `-${dot.distance}px`,
              animationDelay: `${dot.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

// This week as a circle per day: days with practice teal with a check, today yellow and popping in
// last, the others mist. Below, the streak.
function Week({ goal, locale }: { goal: TodaysGoal; locale: Locale }) {
  const texts = dictionary(locale);
  return (
    <div className="flex flex-col items-center gap-2 motion-safe:animate-rise" style={{ animationDelay: "0.9s" }}>
      <ol aria-label={texts.profile.streak(goal.streak)} className="flex gap-1.5">
        {texts.session.weekdays.map((day, index) => {
          const today = index === goal.week.today;
          const practised = goal.week.days[index] && !today;
          return (
            <li key={index} className="flex flex-col items-center gap-1">
              <span
                className={`flex size-8 items-center justify-center rounded-full ${
                  today ? "bg-yellow motion-safe:animate-spring-in" : practised ? "bg-teal text-ivory" : "bg-mist"
                }`}
                style={today ? { animationDelay: "1.25s" } : undefined}
              >
                {(today || practised) && <Icon name="check" size={16} />}
              </span>
              <span aria-hidden className={`text-xs font-semibold ${today ? "text-teal" : "text-teal-soft"}`}>
                {day}
              </span>
            </li>
          );
        })}
      </ol>
      <span className="text-sm font-semibold">{texts.profile.streak(goal.streak)}</span>
    </div>
  );
}
