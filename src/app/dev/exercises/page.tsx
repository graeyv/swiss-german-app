import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { devOnly, getAllExercises } from "./data";

// Developer tool, in English only: lists every grammar exercise. Tapping one opens it on the
// grammar card, without saving anything.
export default function DevExercisesPage() {
  devOnly();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <Suspense fallback={<LoadingPlaceholder />}>
        <ExerciseList />
      </Suspense>
    </main>
  );
}

async function ExerciseList() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const exercises = await getAllExercises(supabase, locale);
  const points = [...new Set(exercises.map((exercise) => exercise.point.code))];

  return (
    <>
      <title>Exercises – dev</title>
      <div>
        <p className="text-sm font-semibold text-accent">Developer tool</p>
        <h1 className="text-2xl font-bold tracking-tight">Grammar exercises</h1>
        <p className="text-sm text-muted">
          Open one to try it on the grammar card. Answers aren&apos;t saved.
        </p>
      </div>

      {points.map((code) => {
        const ofPoint = exercises.filter((exercise) => exercise.point.code === code);
        return (
          <section key={code} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
              {code} · {ofPoint[0].point.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {ofPoint.map((exercise) => (
                <li key={exercise.id}>
                  <Link
                    href={`/dev/exercises/${exercise.code}`}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2 transition-colors hover:border-accent"
                  >
                    <span className="font-mono text-sm">{exercise.code}</span>
                    <span className="flex-1 font-semibold">{exercise.type}</span>
                    <span className="rounded-full bg-line px-2 py-1 text-xs font-semibold">
                      Level {exercise.level}
                    </span>
                    {exercise.dialect && <span className="text-xs text-muted">{exercise.dialect}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
