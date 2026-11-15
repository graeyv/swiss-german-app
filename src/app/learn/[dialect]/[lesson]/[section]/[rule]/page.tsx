import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findLesson, findRule, lessonHref, ruleParams } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { ExampleList } from "./example-list";

export function generateStaticParams() {
  return ruleParams();
}

// One rule: what differs, examples to listen to on both sides, and the takeaway.
export default function RulePage({
  params,
}: PageProps<"/learn/[dialect]/[lesson]/[section]/[rule]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <RuleView params={params} />
    </Suspense>
  );
}

async function RuleView({
  params,
}: Pick<PageProps<"/learn/[dialect]/[lesson]/[section]/[rule]">, "params">) {
  const { dialect, lesson: lessonId, section: sectionId, rule: ruleId } = await params;
  const found = findLesson(dialect, lessonId);
  const place = found && findRule(found.lesson, sectionId, ruleId);
  if (!found || !place) notFound();
  const { lesson, language } = found;
  const { section, rule, next } = place;
  const t = dictionary(language);
  const dialectName = t.lesson.dialects[dialect] ?? dialect;
  const nextHref = next && lessonHref(dialect, lesson, next.section, next.rule);

  return (
    <LessonScreen
      lang={language}
      back={{
        href: lessonHref(dialect, lesson, section),
        label: t.lesson.back(section.title),
      }}
      progress={{
        position: place.position,
        count: place.count,
        label: t.lesson.position(section.title, place.position, place.count),
      }}
      footer={
        nextHref ? (
          // Within a section the next topic is named, and at its end the next section.
          <ButtonLink href={nextHref}>
            {t.lesson.next}: {next.section === section ? next.rule.title : next.section.title}
          </ButtonLink>
        ) : (
          <ButtonLink href={lessonHref(dialect, lesson)}>{t.lesson.done}</ButtonLink>
        )
      }
    >
      <title>{t.title(`${rule.title} · ${section.title}`)}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{section.title}</Eyebrow>
          <h1 className="text-title font-bold">{rule.title}</h1>
        </div>
        <p className="text-body">{rule.theory}</p>
      </div>

      <ExampleList examples={rule.examples} dialectName={dialectName} t={t.lesson} />

      <Takeaway label={t.lesson.remember}>{rule.takeaway}</Takeaway>
    </LessonScreen>
  );
}
