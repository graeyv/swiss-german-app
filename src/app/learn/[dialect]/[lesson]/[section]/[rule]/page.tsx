import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import {
  findLesson,
  findRule,
  lessonHref,
  mixedSection,
  practiceHref,
  roundExercises,
  ruleParams,
  sectionPath,
} from "@/lib/learn/lessons";
import { rulePath } from "@/lib/learn/progress";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { ExampleList } from "./example-list";
import { LastResult } from "./last-result";
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
  const { section, rule, previous, next } = place;
  const t = dictionary(language);
  const dialectName = t.lesson.dialects[dialect] ?? dialect;
  const nextHref = next && lessonHref(dialect, lesson, next.section, next.rule);
  // Back to the topic before, also from the first vowel to the last consonant. Like "Weiter", it
  // replaces this page in the history, so the phone's back gesture leads out of the reading.
  const back = previous && (
    <ButtonLink
      href={lessonHref(dialect, lesson, previous.section, previous.rule)}
      replace
      variant="secondary"
      className="min-h-14"
    >
      <Icon name="back" size={20} />
      {t.lesson.previous}
    </ButtonLink>
  );
  // The section's last topic leads to its exercises, if it has any, and the module's last topic to
  // the module's round, such as "Aussprache üben".
  const moduleRound = !next ? mixedSection(lesson) : undefined;
  const round = moduleRound ?? (place.position === place.count ? section : undefined);
  const exercises = round ? roundExercises(round).length : 0;
  const lastWithExercises = round !== undefined && exercises > 0;

  return (
    <LessonScreen
      lang={language}
      // Up to the module, which lists every topic, named so it's clear where it leads.
      back={{
        href: lessonHref(dialect, lesson),
        label: t.lesson.back(lesson.title),
        text: lesson.title,
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
            <ButtonLink href={`${practiceHref(dialect, lesson, round)}?from=learn`}>
              <Icon name="puzzle" size={20} />
              {t.practice.practise(round.title, exercises)}
            </ButtonLink>
            {/* The rest of the page is the same for everyone, so only this waits for the learner. */}
            <Suspense fallback={null}>
              <LastResult path={sectionPath(dialect, lesson.id, round.id)} t={t.practice} />
            </Suspense>
            <div className={`grid gap-3 ${back ? "grid-cols-2" : ""}`}>
              {back}
              <ButtonLink
                href={nextHref ?? lessonHref(dialect, lesson)}
                replace={Boolean(nextHref)}
                variant="secondary"
                className="min-h-14"
              >
                {t.practice.later}
              </ButtonLink>
            </div>
          </div>
        ) : (
          // Back beside the main button, smaller, so going on stays the main thing.
          <div className={`grid w-full gap-3 ${back ? "grid-cols-[1fr_2fr]" : ""}`}>
            {back}
            {nextHref ? (
              // Within a section the next topic is named, and at its end the next section.
              <ButtonLink href={nextHref} replace>
                {t.lesson.next}: {next.section === section ? next.rule.title : next.section.title}
              </ButtonLink>
            ) : (
              <ButtonLink href={lessonHref(dialect, lesson)}>{t.lesson.done}</ButtonLink>
            )}
          </div>
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

      <ExampleList
        examples={rule.examples}
        dialectName={dialectName}
        accent={lesson.accent ? (t.lesson.accents[dialect] ?? dialectName) : undefined}
        t={t.lesson}
      />

      <Takeaway label={t.lesson.remember}>{rule.takeaway}</Takeaway>
    </LessonScreen>
  );
}
