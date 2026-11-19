"use client";

import { Icon, type IconName } from "@/app/ui/icons";
import { PRESETS } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";

// The pace recommended to everyone, as there's no question about the learner's level.
export const RECOMMENDED_PACE = "steady";

type PaceStepProps = {
  locale: Locale;
  // The dialect's name, such as "Berndeutsch", for what Learn teaches.
  dialectName: string;
  // New cards a day chosen.
  newCardsPerDay: number;
  onChoose: (newCardsPerDay: number) => void;
};

const TAB_ICONS: Record<"learn" | "practice" | "talk", IconName> = { learn: "learn", practice: "practice", talk: "talk" };

// Where one word's reviews sit on the line, as an example of the gaps growing; the labels take
// turns below and above it, so the close first ones have room.
const REVIEW_POSITIONS = [0, 14, 31, 56, 100];

// The last screen: how Hoi is built up, in its three main tabs, and how words come back just
// before they'd be forgotten, both only informing, as plain text. Then the one thing to choose,
// set apart as cards with check circles: how many new words a day. See DESIGN.md.
export function PaceStep({ locale, dialectName, newCardsPerDay, onChoose }: PaceStepProps) {
  const texts = dictionary(locale);
  const t = texts.onboarding.pace;

  return (
    <>
      <h1 className="text-title leading-tight font-bold">{t.heading}</h1>

      <ul className="flex flex-col gap-4">
        {t.tabs.map((tab) => (
          <li key={tab.id} className="flex items-start gap-4">
            <Icon name={TAB_ICONS[tab.id]} size={28} className="mt-0.5 shrink-0 text-teal-soft" />
            <span className="flex flex-col gap-0.5">
              <span className="text-body font-bold">{texts.nav[tab.id === "talk" ? "conversations" : tab.id]}</span>
              <span className="text-caption text-teal-soft">{tab.text(dialectName)}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-body font-bold">
          <Icon name="again" size={20} className="text-teal-soft" />
          {t.remember.title}
        </h2>
        <p className="text-caption text-teal-soft">{t.remember.text}</p>
        <Timeline labels={t.remember.reviews} />
      </section>

      <section className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-heading font-bold">{t.choose}</h2>
          <p className="text-caption text-teal-soft">{t.chooseNote}</p>
        </div>
        <div role="group" aria-label={t.choose} className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const selected = newCardsPerDay === preset.newCardsPerDay;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChoose(preset.newCardsPerDay)}
                className={`relative flex flex-col items-center gap-1 rounded-3xl px-2 pt-4 pb-3 text-center transition-[background-color,transform] active:scale-[0.97] ${
                  selected ? "bg-sage" : "bg-mist"
                }`}
              >
                {preset.id === RECOMMENDED_PACE && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    {t.recommended}
                  </span>
                )}
                <span className="text-title leading-none font-bold tabular-nums">{preset.newCardsPerDay}</span>
                <span className="text-caption">{t.perDay}</span>
                <span className="text-caption font-semibold">{texts.goal.presets[preset.id]}</span>
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected ? "bg-teal text-ivory" : "bg-ivory"
                  }`}
                >
                  {selected && <Icon name="check" size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="flex items-center justify-center gap-2 text-caption text-teal-soft">
          <Icon name="swap" size={16} className="shrink-0" />
          {t.changeLater}
        </p>
      </section>
    </>
  );
}

// One word's reviews on a line, the gaps growing, the dots popping in one after another. Still
// with reduced motion.
function Timeline({ labels }: { labels: readonly string[] }) {
  return (
    <div aria-hidden className="relative mx-2 h-16">
      <span className="absolute top-[31px] right-2 left-2 h-0.5 rounded-full bg-sage-light" />
      {labels.map((label, index) => {
        const edge =
          index === 0 ? "items-start" : index === labels.length - 1 ? "items-end -translate-x-full" : "items-center -translate-x-1/2";
        const above = index % 2 === 1;
        return (
          <span
            key={label}
            className={`absolute flex gap-1.5 motion-safe:animate-pop ${edge} ${above ? "bottom-[24px] flex-col-reverse" : "top-[24px] flex-col"}`}
            style={{ left: `${REVIEW_POSITIONS[index]}%`, animationDelay: `${0.15 + index * 0.12}s` }}
          >
            <span className="my-0.5 size-3 rounded-full bg-teal" />
            <span className="text-xs whitespace-nowrap">{label}</span>
          </span>
        );
      })}
    </div>
  );
}
