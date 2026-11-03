"use client";

import Link from "next/link";
import { useRef } from "react";
import { BottomSheet } from "../../bottom-sheet";

type SubcategorySheetProps = {
  code: string;
  title: string;
  emoji: string;
  tint: string;
  newWords: number;
  due: number;
};

// A lowest-level subcategory. Tapping it slides up a sheet to start flashcards or see the words.
export function SubcategorySheet({ code, title, emoji, tint, newWords, due }: SubcategorySheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
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
        <Counts newWords={newWords} due={due} />
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
              <span className="text-sm text-muted">Done for today</span>
            ) : (
              <Counts newWords={newWords} due={due} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {done ? (
            <span className="w-full rounded-full bg-line px-6 py-3 text-center font-semibold text-muted">
              Nothing left for today
            </span>
          ) : (
            <Link
              href={`/flashcards/session/${code}`}
              onClick={close}
              className="w-full rounded-full bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Start flashcards
            </Link>
          )}
          <Link
            href={`/flashcards/decks/${code}/words`}
            onClick={close}
            className="w-full rounded-full border border-line px-6 py-3 text-center font-semibold transition-colors hover:border-accent"
          >
            See word list
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}

export function Counts({ newWords, due }: { newWords: number; due: number }) {
  if (newWords + due === 0) return <span className="shrink-0 text-sm text-muted">Done for today</span>;

  return (
    <span className="flex shrink-0 gap-1.5 text-xs font-semibold">
      {newWords > 0 && (
        <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">{newWords} new</span>
      )}
      {due > 0 && <span className="rounded-full bg-line px-2 py-1">{due} due</span>}
    </span>
  );
}
