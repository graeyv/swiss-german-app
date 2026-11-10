import Link from "next/link";
import type { ReactNode } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";

type LessonScreenProps = {
  // Where the arrow at the top leads, and its name for screen readers.
  back: { href: string; label: string };
  children: ReactNode;
  // Buttons kept at the bottom, within thumb reach, also when the screen is longer than the phone.
  footer?: ReactNode;
};

// A full screen of a Learn lesson. The content is Standard German, whatever the interface language.
export function LessonScreen({ back, children, footer }: LessonScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-4">
      <header>
        <Link
          href={back.href}
          aria-label={back.label}
          className="-ml-2 flex size-11 items-center justify-center text-xl text-muted"
        >
          ←
        </Link>
      </header>

      <div lang="de" className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        {children}
      </div>

      {footer ? (
        <footer className="sticky bottom-0 -mx-6 flex gap-3 bg-background px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      ) : (
        <div className="pb-[env(safe-area-inset-bottom)]" />
      )}
    </main>
  );
}

// A tappable row of a list: a title, the line below it, and an arrow.
export function ListLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/5"
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </span>
      <span aria-hidden className="text-muted">
        →
      </span>
    </Link>
  );
}

export const listClass =
  "flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface";

export function LessonLoading() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-6">
      <LoadingPlaceholder />
    </div>
  );
}
