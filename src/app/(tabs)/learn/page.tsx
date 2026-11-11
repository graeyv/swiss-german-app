import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getDictionary } from "@/lib/i18n/server";
import { LESSONS, lessonNumber } from "@/lib/learn/lessons";

// Lessons on how Swiss German differs from Standard German. Every learner sees every lesson for
// now, whatever their dialect, until there are lessons for more than one.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

async function Learn() {
  const t = await getDictionary();

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.learn}</h1>

      <ol className="flex flex-col gap-3">
        {LESSONS.map((entry) => {
          const { dialect, lesson } = entry;
          const number = lessonNumber(entry);
          return (
            <li key={`${dialect}/${lesson.id}`}>
              <Link
                href={`/learn/${dialect}/${lesson.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground tabular-nums"
                >
                  {number}
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  {/* Screen readers hear "Lesson 1" before the title. */}
                  <span className="sr-only">{t.lesson.number(number)}</span>
                  <span className="font-semibold">{lesson.title}</span>
                  <span className="text-sm text-muted">{lesson.subtitle}</span>
                </span>
                <span aria-hidden className="text-muted">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
