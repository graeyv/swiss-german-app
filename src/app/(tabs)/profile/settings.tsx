"use client";

import { type ReactNode, type RefObject, useRef, useState, useTransition } from "react";
import { updateAutoplay, updateCardFront, updateDailyPlan } from "@/app/flashcards/actions";
import { DIALECT_OPTIONS } from "@/lib/dialects";
import { presetId } from "@/lib/flashcards/daily-plan";
import { dictionary, type Locale } from "@/lib/i18n";
import { Icon } from "@/app/ui/icons";
import type { CardFront } from "@/lib/types";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { DialectChoices } from "@/app/ui/dialect-choices";
import { PaceOptions } from "../flashcards/pace-options";
import { setLocale } from "../actions";
import { updateDialect, updateInterests } from "./actions";
import { AudioIcon, DialectIcon, DirectionIcon, LanguageIcon, PaceIcon, TopicsIcon } from "./icons";

// Settings are rows that slide up a sheet to change them. Each sheet saves through a server
// action, which refreshes the page, so the rows always show what's saved.

const primaryButton =
  "min-h-12 w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

type Saving = { error: string | null; saving: boolean; save: (action: () => Promise<{ error?: string }>) => void };

// Runs a save, keeps its error, and closes the sheet once it worked.
function useSave(sheet: RefObject<HTMLDialogElement | null>): Saving {
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  return {
    error,
    saving,
    save(action) {
      setError(null);
      startSaving(async () => {
        const result = await action();
        if (result.error) setError(result.error);
        else sheet.current?.close();
      });
    },
  };
}

type RowProps = { icon: ReactNode; label: string; value: string; onOpen: () => void };

function Row({ icon, label, value, onOpen }: RowProps) {
  return (
    <button
      onClick={onOpen}
      className="flex min-h-14 w-full items-center gap-3 text-left transition-opacity active:opacity-60"
    >
      <span className="text-muted">{icon}</span>
      <span className="font-semibold">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-muted">{value}</span>
      <span aria-hidden className="text-muted">
        ›
      </span>
    </button>
  );
}

type SheetProps = {
  sheet: RefObject<HTMLDialogElement | null>;
  title: string;
  locale: Locale;
  error: string | null;
  children: ReactNode;
};

function Sheet({ sheet, title, locale, error, children }: SheetProps) {
  const t = dictionary(locale).profile;
  return (
    <BottomSheet ref={sheet} label={title}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <button
          onClick={() => sheet.current?.close()}
          aria-label={t.close}
          className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-muted transition-colors hover:text-foreground"
        >
          ✕
        </button>
      </div>
      {children}
      {error && (
        <p aria-live="polite" className="text-sm text-danger">
          {t.notSaved(error)}
        </p>
      )}
    </BottomSheet>
  );
}

type ChoicesProps<Value extends string> = {
  label: string;
  values: readonly Value[];
  current: Value;
  name: (value: Value) => string;
  disabled: boolean;
  onChoose: (value: Value) => void;
};

