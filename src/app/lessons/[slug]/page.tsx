import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { vocabularyText } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { LessonPlayer } from "./lesson-player";

export default function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/lessons/[slug]">, "params">) {
  const { slug } = await params;
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      "id, title, exercises(id, type, payload, vocabulary:vocabulary_items(swiss_german, high_german, vocabulary_translations(locale, meaning, notes)))",
    )
    .eq("slug", slug)
    .order("position", { referencedTable: "exercises" })
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!lesson) notFound();

  // Each word's meaning and notes in the learner's language, falling back to English.
  const exercises = lesson.exercises.map(({ vocabulary, ...exercise }) => ({
    ...exercise,
    vocabulary: vocabulary && {
      swiss_german: vocabulary.swiss_german,
      high_german: vocabulary.high_german,
      ...vocabularyText(vocabulary.vocabulary_translations, locale),
    },
  }));

  return (
    <LessonPlayer
      lessonId={lesson.id}
      locale={locale}
      title={lesson.title}
      exercises={exercises as unknown as Exercise[]}
    />
  );
}
