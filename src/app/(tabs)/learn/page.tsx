import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icon";
import { ListRow, ListRows } from "@/app/ui/list-row";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";
import {
  type DialectLesson,
  isReady,
  type Lesson,
  LESSONS,
  lessonHref,
  lessonNumber,
  topicCount,
} from "@/lib/learn/lessons";

// Lessons on how Swiss German differs from Standard German. Every learner sees every lesson for
// now, whatever their dialect, until there are lessons for more than one.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

// The lesson to do now stands out as a large card that starts it, and all lessons follow as the
// path through the track. Lessons still being written look like the others, counting their planned
// topics: the prototype shows the whole track. Progress isn't saved yet, so the lesson to do now is
// the first one with content, and nothing is marked as done.
async function Learn() {
  const t = await getDictionary();
  const current = LESSONS.find(({ lesson }) => isReady(lesson));

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold">{t.nav.learn}</h1>
        <p className="text-subtitle font-semibold">{t.learn.intro}</p>
      </div>

      {current && <CurrentLesson entry={current} t={t} />}

      <section className="flex flex-col gap-4">
        <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
          {t.learn.all}
        </h2>
        <ListRows>
          {LESSONS.map((entry) => (
            <ListRow
              key={`${entry.dialect}/${entry.lesson.id}`}
              href={lessonHref(entry.dialect, entry.lesson)}
              icon={isIconName(entry.lesson.icon) ? entry.lesson.icon : undefined}
              eyebrow={t.lesson.number(lessonNumber(entry))}
              title={entry.lesson.title}
              caption={size(entry.lesson, t)}
            />
          ))}
        </ListRows>
      </section>
    </>
  );
}

// Such as "2 Lektionen · 10 Themen", or only the lessons while no topic is planned yet.
function size(lesson: Lesson, t: Dictionary) {
  const sections = t.lesson.sections(lesson.sections.length);
  const topics = topicCount(lesson);
  return topics > 0 ? `${sections} · ${t.lesson.topics(topics)}` : sections;
}

// Sage, so it stands out as the next step. The text opens the lesson's overview, the button starts
// straight with its first topic.
function CurrentLesson({ entry, t }: { entry: DialectLesson; t: Dictionary }) {
  const { dialect, lesson } = entry;
  const first = lesson.sections.find(isReady)!;

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
      <Link href={lessonHref(dialect, lesson)} className="flex flex-col gap-4">
        {isIconName(lesson.icon) && <Icon name={lesson.icon} size={28} />}
        <span className="flex flex-col gap-1">
          {/* Teal rather than the softer teal of eyebrows, which is too faint on sage. */}
          <span className="text-caption font-semibold tracking-[0.08em] uppercase">
            {t.lesson.number(lessonNumber(entry))}
          </span>
          <span className="text-heading font-bold">{lesson.title}</span>
          <span className="text-body">{lesson.subtitle}</span>
          <span className="text-caption">{size(lesson, t)}</span>
        </span>
      </Link>
      <ButtonLink href={lessonHref(dialect, lesson, first, first.rules[0])}>{t.lesson.start}</ButtonLink>
    </div>
  );
}
