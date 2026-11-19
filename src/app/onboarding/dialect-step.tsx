"use client";

import { useRef } from "react";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button } from "@/app/ui/button";
import { ComingSoonPill } from "@/app/ui/coming-soon-pill";
import { Icon } from "@/app/ui/icons";
import { DIALECT_OPTIONS } from "@/lib/dialects";
import { dictionary, type Locale } from "@/lib/i18n";

type DialectStepProps = {
  locale: Locale;
  chosen: string | null;
  onChoose: (dialect: string) => void;
};

// The second question: which dialect to learn, each with its canton's flag and where it's spoken.
// Dialects not ready yet are inactive and say when they come. "Nicht sicher?" explains which to
// pick. See DESIGN.md.
export function DialectStep({ locale, chosen, onChoose }: DialectStepProps) {
  const t = dictionary(locale).onboarding.dialect;
  const sheet = useRef<HTMLDialogElement>(null);

  return (
    <>
      <h1 className="text-title leading-tight font-bold">{t.question}</h1>

      <div className="flex flex-col gap-3">
        {DIALECT_OPTIONS.map((dialect) => {
          const ready = !dialect.soon;
          const selected = chosen === dialect.id;
          return (
            <button
              key={dialect.id}
              type="button"
              disabled={!ready}
              aria-pressed={ready ? selected : undefined}
              onClick={() => onChoose(dialect.id)}
              className={`flex items-center gap-4 rounded-3xl p-4 text-left transition-[background-color,transform] active:scale-[0.98] disabled:active:scale-100 ${
                selected ? "bg-sage" : "bg-mist"
              }`}
            >
              {/* The canton's flag, square like the cantons' own, with rounded corners. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- a small, local SVG */}
              <img src={dialect.flag} alt="" className="size-12 shrink-0 rounded-xl" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span lang="gsw" className={`text-body font-bold ${ready ? "" : "text-teal-soft"}`}>
                  {dialect.name}
                </span>
                {dialect.soon ? (
                  <ComingSoonPill label={t.soon[dialect.soon]} />
                ) : (
                  <span className={`text-caption ${selected ? "" : "text-teal-soft"}`}>{t.regions[dialect.id]}</span>
                )}
              </span>
              {ready && (
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected ? "bg-teal text-ivory" : "bg-ivory"
                  }`}
                >
                  {selected && <Icon name="check" size={16} />}
                </span>
              )}
            </button>
          );
        })}
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
