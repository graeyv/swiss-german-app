import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RuleBody, Theory } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/rule-body";
import { SectionLetters } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/sound-list";
import { LessonLoading, LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { ButtonLink } from "@/app/ui/button";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findRule } from "@/lib/learn/lessons";
import { devOnly } from "../../../dev-only";
import { BASE, MODULE, topicHref } from "../../module";

const t = dictionary("en");

type Params = { params: Promise<{ lesson: string; topic: string }> };

export function generateStaticParams() {
  return MODULE.lesson.sections.flatMap((section) =>
    section.rules.map((rule) => ({ lesson: section.id, topic: rule.id })),
  );
}

// Developer tool: one topic of the English Pronunciation module, with Learn's own parts, as its
// topic screen in Learn shows it, without logging in or saving it as read.
export default function DevTopicPage({ params }: Params) {
  devOnly();
  return (
    <Suspense fallback={<LessonLoading />}>
      <Topic params={params} />
    </Suspense>
  );
}

async function Topic({ params }: Params) {
  const { lesson: sectionId, topic: ruleId } = await params;
  const place = findRule(MODULE.lesson, sectionId, ruleId);
  if (!place) notFound();
  const { section, rule, position, count, previous, next } = place;

  return (
    <LessonScreen
      lang="en"
      back={{ href: BASE, label: t.lesson.back(MODULE.lesson.title), text: MODULE.lesson.title }}
      progress={{ position, count, label: t.lesson.position(section.title, position, count) }}
      footer={
        <div className={`grid w-full gap-3 ${previous ? "grid-cols-[1fr_2fr]" : ""}`}>
          {previous && (
            <ButtonLink href={topicHref(previous.section, previous.rule)} replace variant="secondary" className="min-h-14">
              {t.lesson.previous}
            </ButtonLink>
          )}
          {next ? (
            <ButtonLink href={topicHref(next.section, next.rule)} replace>
              {t.lesson.next}
            </ButtonLink>
          ) : (
            <ButtonLink href={BASE}>{t.lesson.done}</ButtonLink>
          )}
        </div>
      }
    >
      <title>{`${rule.title} · ${section.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{section.title}</Eyebrow>
          <h1 className="text-title font-bold">{rule.title}</h1>
        </div>
        <Theory text={rule.theory} />
      </div>

      <RuleBody rule={rule} dialectName={t.lesson.dialects.be} t={t.lesson} />
      {rule === section.rules[0] && !rule.sounds && <SectionLetters rules={section.rules.slice(1)} />}
    </LessonScreen>
  );
}
