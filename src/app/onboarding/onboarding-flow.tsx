"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/app/(tabs)/actions";
import { TINTS } from "@/app/(tabs)/flashcards/deck-card";
import { PaceOptions } from "@/app/(tabs)/flashcards/pace-options";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import type { DeckColor } from "@/lib/flashcards/decks";
import { dictionary, type Locale, LOCALES } from "@/lib/i18n";
import { LEVELS, type Level, suggestedPace } from "@/lib/onboarding";
import { finishOnboarding } from "./actions";

type Topic = { code: string; title: string; emoji: string | null; color: DeckColor };

type OnboardingFlowProps = {
  locale: Locale;
  topics: Topic[];
  initialLevel: Level | null;
  initialInterests: string[];
};

const STEPS = ["language", "level", "topics", "pace"] as const;

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-4 text-lg font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

function optionClass(selected: boolean) {
  return `flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
    selected ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent/50"
  }`;
}

// Four short questions, one per screen. Every one can be skipped, and the app has a sensible
// default for each.
export function OnboardingFlow({ locale, topics, initialLevel, initialInterests }: OnboardingFlowProps) {
  const t = dictionary(locale).onboarding;
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(initialLevel);
  const [interests, setInterests] = useState<ReadonlySet<string>>(new Set(initialInterests));
  // Null until the learner picks a pace; until then, the one suggested for their level.
  const [pace, setPace] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recommended = suggestedPace(level);
  const recommendedNewCards = PRESETS.find((preset) => preset.id === recommended)!.newCardsPerDay;
  const current = STEPS[step];
  const next = () => setStep((value) => Math.min(value + 1, STEPS.length - 1));

  function toggleTopic(code: string) {
    const updated = new Set(interests);
    if (updated.has(code)) updated.delete(code);
    else updated.add(code);
    setInterests(updated);
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      // Only returns when saving failed: success redirects to the flashcards.
      const result = await finishOnboarding({
        level,
        interests: [...interests],
        newCardsPerDay: pace ?? recommendedNewCards,
      });
      setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            aria-label={t.back}
            className="-ml-2 flex size-11 items-center justify-center text-xl text-muted hover:text-foreground"
          >
            ‹
          </button>
        ) : (
          <span />
        )}
        <div role="progressbar" aria-label={t.step(step + 1, STEPS.length)} aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} className="flex justify-center gap-2">
          {STEPS.map((name, index) => (
            <span
              key={name}
              className={`h-2 rounded-full transition-all ${index === step ? "w-6 bg-accent" : index < step ? "w-2 bg-accent/50" : "w-2 bg-line"}`}
            />
          ))}
        </div>
        {current !== "pace" ? (
          <button onClick={next} className="min-h-11 text-sm font-semibold text-muted hover:text-foreground">
            {t.skip}
          </button>
        ) : (
          <span />
        )}
      </header>

      <section className="flex flex-1 flex-col gap-6">
        {current === "language" && (
          <>
            <Heading title={t.language.heading} intro={t.language.intro} />
            <div className="flex flex-col gap-3">
              {LOCALES.map((option) => (
                <button
                  key={option}
                  aria-pressed={option === locale}
                  disabled={pending}
                  // Switching straight away shows the rest of onboarding in that language.
                  onClick={() => startTransition(async () => void (await setLocale(option)))}
                  className={optionClass(option === locale)}
                >
                  <span className="text-lg font-semibold">{dictionary(option).languageName}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {current === "level" && (
          <>
            <Heading title={t.level.heading} />
            <div className="flex flex-col gap-3">
              {LEVELS.map((option) => (
                <button
                  key={option}
                  aria-pressed={option === level}
                  onClick={() => setLevel(option)}
                  className={optionClass(option === level)}
                >
                  <span className="flex flex-col">
                    <strong className="font-semibold">{t.level.options[option].label}</strong>
                    <span className="text-sm text-muted">{t.level.options[option].hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {current === "topics" && (
          <>
            <Heading title={t.topics.heading} intro={t.topics.intro} />
            <div className="grid grid-cols-2 gap-3">
              {topics.map((topic) => {
                const selected = interests.has(topic.code);
                return (
                  <button
                    key={topic.code}
                    aria-pressed={selected}
                    onClick={() => toggleTopic(topic.code)}
                    className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${TINTS[topic.color]} ${
                      selected ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <span aria-hidden className="flex size-12 items-center justify-center rounded-xl bg-surface/70 text-2xl">
                      {topic.emoji ?? "📚"}
                    </span>
                    <strong className="leading-snug font-semibold">{topic.title}</strong>
                    {selected && (
                      <span aria-hidden className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {current === "pace" && (
          <>
            <Heading title={t.pace.heading} />
            <ul className="flex flex-col gap-3">
              {t.pace.points.map((point) => (
                <li key={point.icon} className="flex items-start gap-3">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight text-xl">
                    {point.icon}
                  </span>
                  <span className="pt-2">{point.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold">{t.pace.choose}</h2>
              <PaceOptions
                selected={pace ?? recommendedNewCards}
                onSelect={setPace}
                locale={locale}
                recommended={recommended}
                recommendedLabel={t.pace.recommended}
              />
            </div>
          </>
        )}
      </section>

      <footer className="flex flex-col gap-3">
        {error && (
          <p aria-live="polite" className="text-sm text-danger">
            {t.pace.notSaved(error)}
          </p>
        )}
        {current === "pace" ? (
          <button onClick={finish} disabled={pending} className={primaryButton}>
            {pending ? t.pace.saving : t.pace.finish}
          </button>
        ) : (
          <button onClick={next} disabled={pending} className={primaryButton}>
            {t.next}
          </button>
        )}
      </footer>
    </main>
  );
}

function Heading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {intro && <p className="text-muted">{intro}</p>}
    </div>
  );
}
