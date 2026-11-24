"use client";

import { useRef } from "react";
import { withAppName } from "@/app/ui/app-name";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button } from "@/app/ui/button";
import { Icon, type IconName, isIconName } from "@/app/ui/icons";
import { dictionary, type Locale } from "@/lib/i18n";

// A module of a track, to show the path an answer leads to.
export type TrackModule = { title: string; icon: string };

type TrackStepProps = {
  // The language the question is asked in, which the switch at the top changes.
  locale: Locale;
  // Each track's modules, by its language, titled in the language of the question.
  modules: Record<Locale, TrackModule[]>;
  // The answer chosen, or null before one is.
  chosen: Locale | null;
  // The answer the quick test pointed to, once it's done.
  recommended: Locale | null;
  pending: boolean;
  onChoose: (track: Locale, recommended?: boolean) => void;
};

// The answers in the order shown, each with its icon: German speakers first, as most learners are.
const ANSWERS: { track: Locale; icon: IconName }[] = [
  { track: "de", icon: "speaking" },
  { track: "en", icon: "globe" },
];

// The first question, which sets the learner's track, and with it the app's language: whether
// they understand German well, as a first language or not. Everything on it is in one language,
// which the switch in the header changes. The chosen answer unfolds its path. For the unsure, a
// quick test of one sentence picks the answer, marked as recommended. See DESIGN.md.
export function TrackStep({ locale, modules, chosen, recommended, pending, onChoose }: TrackStepProps) {
  const sheet = useRef<HTMLDialogElement>(null);
  const texts = dictionary(locale).onboarding;
  const t = texts.track;

  function answerTest(understood: boolean) {
    onChoose(understood ? "de" : "en", true);
    sheet.current?.close();
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-title leading-tight font-bold">{t.question}</h1>
        <p className="text-body text-teal-soft">{withAppName(t.intro)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {ANSWERS.map(({ track, icon }) => (
          <Answer
            key={track}
            locale={locale}
            track={track}
            icon={icon}
            selected={chosen === track}
            recommended={recommended === track}
            modules={modules[track]}
            disabled={pending}
            onSelect={() => onChoose(track)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          className="flex min-h-11 items-center gap-2 self-center rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
        >
          <Icon name="question" size={16} />
          {t.notSure}
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-caption text-teal-soft">
          <Icon name="swap" size={16} className="shrink-0" />
          {t.switchLater}
        </p>
      </div>

      <BottomSheet ref={sheet} label={t.test.heading}>
        <div className="flex flex-col gap-5">
          <h2 className="text-heading font-bold">{t.test.heading}</h2>
          <div className="flex flex-col gap-4 rounded-3xl bg-mist p-5">
            <p lang="de" className="text-subtitle leading-snug font-semibold">
              «{t.test.sentence}»
            </p>
            <p className="text-caption text-teal-soft">{t.test.question}</p>
            <div className="grid grid-cols-2 gap-3">
              <TestAnswer icon="check" onClick={() => answerTest(true)}>
                {t.test.yes}
              </TestAnswer>
              <TestAnswer onClick={() => answerTest(false)}>{t.test.no}</TestAnswer>
            </div>
          </div>
          <Button variant="secondary" onClick={() => sheet.current?.close()}>
            {texts.back}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

// One answer: a card on mist, on sage with a check once chosen, unfolding the path it leads to.
// The quick test's answer carries a yellow tag on its edge.
function Answer({
  locale,
  track,
  icon,
  selected,
  recommended,
  modules,
  disabled,
  onSelect,
}: {
  locale: Locale;
  track: Locale;
  icon: IconName;
  selected: boolean;
  recommended: boolean;
  modules: TrackModule[];
  disabled: boolean;
  onSelect: () => void;
}) {
  const t = dictionary(locale).onboarding.track;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex flex-col gap-4 rounded-3xl p-5 text-left transition-[background-color,transform] active:scale-[0.98] disabled:active:scale-100 ${
        selected ? "bg-sage" : "bg-mist"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 right-5 rounded-full bg-yellow px-2.5 py-0.5 text-xs font-semibold">
          {t.recommended}
        </span>
      )}
      <span className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ivory">
          <Icon name={icon} size={24} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-bold">{t.answers[track].answer}</span>
          <span className={`text-caption ${selected ? "" : "text-teal-soft"}`}>
            {track === "de" ? `${t.germanNote} ${t.answers.de.what}` : t.answers[track].what}
          </span>
        </span>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            selected ? "bg-teal text-ivory" : "bg-ivory"
          }`}
        >
          {selected && <Icon name="check" size={16} />}
        </span>
      </span>
      {selected && (
        <span className="flex flex-col gap-3 rounded-2xl bg-ivory p-4 motion-safe:animate-rise">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-caption font-semibold tracking-[0.08em] uppercase">{t.path}</span>
            <span className="text-caption text-teal-soft">{t.modules(modules.length)}</span>
          </span>
          <ol className="flex flex-col gap-2.5">
            {modules.map((module) => (
              <li key={module.title} className="flex items-center gap-3">
                {isIconName(module.icon) && <Icon name={module.icon} size={20} className="text-teal-soft" />}
                <span className="text-body">{module.title}</span>
              </li>
            ))}
          </ol>
        </span>
      )}
    </button>
  );
}

function TestAnswer({
  icon,
  onClick,
  children,
}: {
  icon?: IconName;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ivory px-4 text-body font-semibold transition-transform active:scale-95"
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}
