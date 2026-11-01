import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { LessonPlayer } from "./lesson-player";

export default function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Loading lesson…</p>}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/lessons/[slug]">, "params">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      "id, title, exercises(id, type, payload, vocabulary:vocabulary_items(swiss_german, high_german, english, notes))",
    )
    .eq("slug", slug)
    .order("position", { referencedTable: "exercises" })
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!lesson) notFound();

  return (
    <LessonPlayer
      lessonId={lesson.id}
      title={lesson.title}
      exercises={lesson.exercises as unknown as Exercise[]}
    />
  );
}
