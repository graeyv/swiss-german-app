"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/app/(tabs)/actions";
import { Button } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { defaultDialect, DIALECT_OPTIONS } from "@/lib/dialects";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";
import { finishOnboarding } from "./actions";
import { DialectStep } from "./dialect-step";
import { HowStep, PaceStep, RECOMMENDED_PACE } from "./pace-step";
import { TrackStep, type TrackModule } from "./track-step";

type OnboardingFlowProps = {
  locale: Locale;
  // Each track's modules, titled in the learner's language, for the first question.
  tracks: Record<Locale, TrackModule[]>;
};

const STEPS = ["track", "dialect", "how", "pace"] as const;

// Four short screens: the track, the dialect, how Hoi works, then the pace. Each question has to
// be answered, none can be skipped: the track waits for an answer, the dialect starts as the only
// one ready while there's just one, and the pace as the recommended one.
export function OnboardingFlow({ locale, tracks }: OnboardingFlowProps) {
  const texts = dictionary(locale);
  const t = texts.onboarding;
  const [step, setStep] = useState(0);
  // The track answered, and the one the quick test recommended, if it was done.
  const [track, setTrack] = useState<Locale | null>(null);
  const [recommendedTrack, setRecommendedTrack] = useState<Locale | null>(null);
  const [dialect, setDialect] = useState<string | null>(defaultDialect);
  const [newCardsPerDay, setNewCardsPerDay] = useState<number>(
    PRESETS.find((preset) => preset.id === RECOMMENDED_PACE)!.newCardsPerDay,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = STEPS[step];
  const other: Locale = locale === "de" ? "en" : "de";
  const next = () => setStep((value) => Math.min(value + 1, STEPS.length - 1));

  // The language the onboarding is in, changed from the first question's switch.
  function switchLanguage() {
    setError(null);
    startTransition(async () => {
      const result = await setLocale(other);
      if (result.error) setError(result.error);
    });
  }

  // On from the first question: the track sets Hoi's language, so the rest is in the track's.
  function afterTrack() {
    if (!track || track === locale) return next();
    setError(null);
    startTransition(async () => {
      const result = await setLocale(track);
      if (result.error) setError(result.error);
      else startTransition(next);
    });
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      // Only returns when saving failed: success redirects to Lernen.
      const result = await finishOnboarding({ dialect, newCardsPerDay });
      setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            aria-label={t.back}
            className="-ml-2 flex size-11 items-center justify-center transition-transform active:scale-90"
          >
            <Icon name="back" size={28} />
          </button>
        ) : (
          <span />
        )}
        <div
          role="progressbar"
          aria-label={t.step(step + 1, STEPS.length)}
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          className="flex gap-1.5"
        >
          {STEPS.map((name, index) => (
            <span key={name} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? "bg-teal" : "bg-mist"}`} />
          ))}
        </div>
        {/* The language, as on the start page: named in the other language itself, so it's found
            by those who need it. Only on the first question; after it, the track sets the language.
            Kept, hidden, on the others so the progress bar doesn't change width. */}
        <button
          type="button"
          lang={other}
          onClick={switchLanguage}
          disabled={pending}
          aria-hidden={step > 0 || undefined}
          tabIndex={step > 0 ? -1 : undefined}
          className={`-mr-3 flex min-h-11 items-center gap-1.5 px-3 text-caption font-semibold text-teal-soft transition-transform active:scale-95 ${
            step > 0 ? "invisible" : ""
          }`}
        >
          <Icon name="globe" size={16} />
          {dictionary(other).languageName}
        </button>
      </header>

      <section className="flex flex-1 flex-col gap-6">
        {current === "track" && (
          <TrackStep
            locale={locale}
            modules={tracks}
            chosen={track}
            recommended={recommendedTrack}
            pending={pending}
            onChoose={(choice, recommended) => {
              setTrack(choice);
              if (recommended) setRecommendedTrack(choice);
            }}
          />
        )}
        {current === "dialect" && <DialectStep locale={locale} chosen={dialect} onChoose={setDialect} />}
        {current === "how" && (
          // The dialect by its own name, as chosen on the screen before.
          <HowStep
            locale={locale}
            dialectName={DIALECT_OPTIONS.find(({ id }) => id === dialect)?.name ?? DIALECT_OPTIONS[0].name}
          />
        )}
        {current === "pace" && (
          <PaceStep locale={locale} newCardsPerDay={newCardsPerDay} onChoose={setNewCardsPerDay} />
        )}
      </section>

      <footer className="sticky bottom-0 -mx-6 flex flex-col gap-3 bg-ivory px-6 pt-3">
        {error && (
          <p aria-live="polite" className="text-caption text-brick">
            {t.pace.notSaved(error)}
          </p>
        )}
        {current === "pace" ? (
          <Button onClick={finish} disabled={pending}>
            {pending ? t.pace.saving : t.pace.finish}
          </Button>
        ) : (
          <Button onClick={current === "track" ? afterTrack : next} disabled={pending || (current === "track" && !track)}>
            {t.next}
          </Button>
        )}
      </footer>
    </main>
  );
}
