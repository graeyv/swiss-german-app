import Link from "next/link";
import type { ReactNode } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";

type LessonScreenProps = {
  // The lesson's language.
  lang: string;
  // Where the arrow at the top leads, and its name for screen readers.
  back: { href: string; label: string };
  // Where a topic is in its section, shown as a bar with one segment per topic. The label names it
  // for screen readers.
  progress?: { position: number; count: number; label: string };
  children: ReactNode;
  // Buttons kept at the bottom, within thumb reach, also when the screen is longer than the phone.
  footer?: ReactNode;
};

// A full screen of a Learn lesson.
export function LessonScreen({ lang, back, progress, children, footer }: LessonScreenProps) {
  return (
    <main lang={lang} className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <TopBar back={back}>
        {progress && (
          <>
            <div
              role="progressbar"
              aria-label={progress.label}
              aria-valuemin={1}
              aria-valuemax={progress.count}
              aria-valuenow={progress.position}
              className="flex flex-1 gap-1"
            >
              {Array.from({ length: progress.count }, (_, index) => (
                <span
                  key={index}
                  className={`h-2 flex-1 rounded-full ${index < progress.position ? "bg-accent" : "bg-line"}`}
                />
              ))}
            </div>
            <p aria-hidden className="shrink-0 text-sm font-semibold text-muted tabular-nums">
              {progress.position} / {progress.count}
            </p>
          </>
        )}
      </TopBar>

      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
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