// One choice from a short list, marked with a check. Choosing one saves it.
function Choices<Value extends string>({
  label,
  values,
  current,
  name,
  disabled,
  onChoose,
}: ChoicesProps<Value>) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      {values.map((value) => (
        <button
          key={value}
          aria-pressed={value === current}
          disabled={disabled}
          onClick={() => onChoose(value)}
          className={`flex min-h-14 items-center justify-between rounded-2xl border-2 px-4 text-left font-semibold transition-colors disabled:opacity-50 ${
            value === current ? "border-accent bg-accent/10" : "border-line hover:border-accent/50"
          }`}
        >
          {name(value)}
          {value === current && (
            <span aria-hidden className="text-accent">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// The tracks in the order shown, German first, as in onboarding's first question.
const TRACKS: Locale[] = ["de", "en"];

// The learner's track, which also sets Hoi's language, so each is named by its language. Each track
// is a card in its own language, as in onboarding. Below, in both languages so that whoever is about to switch can read it: their
// progress stays.
export function TrackSetting({ locale, modules }: { locale: Locale; modules: Record<Locale, number> }) {
  const t = dictionary(locale).profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);

  return (
    <>
      <Row icon={<LanguageIcon />} label={t.track} value={dictionary(locale).languageName} onOpen={() => sheet.current?.showModal()} />
      <Sheet sheet={sheet} title={t.track} locale={locale} error={error}>
        <div role="group" aria-label={t.track} className="flex flex-col gap-3">
          {TRACKS.map((option) => {
            const texts = dictionary(option);
            const selected = option === locale;
            return (
              <button
                key={option}
                type="button"
                lang={option}
                aria-pressed={selected}
                disabled={saving}
                onClick={() => (selected ? sheet.current?.close() : save(() => setLocale(option)))}
                className={`flex items-center gap-4 rounded-3xl p-4 text-left transition-[background-color,transform] active:scale-[0.98] disabled:active:scale-100 ${
                  selected ? "bg-sage" : "bg-mist"
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body font-bold">{texts.languageName}</span>
                  <span className={`text-caption ${selected ? "" : "text-teal-soft"}`}>
                    {texts.onboarding.track.what} {texts.onboarding.track.modules(modules[option])}.
                  </span>
                </span>
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
        <p className="flex flex-col text-center text-caption text-teal-soft">
          <span lang="de">{dictionary("de").profile.progressKept}</span>
          <span lang="en">{dictionary("en").profile.progressKept}</span>
        </p>
      </Sheet>
    </>
  );
}

export type Dialect = { id: string; name: string };

type DialectSettingProps = { dialects: Dialect[]; current: string | null; locale: Locale };

// The dialect of Swiss German the learner practises. Before choosing one, they see every dialect.
export function DialectSetting({ dialects, current, locale }: DialectSettingProps) {
  const t = dictionary(locale).profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);
  // Named as in onboarding; a dialect Hoi no longer lists keeps its name from the database.
  const nameOf = (id: string) =>
    DIALECT_OPTIONS.find((dialect) => dialect.id === id)?.name ??
    dialects.find((dialect) => dialect.id === id)?.name ??
    id;

  return (
    <>
      <Row
        icon={<DialectIcon />}
        label={t.dialect}
        value={current ? nameOf(current) : t.dialectNotChosen}
        onOpen={() => sheet.current?.showModal()}
      />
      <Sheet sheet={sheet} title={t.dialect} locale={locale} error={error}>
        <p className="text-sm text-muted">{t.dialectNote}</p>
        {/* As in onboarding: dialects without content yet are shown, inactive, with when they come. */}
        <DialectChoices
          locale={locale}
          chosen={current}
          disabled={saving}
          onChoose={(id) => save(() => updateDialect(id))}
        />
      </Sheet>
    </>
  );
}

export function PaceSetting({ newCardsPerDay, locale }: { newCardsPerDay: number; locale: Locale }) {
  const texts = dictionary(locale);
  const t = texts.profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);
  // Null when the saved pace is none of the presets, so nothing is picked.
  const [selected, setSelected] = useState<number | null>(null);
  const preset = presetId(newCardsPerDay);

  return (
    <>
      <Row
        icon={<PaceIcon />}
        label={t.dailyPace}
        value={preset ? texts.goal.presets[preset] : texts.goal.newCards(newCardsPerDay)}
        onOpen={() => {
          setSelected(preset ? newCardsPerDay : null);
          sheet.current?.showModal();
        }}
      />
      <Sheet sheet={sheet} title={texts.goal.sheetTitle} locale={locale} error={error}>
        <PaceOptions selected={selected} onSelect={setSelected} locale={locale} />
        <p className="text-sm text-muted">{texts.goal.note}</p>
        <button
          onClick={() => selected !== null && save(() => updateDailyPlan(selected))}
          disabled={selected === null || saving}
          className={primaryButton}
        >
          {saving ? t.saving : t.save}
        </button>
      </Sheet>
    </>
  );
}

const DIRECTIONS: CardFront[] = ["swiss_german", "translation"];

export function DirectionSetting({ cardFront, locale }: { cardFront: CardFront; locale: Locale }) {
  const t = dictionary(locale).profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);

  return (
    <>
      <Row
        icon={<DirectionIcon />}
        label={t.cardDirection}
        value={t.directions[cardFront]}
        onOpen={() => sheet.current?.showModal()}
      />
      <Sheet sheet={sheet} title={t.cardDirection} locale={locale} error={error}>
        <p className="text-sm text-muted">{t.cardDirectionNote}</p>
        <Choices
          label={t.cardDirection}
          values={DIRECTIONS}
          current={cardFront}
          name={(direction) => t.directions[direction]}
          disabled={saving}
          onChoose={(direction) => save(() => updateCardFront(direction))}
        />
      </Sheet>
    </>
  );
}

const AUDIO_MODES = ["auto", "tap"] as const;

// Whether word cards play their recording by itself, or only when the speaker is tapped.
export function AudioSetting({ autoplay, locale }: { autoplay: boolean; locale: Locale }) {
  const t = dictionary(locale).profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);
  const mode = autoplay ? "auto" : "tap";

  return (
    <>
      <Row icon={<AudioIcon />} label={t.audio} value={t.audioModes[mode]} onOpen={() => sheet.current?.showModal()} />
      <Sheet sheet={sheet} title={t.audio} locale={locale} error={error}>
        <p className="text-sm text-muted">{t.audioNote}</p>
        <Choices
          label={t.audio}
          values={[...AUDIO_MODES]}
          current={mode}
          name={(value) => t.audioModes[value]}
          disabled={saving}
          onChoose={(value) => save(() => updateAutoplay(value === "auto"))}
        />
      </Sheet>
    </>
  );
}

export type Topic = { code: string; title: string; emoji: string | null };

type TopicsSettingProps = { topics: Topic[]; interests: string[]; locale: Locale };

export function TopicsSetting({ topics, interests, locale }: TopicsSettingProps) {
  const t = dictionary(locale).profile;
  const sheet = useRef<HTMLDialogElement>(null);
  const { error, saving, save } = useSave(sheet);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  // Topics that no longer exist don't count.
  const count = topics.filter((topic) => interests.includes(topic.code)).length;

  function toggle(code: string) {
    const next = new Set(chosen);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setChosen(next);
  }

  return (
    <>
      <Row
        icon={<TopicsIcon />}
        label={t.topics}
        value={t.topicsChosen(count)}
        onOpen={() => {
          setChosen(new Set(interests));
          sheet.current?.showModal();
        }}
      />
      <Sheet sheet={sheet} title={t.topics} locale={locale} error={error}>
        <p className="text-sm text-muted">{t.topicsNote}</p>
        <div className="grid max-h-[50dvh] grid-cols-2 gap-2 overflow-y-auto">
          {topics.map((topic) => {
            const selected = chosen.has(topic.code);
            return (
              <button
                key={topic.code}
                aria-pressed={selected}
                onClick={() => toggle(topic.code)}
                className={`flex min-h-14 items-center gap-2 rounded-2xl border-2 p-3 text-left transition-colors bg-mist ${
                  selected ? "border-accent" : "border-transparent"
                }`}
              >
                <span aria-hidden className="text-xl">
                  {topic.emoji ?? "📚"}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug font-semibold">{topic.title}</span>
                {selected && (
                  <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={() => save(() => updateInterests([...chosen]))} disabled={saving} className={primaryButton}>
          {saving ? t.saving : t.save}
        </button>
      </Sheet>
    </>
  );
}
