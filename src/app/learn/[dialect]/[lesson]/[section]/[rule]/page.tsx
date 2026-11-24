import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
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
} from "@/lib/learn/lessons";
import { rulePath } from "@/lib/learn/progress";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { MarkRead } from "./mark-read";
import { RuleBody, Theory } from "./rule-body";
import { SectionLetters } from "./sound-list";

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
              {t.practice.start}
            </ButtonLink>
            <div className={`grid gap-3 ${back ? "grid-cols-2" : ""}`}>
              {back}
              {/* The next topic, or after the module's last out to Lernen, which shows what's next. */}
              <ButtonLink href={nextHref ?? "/learn"} replace variant="secondary" className="min-h-14">
                {t.practice.later}
              </ButtonLink>
            </div>
          </div>
        ) : (
          // Back beside the main button, smaller, so going on stays the main thing.
          <div className={`grid w-full gap-3 ${back ? "grid-cols-[1fr_2fr]" : ""}`}>
            {back}
            {nextHref ? (
              // Just "Weiter": the next topic speaks for itself.
              <ButtonLink href={nextHref} replace>
                {t.lesson.next}
              </ButtonLink>
            ) : (
              // The module's last topic: out to Lernen, which shows what's next.
              <ButtonLink href="/learn" replace>
                {t.lesson.done}
              </ButtonLink>
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
        <Theory text={rule.theory} />
      </div>

      <RuleBody
        rule={rule}
        dialectName={dialectName}
        accent={lesson.accent ? (t.lesson.accents[dialect] ?? dialectName) : undefined}
        t={t.lesson}
      />
      {/* A section's first topic without letters of its own shows the letters to come. */}
      {rule === section.rules[0] && !rule.sounds && <SectionLetters rules={section.rules.slice(1)} />}
    </LessonScreen>
  );
}
