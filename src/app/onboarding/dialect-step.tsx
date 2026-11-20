"use client";

import { useRef } from "react";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button } from "@/app/ui/button";
import { DialectChoices } from "@/app/ui/dialect-choices";
import { Icon } from "@/app/ui/icons";
import { dictionary, type Locale } from "@/lib/i18n";

type DialectStepProps = {
  locale: Locale;
  chosen: string | null;
  onChoose: (dialect: string) => void;
};

// The second question: which dialect to learn. "Nicht sicher?" explains which to pick. See
// DESIGN.md.
export function DialectStep({ locale, chosen, onChoose }: DialectStepProps) {
  const t = dictionary(locale).onboarding.dialect;
  const sheet = useRef<HTMLDialogElement>(null);

  return (
    <>
      <h1 className="text-title leading-tight font-bold">{t.question}</h1>

      <DialectChoices locale={locale} chosen={chosen} onChoose={onChoose} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          className="flex min-h-11 items-center gap-2 self-center rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
        >
          <Icon name="question" size={16} />
          {t.notSure}
        </button>
        <p className="flex items-center justify-center gap-2 text-caption text-teal-soft">
          <Icon name="swap" size={16} className="shrink-0" />
          {t.switchLater}
        </p>
      </div>

      <BottomSheet ref={sheet} label={t.help.title}>
        <div className="flex flex-col gap-5">
          <h2 className="text-heading font-bold">{t.help.title}</h2>
          <ul className="flex flex-col gap-3">
            {t.help.points.map((point) => (
              <li key={point} className="flex gap-3 text-body">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-teal-soft" />
                {point}
              </li>
            ))}
          </ul>
          <Button onClick={() => sheet.current?.close()}>{t.help.understood}</Button>
        </div>
      </BottomSheet>
    </>
  );
}
