"use client";

import { type ReactNode, type RefObject, useLayoutEffect } from "react";

type BottomSheetProps = {
  ref: RefObject<HTMLDialogElement | null>;
  label: string;
  children: ReactNode;
};

// A panel that slides up from the bottom of the screen. Open it with ref.current.showModal().
// It closes on Escape and on a tap on the dimmed backdrop.
export function BottomSheet({ ref, label, children }: BottomSheetProps) {
  // While a modal dialog is open, the browser blocks everything else on the page. Next.js keeps
  // pages we leave alive in the background, so the sheet must close when we leave, or it would
  // block the next page, such as its back link.
  useLayoutEffect(() => {
    const sheet = ref.current;
    return () => sheet?.close();
  }, [ref]);

  return (
    // A tap on the dimmed backdrop lands on the dialog itself, and closes it.
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-xl rounded-t-3xl bg-surface p-0 text-foreground transition-transform duration-300 backdrop:bg-black/40 starting:open:translate-y-full motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-5 px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        {children}
      </div>
    </dialog>
  );
}
