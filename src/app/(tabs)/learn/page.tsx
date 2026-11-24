import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { ButtonLink } from "@/app/ui/button";
import { isIconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { TabHeader } from "@/app/ui/tab-header";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { type DialectLesson, isReady, type Lesson, lessonHref, lessonNumber, lessonsFor, topicCount } from "@/lib/learn/lessons";
import { type Continue, getReads, moduleReadCount, readCount, whereToContinue } from "@/lib/learn/progress";
import { createClient } from "@/lib/supabase/server";

// The lessons of the learner's track: the one in their language. Every learner sees every
// dialect's lessons for now, until there are lessons for more than one.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

// A card to continue where the learner left off, then every module in order as an equal row, its
// caption saying how far it's read. A module still being written has the "Bald verfügbar" pill,
// but still opens, so learners see what it will cover.
async function Learn() {
  const [t, locale, supabase] = await Promise.all([getDictionary(), getLocale(), createClient()]);
  const lessons = lessonsFor(locale);
  const reads = await getReads(supabase);
  const next = whereToContinue(reads, lessons);

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <TabHeader title={t.nav.learn} intro={t.learn.intro} />

      {next && <ContinueCard next={next} read={reads.read} t={t} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{t.learn.allModules}</h2>
        <ListRows>
          {lessons.map((entry) => (
            <ListRow
              key={`${entry.dialect}/${entry.lesson.id}`}
              href={lessonHref(entry.dialect, entry.lesson)}
              comingSoon={isReady(entry.lesson) ? undefined : t.lesson.comingSoon}
              icon={isIconName(entry.lesson.icon) ? entry.lesson.icon : undefined}
              eyebrow={t.lesson.number(lessonNumber(entry))}
              title={entry.lesson.title}
              {...progress(entry, reads.read, t)}
            />
          ))}
        </ListRows>
      </section>
    </>
  );
}

// Its size until anything in it is read, then how much is ("4 von 10 Themen gelesen"), and once
// everything is, "Alles gelesen" with a check. Topics still planned count, so a module with more
// to come isn't done.
function progress(entry: DialectLesson, read: Set<string>, t: Dictionary): { caption: string; done?: boolean } {
  const total = topicCount(entry.lesson);
  const count = moduleReadCount(entry, read);
  if (count === 0) return { caption: size(entry.lesson, t) };
  if (count >= total) return { caption: t.learn.allRead, done: true };
  return { caption: t.learn.topicsRead(count, total) };
}

// Such as "2 Lektionen · 10 Themen", or only the lessons while no topic is planned yet.
function size(lesson: Lesson, t: Dictionary) {
  const sections = t.lesson.sections(lesson.sections.length);
  const topics = topicCount(lesson);
  return topics > 0 ? `${sections} · ${t.lesson.topics(topics)}` : sections;
}

// Sage, the Learn tab's one suggestion: the lesson to go on with, how much of it is read, and a
// button straight to its next topic. "Hier beginnen" until the learner has read anything.
function ContinueCard({ next, read, t }: { next: Continue; read: Set<string>; t: Dictionary }) {
  const { entry, section, rule, started } = next;
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
      <span className="flex flex-col gap-1">
        {/* Teal rather than the softer teal of eyebrows, which is too faint on sage. */}
        <span className="text-caption font-semibold tracking-[0.08em] uppercase">
          {started ? t.learn.continue : t.learn.startHere} · {entry.lesson.title}
        </span>
        <span className="text-heading font-bold">{section.title}</span>
        <span className="text-body">{t.learn.topicsRead(readCount(entry, section, read), section.rules.length)}</span>
      </span>
      <ButtonLink href={lessonHref(entry.dialect, entry.lesson, section, rule)}>
        {started ? t.lesson.next : t.lesson.start}
      </ButtonLink>
    </div>
  );
}
