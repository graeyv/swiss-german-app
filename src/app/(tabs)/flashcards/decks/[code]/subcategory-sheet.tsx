"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon, type IconName } from "@/app/ui/icons";
import { BottomSheet } from "../../bottom-sheet";
import type { DeckKind } from "@/lib/flashcards/decks";
import { filterSearch, type VocabularyFilter } from "@/lib/flashcards/vocabulary-filter";
import { dictionary, type Locale } from "@/lib/i18n";
import { Counts } from "../../counts";
import { FilterSwitch } from "../../filter-switch";

type SubcategorySheetProps = {
  code: string;
  kind: DeckKind;
  title: string;
  icon: IconName;
  newWords: number;
  due: number;
  // Whether the topic has words as well as sentences or expressions, so they can be practised apart.
  mixed: boolean;
  locale: Locale;
};

// A lowest-level subcategory. Tapping it slides up a sheet to start flashcards or see the words,
// or for grammar, to start practising or see the rules. A topic with words and sentences or
// expressions first asks which of them to practise, all mixed unless the learner picks one.
export function SubcategorySheet({
  code,
  kind,
  title,
  icon,
  newWords,
  due,
  mixed,
  locale,
}: SubcategorySheetProps) {
  const t = dictionary(locale).flashcards;
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const done = newWords + due === 0;
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className="flex min-h-18 w-full items-center gap-4 rounded-3xl bg-mist px-6 py-4 text-left transition-transform active:scale-[0.98]"
      >
        <Icon name={icon} size={28} className="text-teal-soft" />
        <span className="min-w-0 flex-1 text-body font-bold">{title}</span>
        <Counts newWords={newWords} due={due} locale={locale} />
        <Icon name="forward" />
      </button>

      <BottomSheet ref={dialog} label={title}>
        <div className="flex items-center gap-4">
          <Icon name={icon} size={28} className="text-teal-soft" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            {done ? (
              <span className="text-sm text-muted">{t.doneForToday}</span>
            ) : (
              <Counts newWords={newWords} due={due} locale={locale} />
            )}
          </div>
        </div>

        {mixed && !done && <FilterSwitch value={filter} onChange={setFilter} locale={locale} />}

        <div className="flex flex-col gap-2">
          {done ? (
            <span className="w-full rounded-full bg-line px-6 py-3 text-center font-semibold text-muted">
              {t.nothingLeft}
            </span>
          ) : (
            <Link
              href={`/flashcards/session/${code}${mixed ? filterSearch(filter) : ""}`}
              onClick={close}
              className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {t.practise}
            </Link>
          )}
          <Link
            href={`/flashcards/decks/${code}/${kind === "grammar" ? "rules" : "words"}`}
            onClick={close}
            className="w-full rounded-full border border-line px-6 py-3 text-center font-semibold transition-colors hover:border-accent"
          >
            {kind === "grammar" ? t.seeRules : t.seeList}
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
