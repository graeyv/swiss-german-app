"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/app/(tabs)/actions";
import { Button } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { defaultDialect } from "@/lib/dialects";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";
import { finishOnboarding } from "./actions";
import { DialectStep } from "./dialect-step";
import { PaceStep, RECOMMENDED_PACE } from "./pace-step";
import { TrackStep, type TrackModule } from "./track-step";

type OnboardingFlowProps = {
  locale: Locale;
  // Each track's modules, for the first question.
  tracks: Record<Locale, TrackModule[]>;
};

const STEPS = ["track", "dialect", "pace"] as const;

// Three short screens: the track, the dialect, then how Hoi works with the pace. Each has to be
// answered, none can be skipped: the track waits for an answer, the dialect starts as the only one
// ready while there's just one, and the pace as the recommended one.
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
  const next = () => setStep((value) => Math.min(value + 1, STEPS.length - 1));

  function finish() {
    setError(null);
    startTransition(async () => {
      // Only returns when saving failed: success redirects to the flashcards.
      const result = await finishOnboarding({ dialect, newCardsPerDay });
      setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
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
        <span />
      </header>

      <section className="flex flex-1 flex-col gap-6">
        {current === "track" && (
          <TrackStep
            modules={tracks}
            chosen={track}
            recommended={recommendedTrack}
            pending={pending}
            onChoose={(choice, recommended) => {
              setTrack(choice);
              if (recommended) setRecommendedTrack(choice);
              // Switching straight away shows the rest of the onboarding in that language.
              if (choice !== locale) startTransition(async () => void (await setLocale(choice)));
            }}
          />
        )}
        {current === "dialect" && <DialectStep locale={locale} chosen={dialect} onChoose={setDialect} />}
        {current === "pace" && (
          <PaceStep
            locale={locale}
            dialectName={texts.lesson.dialects[dialect ?? "be"] ?? texts.lesson.dialects.be}
            newCardsPerDay={newCardsPerDay}
            onChoose={setNewCardsPerDay}
          />
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
          <Button onClick={next} disabled={pending || (current === "track" && !track)}>
            {t.next}
          </Button>
        )}
      </footer>
    </main>
  );
}
