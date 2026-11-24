import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExerciseSets } from "@/app/learn/exercise-sets";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
import { Icon, isIconName } from "@/app/ui/icons";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { findLesson, lessonParams, practiceHref } from "@/lib/learn/lessons";
import { getReads } from "@/lib/learn/progress";
import { getRounds } from "@/lib/learn/suggestion";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return lessonParams();
}

// A module's exercises, one round per lesson and a mixed one at the end, to practise as often as
// the learner likes, from "Alle Übungen" in the Practice tab. Learn has its own list, in the module.
export default function ModuleExercisesPage({ params }: PageProps<"/flashcards/lessons/[dialect]/[lesson]">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <ModuleExercises params={params} />
    </Suspense>
  );
}

async function ModuleExercises({ params }: Pick<PageProps<"/flashcards/lessons/[dialect]/[lesson]">, "params">) {
  const [{ dialect, lesson: id }, supabase, locale] = await Promise.all([params, createClient(), getLocale()]);
  const found = findLesson(dialect, id);
  if (!found) notFound();
  const { lesson } = found;
  const t = dictionary(locale);
  const [reads, rounds] = await Promise.all([getReads(supabase), getRounds(supabase, new Date())]);

  return (
    <>
      <title>{t.title(`${t.practice.exercises} · ${lesson.title}`)}</title>
      {/* Directly in the page's column, so it stays at the top while the page scrolls. */}
      <TopBar back={{ href: "/flashcards/lessons" }} backText={t.practice.views.lessons} className="-mt-6 -mb-4" />

      <div className="flex flex-col gap-3">
        {isIconName(lesson.icon) && <Icon name={lesson.icon} size={32} className="text-teal-soft" />}
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.practice.exercises}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
      </div>

      <ExerciseSets
        entry={found}
        read={reads.read}
        rounds={rounds}
        href={(section) => practiceHref(dialect, lesson, section)}
        t={t}
      />
    </>
  );
}
