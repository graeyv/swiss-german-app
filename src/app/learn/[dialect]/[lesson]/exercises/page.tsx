import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExerciseSets } from "@/app/learn/exercise-sets";
import { Icon, isIconName } from "@/app/ui/icons";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findLesson, lessonHref, lessonParams, practiceHref, practiceUnits } from "@/lib/learn/lessons";
import { getReads } from "@/lib/learn/progress";
import { getRounds } from "@/lib/learn/suggestion";
import { createClient } from "@/lib/supabase/server";
import { LessonLoading, LessonScreen } from "../lesson-screen";

export function generateStaticParams() {
  return lessonParams();
}

// A module's exercise sets in Learn, from "Zu den Übungen" on its page, when it has more than one:
// one per lesson, such as in the English track's Pronunciation. It stays in Learn, and the sets
// lead back to the module's page.
export default function ModuleExercisesPage({ params }: PageProps<"/learn/[dialect]/[lesson]/exercises">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <ModuleExercises params={params} />
    </Suspense>
  );
}

async function ModuleExercises({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]/exercises">, "params">) {
  const [{ dialect, lesson: id }, supabase] = await Promise.all([params, createClient()]);
  const found = findLesson(dialect, id);
  if (!found || practiceUnits(found.lesson).length === 0) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);
  const [reads, rounds] = await Promise.all([getReads(supabase), getRounds(supabase, new Date())]);

  return (
    <LessonScreen
      lang={language}
      back={{ href: lessonHref(dialect, lesson), label: t.lesson.back(lesson.title), text: lesson.title }}
    >
      <title>{t.title(`${t.practice.exercises} · ${lesson.title}`)}</title>
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
        href={(section) => `${practiceHref(dialect, lesson, section)}?from=module`}
        t={t}
      />
    </LessonScreen>
  );
}
