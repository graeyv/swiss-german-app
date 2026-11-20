"use client";

import { ComingSoonPill } from "@/app/ui/coming-soon-pill";
import { Icon } from "@/app/ui/icons";
import { DIALECT_OPTIONS } from "@/lib/dialects";
import { dictionary, type Locale } from "@/lib/i18n";

type DialectChoicesProps = {
  locale: Locale;
  chosen: string | null;
  disabled?: boolean;
  onChoose: (dialect: string) => void;
};

// The dialects to learn, each with its canton's flag and where it's spoken. Dialects not ready yet
// are inactive and say when they come. Used in onboarding and the profile. See DESIGN.md.
export function DialectChoices({ locale, chosen, disabled = false, onChoose }: DialectChoicesProps) {
  const t = dictionary(locale).onboarding.dialect;

  return (
    <div className="flex flex-col gap-3">
      {DIALECT_OPTIONS.map((dialect) => {
        const ready = !dialect.soon;
        const selected = chosen === dialect.id;
        return (
          <button
            key={dialect.id}
            type="button"
            disabled={!ready || disabled}
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
  );
}
