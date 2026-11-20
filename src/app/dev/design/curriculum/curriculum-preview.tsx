"use client";

import { useSearchParams } from "next/navigation";
import { LessonList, type LessonListItem } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { RuleBody } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/rule-body";
import { ButtonLink } from "@/app/ui/button";
import { Icon, type IconName, isIconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import type { Lesson } from "@/lib/learn/lessons";
import file from "./english-b2.json";

// The English track under proposal B2, with the content brief's texts: the Learn tab's module
// list, the module pages, and every topic with content, laid out as in the app. Addresses:
// ?module=pronunciation for a module, &lesson=vowels&topic=0 for a topic. A lesson's topics still
// to come are its planned ones.

// The three modules with content, in the lesson format, then the others, which only have a title.
const WRITTEN = file as unknown as Lesson[];
const LATER: { id: string; title: string; icon: IconName }[] = [
  { id: "building-sentences", title: "Building sentences", icon: "puzzle" },
  { id: "expanding-your-grammar", title: "Expanding your grammar", icon: "grid" },
  { id: "everyday-communication", title: "Everyday communication", icon: "chat" },
  { id: "talking-about-your-life", title: "Talking about your life", icon: "user" },
  { id: "becoming-fluent", title: "Becoming fluent", icon: "sparkles" },
];

const t = dictionary("en");
const HERE = "/dev/design/curriculum";
const moduleHref = (lesson: Lesson) => `${HERE}?module=${lesson.id}`;
const topicHref = (lesson: Lesson, section: string, topic: number) =>
  `${HERE}?module=${lesson.id}&lesson=${section}&topic=${topic}`;
const topicCount = (lesson: Lesson) =>
  lesson.sections.reduce((sum, section) => sum + section.rules.length + (section.planned?.length ?? 0), 0);

export function CurriculumPreview() {
  const params = useSearchParams();
  const lesson = WRITTEN.find((each) => each.id === params.get("module"));
  const section = lesson?.sections.find((each) => each.id === params.get("lesson"));
  const index = Number(params.get("topic"));
  if (lesson && section && section.rules[index]) return <Topic lesson={lesson} sectionId={section.id} index={index} />;
  if (lesson) return <ModulePage lesson={lesson} />;
  return <ModuleList />;
}

// The Learn tab's module list, as the app shows it: modules without content carry the pill.
function ModuleList() {
  return (
    <main lang="en" className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-6">
      <title>Curriculum B2 – dev</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold">{t.nav.learn}</h1>
        <p className="text-subtitle font-semibold">{t.learn.intro}</p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{t.learn.allModules}</h2>
        <ListRows>
          {WRITTEN.map((lesson, index) => {
            const ready = lesson.sections.some((section) => section.rules.length > 0);
            return (
              <ListRow
                key={lesson.id}
                href={moduleHref(lesson)}
                icon={isIconName(lesson.icon) ? lesson.icon : undefined}
                eyebrow={t.lesson.number(index + 1)}
                title={lesson.title}
                caption={`${t.lesson.sections(lesson.sections.length)} · ${t.lesson.topics(topicCount(lesson))}`}
                comingSoon={ready ? undefined : t.lesson.comingSoon}
              />
            );
          })}
          {LATER.map((later, index) => (
            <ListRow
              key={later.id}
              icon={later.icon}
              eyebrow={t.lesson.number(WRITTEN.length + index + 1)}
              title={later.title}
              comingSoon={t.lesson.comingSoon}
            />
          ))}
        </ListRows>
      </section>
    </main>
  );
}

// A module's page, as the app lays it out, with its lessons unfolding their topics: those with
// content first, then those still to come.
function ModulePage({ lesson }: { lesson: Lesson }) {
  const lessons: LessonListItem[] = lesson.sections.map((section) => ({
    id: section.id,
    title: section.title,
    caption: t.lesson.topics(section.rules.length + (section.planned?.length ?? 0)),
    // Unlike in the app, a lesson with nothing written yet still unfolds its planned topics, to
    // review the structure.
    topics: [
      ...section.rules.map((rule, index) => ({
        title: rule.title,
        href: topicHref(lesson, section.id, index),
        read: false,
        next: index === 0,
      })),
      ...(section.planned ?? []).map((title) => ({ title, read: false, next: false })),
    ],
  }));
  const firstWritten = lesson.sections.find((section) => section.rules.length > 0)?.id;
  const open = firstWritten ?? lesson.sections[0]?.id;

  return (
    <LessonScreen
      lang="en"
      back={{ href: HERE, label: t.lesson.leave }}
      footer={firstWritten ? <ButtonLink href={topicHref(lesson, firstWritten, 0)}>{t.lesson.start}</ButtonLink> : undefined}
    >
      <title>{`${lesson.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(WRITTEN.indexOf(lesson) + 1)}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
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

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        <LessonList lessons={lessons} open={open} comingSoon={t.lesson.comingSoon} />
      </section>
    </LessonScreen>
  );
}

// A topic, as the app lays it out: the module named at the top, its lesson's progress, "Back"
// and "Next" at the bottom, on to the next lesson with content after the last topic.
function Topic({ lesson, sectionId, index }: { lesson: Lesson; sectionId: string; index: number }) {
  const all = lesson.sections.flatMap((section) => section.rules.map((rule, position) => ({ section, rule, position })));
  const at = all.findIndex((item) => item.section.id === sectionId && item.position === index);
  const { section, rule } = all[at];
  const previous = all[at - 1];
  const next = all[at + 1];

  const back = previous && (
    <ButtonLink
      href={topicHref(lesson, previous.section.id, previous.position)}
      replace
      variant="secondary"
      className="min-h-14"
    >
      <Icon name="back" size={20} />
      {t.lesson.previous}
    </ButtonLink>
  );

  return (
    <LessonScreen
      lang="en"
      back={{ href: moduleHref(lesson), label: t.lesson.back(lesson.title), text: lesson.title }}
      progress={{
        position: index + 1,
        count: section.rules.length,
        label: t.lesson.position(section.title, index + 1, section.rules.length),
      }}
      footer={
        <div className={`grid w-full gap-3 ${back ? "grid-cols-[1fr_2fr]" : ""}`}>
          {back}
          {next ? (
            <ButtonLink href={topicHref(lesson, next.section.id, next.position)} replace>
              {t.lesson.next}: {next.section === section ? next.rule.title : next.section.title}
            </ButtonLink>
          ) : (
            <ButtonLink href={moduleHref(lesson)}>{t.lesson.done}</ButtonLink>
          )}
        </div>
      }
    >
      <title>{`${rule.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{section.title}</Eyebrow>
          <h1 className="text-title font-bold">{rule.title}</h1>
        </div>
        <p className="text-body">{rule.theory}</p>
      </div>
      <RuleBody rule={rule} dialectName={t.lesson.dialects.be} t={t.lesson} />
    </LessonScreen>
  );
}
