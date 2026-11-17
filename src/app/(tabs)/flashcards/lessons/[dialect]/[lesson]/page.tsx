import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
import { Icon, isIconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { findLesson, lessonParams, practiceHref, roundExercises } from "@/lib/learn/lessons";
import { getReads, readCount } from "@/lib/learn/progress";
import { getRounds, roundOf } from "@/lib/learn/suggestion";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return lessonParams();
}

// A module's exercises, one round per lesson, to practise as often as the learner likes: from
// "Alle Übungen" in the Practice tab, and from the module's page in Learn ("Zu den Übungen").
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

      <ListRows>
        {lesson.sections.map((section) => {
          // A lesson without exercises yet shows what's coming, but doesn't open.
          if (roundExercises(section).length === 0) {
            return <ListRow key={section.id} title={section.title} comingSoon={t.lesson.comingSoon} />;
          }
          const round = roundOf(rounds, { entry: found, section });
          const read = readCount(found, section, reads.read);
          const caption = round
            ? t.practice.practised(t.practice.ago(round.daysAgo))
            : read === section.rules.length
              ? t.practice.readNotPractised
              : read > 0
                ? t.learn.topicsRead(read, section.rules.length)
                : t.practice.notRead(section.rules.length);
          return (
            <ListRow
              key={section.id}
              href={practiceHref(dialect, lesson, section)}
              title={section.title}
              caption={caption}
            />
          );
        })}
      </ListRows>
    </>
  );
}
