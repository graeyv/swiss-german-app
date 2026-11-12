"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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
  emoji: string;
  tint: string;
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
  emoji,
  tint,
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
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:border-accent active:scale-[0.99]"
      >
        <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl ${tint}`}>
          {emoji}
        </span>
        <span className="min-w-0 flex-1 font-semibold leading-snug">{title}</span>
        <Counts newWords={newWords} due={due} locale={locale} />
        <span aria-hidden className="text-muted">
          ›
        </span>
      </button>

      <BottomSheet ref={dialog} label={title}>
        <div className="flex items-center gap-4">
          <span aria-hidden className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${tint}`}>
            {emoji}
          </span>
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
