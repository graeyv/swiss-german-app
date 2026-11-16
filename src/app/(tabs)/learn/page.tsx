import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icon";
import { ListRow } from "@/app/ui/list-row";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";
import { LAST_OPENED_COOKIE, parsePlace } from "@/lib/learn/last-opened";
import {
  type DialectLesson,
  findRule,
  isReady,
  type Lesson,
  LESSONS,
  lessonHref,
  lessonNumber,
  type RulePlace,
  topicCount,
} from "@/lib/learn/lessons";
import { ScrollIntoReach } from "./scroll-into-reach";

// Lessons on how Swiss German differs from Standard German. Every learner sees every lesson for
// now, whatever their dialect, until there are lessons for more than one.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

// All modules in order, the path through the track. The one the learner opened last is a large
// card to continue with, in its place; far down the list, the page opens scrolled to it. Modules
// still being written look like the others, counting their planned topics: the prototype shows the
// whole track. Progress isn't saved yet, so nothing is marked as done.
async function Learn() {
  const [t, jar] = await Promise.all([getDictionary(), cookies()]);
  const { current, resume } = whereToContinue(jar.get(LAST_OPENED_COOKIE)?.value);

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold">{t.nav.learn}</h1>
        <p className="text-subtitle font-semibold">{t.learn.intro}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {LESSONS.map((entry) =>
          entry === current ? (
            <li key={`${entry.dialect}/${entry.lesson.id}`}>
              <ScrollIntoReach>
                <CurrentModule entry={entry} resume={resume} t={t} />
              </ScrollIntoReach>
            </li>
          ) : (
            <ListRow
              key={`${entry.dialect}/${entry.lesson.id}`}
              href={lessonHref(entry.dialect, entry.lesson)}
              icon={isIconName(entry.lesson.icon) ? entry.lesson.icon : undefined}
              eyebrow={t.lesson.number(lessonNumber(entry))}
              title={entry.lesson.title}
              caption={size(entry.lesson, t)}
            />
          ),
        )}
      </ol>
    </>
  );
}

// The module opened last, and the topic in it, if any. Without one, or if it no longer exists,
// the first module with content.
function whereToContinue(cookie: string | undefined): { current?: DialectLesson; resume?: RulePlace } {
  const place = parsePlace(cookie);
  const opened =
    place && LESSONS.find(({ dialect, lesson }) => dialect === place.dialect && lesson.id === place.lesson);
  if (!opened) return { current: LESSONS.find(({ lesson }) => isReady(lesson)) };
  const resume = place.section && place.rule ? findRule(opened.lesson, place.section, place.rule) : undefined;
  return { current: opened, resume };
}

// Such as "2 Lektionen · 10 Themen", or only the lessons while no topic is planned yet.
function size(lesson: Lesson, t: Dictionary) {
  const sections = t.lesson.sections(lesson.sections.length);
  const topics = topicCount(lesson);
  return topics > 0 ? `${sections} · ${t.lesson.topics(topics)}` : sections;
}

type CurrentModuleProps = { entry: DialectLesson; resume?: RulePlace; t: Dictionary };

// Sage, so it stands out as where to continue. The text opens the module's overview. The button
// goes back to the topic the learner was at, or starts with the first one, or, for a module still
// being written, opens its overview.
function CurrentModule({ entry, resume, t }: CurrentModuleProps) {
  const { dialect, lesson } = entry;
  const first = lesson.sections.find(isReady);
  const [href, label] = resume
    ? [lessonHref(dialect, lesson, resume.section, resume.rule), `${t.lesson.next}: ${resume.rule.title}`]
    : first
      ? [lessonHref(dialect, lesson, first, first.rules[0]), t.lesson.start]
      : [lessonHref(dialect, lesson), t.lesson.next];

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
      <ButtonLink href={href}>{label}</ButtonLink>
    </div>
  );
}
