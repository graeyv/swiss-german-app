import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findLesson, findRule, lessonHref, practiceHref, roundExercises, ruleParams } from "@/lib/learn/lessons";
import { rulePath } from "@/lib/learn/progress";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { ExampleList } from "./example-list";
import { MarkRead } from "./mark-read";

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
  // The section's last topic leads to its exercises, if it has any.
  const exercises = roundExercises(section).length;
  const lastWithExercises = place.position === place.count && exercises > 0;

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
        lastWithExercises ? (
          // The end of a section with exercises: practising it comes first, going on later.
          <div className="flex w-full flex-col gap-3">
            <ButtonLink href={`${practiceHref(dialect, lesson, section)}?from=learn`}>
              <Icon name="puzzle" size={20} />
              {t.practice.practise(section.title, exercises)}
            </ButtonLink>
            <ButtonLink href={nextHref ?? lessonHref(dialect, lesson)} variant="secondary" className="min-h-14">
              {t.practice.later}
            </ButtonLink>
          </div>
        ) : nextHref ? (
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
      <MarkRead path={rulePath(dialect, lesson.id, section.id, rule.id)} />
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
