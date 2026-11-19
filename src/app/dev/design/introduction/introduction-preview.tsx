"use client";

import { useSearchParams } from "next/navigation";
import { LessonList } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { RuleBody } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/rule-body";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import type { Lesson } from "@/lib/learn/lessons";
import file from "./getting-started.json";

// The module page and the Introduction's topics, as the app lays them out, with the same parts:
// ?topic=0 is the first topic. Links replace the page between topics, like in the app.
const lesson = file as Lesson;
const introduction = lesson.sections[0];
const t = dictionary("en");
const HERE = "/dev/design/introduction";
const topicHref = (index: number) => `${HERE}?topic=${index}`;

export function IntroductionPreview() {
  const param = useSearchParams().get("topic");
  const index = param === null ? null : Number(param);
  if (index === null || !introduction.rules[index]) return <Module />;
  return <Topic index={index} />;
}

function Module() {
  const lessons = lesson.sections.map((section) => ({
    id: section.id,
    title: section.title,
    caption: t.lesson.topics(section.rules.length),
    topics: section.rules.map((rule, index) => ({
      title: rule.title,
      href: section === introduction ? topicHref(index) : "#",
      read: false,
      next: index === 0,
    })),
  }));

  return (
    <LessonScreen
      lang="en"
      back={{ href: "/dev/design", label: t.lesson.leave }}
      footer={<ButtonLink href={topicHref(0)}>{t.lesson.start}</ButtonLink>}
    >
      <title>Getting started – dev</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(1)}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
      </div>

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

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        <LessonList lessons={lessons} open={introduction.id} comingSoon={t.lesson.comingSoon} />
      </section>
    </LessonScreen>
  );
}

function Topic({ index }: { index: number }) {
  const rules = introduction.rules;
  const rule = rules[index];
  const next = rules[index + 1];

  const back =
    index > 0 ? (
      <ButtonLink href={topicHref(index - 1)} replace variant="secondary" className="min-h-14">
        <Icon name="back" size={20} />
        {t.lesson.previous}
      </ButtonLink>
    ) : null;

  return (
    <LessonScreen
      lang="en"
      back={{ href: HERE, label: t.lesson.back(lesson.title), text: lesson.title }}
      progress={{
        position: index + 1,
        count: rules.length,
        label: t.lesson.position(introduction.title, index + 1, rules.length),
      }}
      footer={
        <div className={`grid w-full gap-3 ${back ? "grid-cols-[1fr_2fr]" : ""}`}>
          {back}
          {next ? (
            <ButtonLink href={topicHref(index + 1)} replace>
              {t.lesson.next}: {next.title}
            </ButtonLink>
          ) : (
            <ButtonLink href={HERE}>{t.lesson.done}</ButtonLink>
          )}
        </div>
      }
    >
      <title>{`${rule.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{introduction.title}</Eyebrow>
          <h1 className="text-title font-bold">{rule.title}</h1>
        </div>
        <p className="text-body">{rule.theory}</p>
      </div>
      <RuleBody rule={rule} dialectName={t.lesson.dialects.be} t={t.lesson} />
    </LessonScreen>
  );
}
