import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { grammarExercise } from "@/lib/flashcards/grammar";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { GrammarCard } from "@/lib/types";
import { devOnly, getAllExercises } from "../data";
import { ExercisePreview } from "./exercise-preview";

// Developer tool: one grammar exercise on the grammar card, as a new card would show it.
export default function DevExercisePage({ params }: PageProps<"/dev/exercises/[code]">) {
  devOnly();
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: Pick<PageProps<"/dev/exercises/[code]">, "params">) {
  const [{ code }, supabase, locale] = await Promise.all([params, createClient(), getLocale()]);
  const exercises = await getAllExercises(supabase, locale);
  const index = exercises.findIndex((exercise) => exercise.code === code);
  if (index === -1) notFound();

  const row = exercises[index];
  const exercise = grammarExercise({ ...row }, locale);
  const card: GrammarCard = {
    kind: "grammar",
    card_id: row.point.code,
    title: row.point.title,
    exercises: [exercise],
    exercise,
    status: "new",
    review_id: row.id,
  };

  return (
    <>
      <title>{`${row.code} – dev`}</title>
      <ExercisePreview
        card={card}
        locale={locale}
        label={`${row.code} · ${row.type} · level ${row.level}`}
        nextHref={exercises[index + 1] ? `/dev/exercises/${exercises[index + 1].code}` : "/dev/exercises"}
      />
    </>
  );
}
