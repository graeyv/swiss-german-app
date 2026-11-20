import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { Pill } from "@/app/ui/surface";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import {
  exercisesHref,
  findLesson,
  hasExercises,
  isReady,
  lessonHref,
  lessonNumber,
  lessonParams,
} from "@/lib/learn/lessons";
import { getReads, readCount, rulePath, whereToContinue } from "@/lib/learn/progress";
import { createClient } from "@/lib/supabase/server";
import { LessonList, type LessonListItem } from "./lesson-list";
import { LessonLoading, LessonScreen } from "./lesson-screen";

export function generateStaticParams() {
  return lessonParams();
}

// A Learn lesson's overview: its sections, such as consonants and vowels, each with its topics.
export default function LessonPage({ params }: PageProps<"/learn/[dialect]/[lesson]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]">, "params">) {
  const [{ dialect, lesson: id }, supabase] = await Promise.all([params, createClient()]);
  const found = findLesson(dialect, id);
  if (!found) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);
  const ready = isReady(lesson);
  const first = lesson.sections.find(isReady);
  const reads = await getReads(supabase);
  // The next topic not read yet in this module, once the learner has read any of it.
  const anyRead = lesson.sections.some((section) => readCount(found, section, reads.read) > 0);
  const resume = anyRead ? whereToContinue(reads, [found]) : undefined;
  const lessons: LessonListItem[] = lesson.sections.map((section) => {
    const isRead = (ruleId: string) => reads.read.has(rulePath(dialect, lesson.id, section.id, ruleId));
    const read = readCount(found, section, reads.read);
    const nextUnread = section.rules.findIndex(({ id }) => !isRead(id));
    return {
      id: section.id,
      title: section.title,
      caption: read > 0 ? t.learn.topicsRead(read, section.rules.length) : t.lesson.topics(section.rules.length),
      // A lesson still being written is a single inactive row; one with content also lists the
      // topics still to come after its written ones, inactive.
      topics:
        section.rules.length > 0
          ? [
              ...section.rules.map((rule, index) => ({
                title: rule.title,
                href: lessonHref(dialect, lesson, section, rule),
                read: isRead(rule.id),
                next: index === nextUnread,
              })),
              ...(section.planned ?? []).map((title) => ({ title, read: false, next: false })),
            ]
          : [],
    };
  });
  // Open at first: the lesson of the topic read last, if it's in this module, else the one to go
  // on with, else the first.
  const [lastDialect, lastLesson, lastSection] = reads.last?.split("/") ?? [];
  const openLesson =
    lastDialect === dialect && lastLesson === lesson.id ? lastSection : (resume?.section.id ?? first?.id);

  return (
    <LessonScreen
      lang={language}
      back={{ href: "/learn", label: t.lesson.leave }}
      footer={
        // Straight to the first topic, or on to the next one not read yet. Second, the module's
        // exercises once it has any, or else starting over. The lists below are for looking one
        // up. A lesson still being written has nothing to start yet.
        first && (
          <div className="flex w-full flex-col gap-3">
            {resume ? (
              <ButtonLink href={lessonHref(dialect, lesson, resume.section, resume.rule)}>
                {t.lesson.next}: {resume.rule.title}
              </ButtonLink>
            ) : (
              // Everything read: only starting over is left.
              <ButtonLink href={lessonHref(dialect, lesson, first, first.rules[0])}>
                {anyRead ? t.lesson.fromStart : t.lesson.start}
              </ButtonLink>
            )}
            {hasExercises(lesson) ? (
              <ButtonLink href={exercisesHref(dialect, lesson)} variant="secondary" className="min-h-14">
                <Icon name="puzzle" size={20} />
                {t.practice.toExercises}
              </ButtonLink>
            ) : (
              resume && (
                <ButtonLink href={lessonHref(dialect, lesson, first, first.rules[0])} variant="secondary">
                  {t.lesson.fromStart}
                </ButtonLink>
              )
            )}
          </div>
        )
      }
    >
      <title>{t.title(lesson.title)}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(lessonNumber(found))}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
        {!ready && <Pill>{t.lesson.comingSoon}</Pill>}
      </div>

      {lesson.expectations.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-heading font-bold">{t.lesson.expect}</h2>
          <ul className="flex flex-col gap-4">
            {lesson.expectations.map((expectation) => (
              <li key={expectation.title} className="flex items-center gap-4">
                {isIconName(expectation.icon) && <Icon name={expectation.icon} size={28} className="text-teal-soft" />}
                <span className="text-body">{expectation.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Each lesson unfolds its topics, so the page stays short. The lesson being read in is
          open, so coming back from a topic shows where the learner is. */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        {!ready && <p className="text-body">{t.lesson.inTheMaking}</p>}
        <LessonList lessons={lessons} open={openLesson} comingSoon={t.lesson.comingSoon} />
      </section>
    </LessonScreen>
  );
}
