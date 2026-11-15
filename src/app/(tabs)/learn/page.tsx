import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icon";
import { ListRow, ListRows } from "@/app/ui/list-row";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";
import { type DialectLesson, isReady, LESSONS, lessonHref, lessonNumber } from "@/lib/learn/lessons";

// Lessons on how Swiss German differs from Standard German. Every learner sees every lesson for
// now, whatever their dialect, until there are lessons for more than one.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

// The lesson to do now stands out as a large card that starts it. Lessons still being written
// follow under their own heading and open their overview, so learners see where the track leads.
// Progress isn't saved yet, so the lesson to do now is the first one with content.
async function Learn() {
  const t = await getDictionary();
  const [current, ...others] = LESSONS.filter(({ lesson }) => isReady(lesson));
  const upcoming = LESSONS.filter(({ lesson }) => !isReady(lesson));

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold">{t.nav.learn}</h1>
        <p className="text-body text-teal-soft">{t.learn.intro}</p>
      </div>

      {current && <CurrentLesson entry={current} t={t} />}

      {others.length > 0 && (
        <ListRows>
          {others.map((entry) => (
            <LessonRow key={`${entry.dialect}/${entry.lesson.id}`} entry={entry} t={t} />
          ))}
        </ListRows>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
            {t.learn.upcoming}
          </h2>
          <ListRows>
            {upcoming.map((entry) => (
              <LessonRow key={`${entry.dialect}/${entry.lesson.id}`} entry={entry} t={t} />
            ))}
          </ListRows>
        </section>
      )}
    </>
  );
}

type LessonProps = { entry: DialectLesson; t: Dictionary };

// Sage, so it stands out as the next step. The text opens the lesson's overview, the button starts
// straight with its first topic.
function CurrentLesson({ entry, t }: LessonProps) {
  const { dialect, lesson } = entry;
  const ready = lesson.sections.filter(isReady);
  const topics = ready.reduce((sum, section) => sum + section.rules.length, 0);
  const [first] = ready;

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
          <span className="text-caption">
            {t.lesson.parts(ready.length)} · {t.lesson.topics(topics)}
          </span>
        </span>
      </Link>
      <ButtonLink href={lessonHref(dialect, lesson, first, first.rules[0])}>{t.lesson.start}</ButtonLink>
    </div>
  );
}

function LessonRow({ entry, t }: LessonProps) {
  const { dialect, lesson } = entry;
  return (
    <ListRow
      href={lessonHref(dialect, lesson)}
      icon={isIconName(lesson.icon) ? lesson.icon : undefined}
      title={lesson.title}
      caption={isReady(lesson) ? `${t.lesson.number(lessonNumber(entry))} · ${lesson.subtitle}` : lesson.subtitle}
    />
  );
}
