import type { ReactNode } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";

type LessonScreenProps = {
  // The lesson's language.
  lang: string;
  // Where the arrow at the top leads, and its name for screen readers. With text, the arrow names
  // where it leads, such as "‹ Aussprache".
  back: { href: string; label: string; text?: string };
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
      <TopBar back={back} backText={back.text}>
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
                  className={`h-2 flex-1 rounded-full ${index < progress.position ? "bg-teal" : "bg-mist"}`}
                />
              ))}
            </div>
            <p aria-hidden className="shrink-0 text-caption font-semibold text-teal-soft tabular-nums">
              {progress.position} / {progress.count}
            </p>
          </>
        )}
      </TopBar>

      <div className="flex flex-1 flex-col gap-8 pt-2 pb-8">
        {children}
      </div>

      {footer ? (
        <footer className="sticky bottom-0 -mx-6 flex gap-3 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      ) : (
        <div className="pb-[env(safe-area-inset-bottom)]" />
      )}
    </main>
  );
}

export function LessonLoading() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-6">
      <LoadingPlaceholder />
    </div>
  );
}
