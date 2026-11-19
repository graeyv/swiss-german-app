"use client";

import { useRef } from "react";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button } from "@/app/ui/button";
import { Icon, type IconName, isIconName } from "@/app/ui/icons";
import { dictionary, type Locale } from "@/lib/i18n";

// A module of a track, to show the path an answer leads to.
export type TrackModule = { title: string; icon: string };

type TrackStepProps = {
  // Each track's modules, by its language.
  modules: Record<Locale, TrackModule[]>;
  // The answer chosen, or null before one is.
  chosen: Locale | null;
  // The answer the quick test pointed to, once it's done.
  recommended: Locale | null;
  pending: boolean;
  onChoose: (track: Locale, recommended?: boolean) => void;
};

// The answers in the order shown, each with its icon: German speakers first, as most learners are.
const ANSWERS: { locale: Locale; icon: IconName }[] = [
  { locale: "de", icon: "speaking" },
  { locale: "en", icon: "globe" },
];

// The first question, which sets the learner's track, and with it the app's language: whether
// they speak German. It's asked in German and English, as the learner may read either, and each
// answer is in its own language. The chosen answer unfolds its path. For the unsure, a quick test
// of one sentence picks the answer, marked as recommended. See DESIGN.md.
export function TrackStep({ modules, chosen, recommended, pending, onChoose }: TrackStepProps) {
  const sheet = useRef<HTMLDialogElement>(null);
  const de = dictionary("de").onboarding.track;
  const en = dictionary("en").onboarding.track;

  function answerTest(understood: boolean) {
    onChoose(understood ? "de" : "en", true);
    sheet.current?.close();
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 lang="de" className="text-title leading-tight font-bold">
          {de.question}
        </h1>
        <p lang="en" className="text-subtitle font-semibold text-teal-soft">
          {en.question}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ANSWERS.map(({ locale, icon }) => (
          <Answer
            key={locale}
            locale={locale}
            icon={icon}
            selected={chosen === locale}
            recommended={recommended === locale}
            modules={modules[locale]}
            disabled={pending}
            onSelect={() => onChoose(locale)}
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
          <span lang="de">{de.notSure}</span> · <span lang="en">{en.notSure}</span>
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-caption text-teal-soft">
          <Icon name="swap" size={16} className="shrink-0" />
          <span>
            <span lang="de">{de.switchLater}</span> · <span lang="en">{en.switchLater}</span>
          </span>
        </p>
      </div>

      <BottomSheet ref={sheet} label={`${de.test.heading} · ${en.test.heading}`}>
        <div className="flex flex-col gap-5">
          <h2 className="text-heading font-bold">
            <span lang="de">{de.test.heading}</span> · <span lang="en">{en.test.heading}</span>
          </h2>
          <div className="flex flex-col gap-4 rounded-3xl bg-mist p-5">
            <p lang="de" className="text-subtitle leading-snug font-semibold">
              «{de.test.sentence}»
            </p>
            <p className="text-caption text-teal-soft">
              <span lang="de">{de.test.question}</span> · <span lang="en">{en.test.question}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TestAnswer lang="de" icon="check" onClick={() => answerTest(true)}>
                {de.test.yes}
              </TestAnswer>
              <TestAnswer lang="en" onClick={() => answerTest(false)}>
                {en.test.no}
              </TestAnswer>
            </div>
          </div>
          <Button variant="secondary" onClick={() => sheet.current?.close()}>
            <span lang="de">{dictionary("de").onboarding.back}</span> ·{" "}
            <span lang="en">{dictionary("en").onboarding.back}</span>
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
  icon,
  selected,
  recommended,
  modules,
  disabled,
  onSelect,
}: {
  locale: Locale;
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
      lang={locale}
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
          <span className="text-body font-bold">{t.answer}</span>
          <span className={`text-caption ${selected ? "" : "text-teal-soft"}`}>{t.what}</span>
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
  lang,
  icon,
  onClick,
  children,
}: {
  lang: Locale;
  icon?: IconName;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      lang={lang}
      onClick={onClick}
      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ivory px-4 text-body font-semibold transition-transform active:scale-95"
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}
