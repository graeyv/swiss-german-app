"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

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

  // While a modal dialog is open, the browser blocks everything else on the page. Next.js keeps
  // pages we leave alive in the background, so the sheet must close when we leave, or it would
  // block the next page, such as its back link.
  useLayoutEffect(() => {
    const sheet = dialog.current;
    return () => sheet?.close();
  }, []);
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

      {/* A tap on the dimmed backdrop lands on the dialog itself, and closes it. */}
      <dialog
        ref={dialog}
        aria-label={title}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="mx-auto mt-auto mb-0 w-full max-w-xl rounded-t-3xl bg-surface p-0 text-foreground transition-transform duration-300 backdrop:bg-black/40 starting:open:translate-y-full motion-reduce:transition-none"
      >
        <div className="flex flex-col gap-5 px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-line" />

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
        </div>
      </dialog>
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
