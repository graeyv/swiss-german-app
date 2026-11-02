import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Your lessons – Grüezi" };

export default function LearnPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your lessons…</p>}>
      <Courses />
    </Suspense>
  );
}

async function Courses() {
  const supabase = await createClient();

  const [courses, progress] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, description, level, dialect:dialects(name), lessons(id, slug, title, description)",
      )
      .order("position")
      .order("position", { referencedTable: "lessons" }),
    supabase.from("lesson_progress").select("lesson_id, best_score"),
  ]);

  if (courses.error) throw new Error(courses.error.message);
  if (progress.error) throw new Error(progress.error.message);

  const scores = new Map<string, number>(
    progress.data.map((row) => [row.lesson_id, row.best_score]),
  );
  const courseList = courses.data as unknown as Course[];

  if (courseList.length === 0) {
    return (
      <p className="text-muted">
        No courses yet. Add the starter content with <code>npm run db:push</code>.
      </p>
    );
  }

  return courseList.map((course) => (
    <section key={course.id} className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">
          {course.dialect.name} · {course.level}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-1 text-muted">{course.description}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {course.lessons.map((lesson, index) => {
          const score = scores.get(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.slug}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="text-lg font-semibold text-muted">{index + 1}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{lesson.title}</span>
                  <span className="block text-sm text-muted">{lesson.description}</span>
                </span>
                {score !== undefined && (
                  <span className="text-sm font-semibold text-success">{score}%</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  ));
}
