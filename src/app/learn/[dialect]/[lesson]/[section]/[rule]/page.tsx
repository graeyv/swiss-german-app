import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/server";
import { findLesson, findSection } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { ListenButton } from "./listen-button";

const primaryButton =
  "flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90";
const secondaryButton =
  "flex min-h-12 flex-1 items-center justify-center rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-accent";

// One rule: what differs, examples to listen to on both sides, and the takeaway.
export default function RulePage({ params }: PageProps<"/learn/[dialect]/[lesson]/[section]/[rule]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <RuleView params={params} />
    </Suspense>
  );
}

async function RuleView({
  params,
}: Pick<PageProps<"/learn/[dialect]/[lesson]/[section]/[rule]">, "params">) {
  const [{ dialect, lesson: lessonId, section: sectionId, rule: ruleId }, t] = await Promise.all([
    params,
    getDictionary(),
  ]);
  const lesson = findLesson(dialect, lessonId);
  const section = lesson && findSection(lesson, sectionId);
  const index = section ? section.rules.findIndex((rule) => rule.id === ruleId) : -1;
  if (!section || index === -1) notFound();
  const rule = section.rules[index];
  const next = section.rules[index + 1];
  const sectionHref = `/learn/${dialect}/${lessonId}/${section.id}`;
  const dialectName = t.lesson.dialects[dialect] ?? dialect;

  return (
    <LessonScreen
      back={{ href: sectionHref, label: t.lesson.back(section.title) }}
      footer={
        next ? (
          <Link href={`${sectionHref}/${next.id}`} className={primaryButton}>
            {t.lesson.nextRule}: {next.title}
          </Link>
        ) : (
          <Link href={sectionHref} className={secondaryButton}>
            {t.lesson.allRules}
          </Link>
        )
      }
    >
      <title>{t.title(`${rule.title} · ${section.title}`)}</title>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-muted">{section.title}</p>
        <h1 className="text-4xl font-bold tracking-tight">{rule.title}</h1>
        <p>{rule.theory}</p>
      </div>

      <ul className="flex flex-col gap-4">
        {rule.examples.map((example) => (
          <li key={example.word} className="flex flex-col gap-2">
            <span className="text-xl font-semibold">{example.word}</span>
            <div className="grid grid-cols-2 gap-2">
              <ListenButton
                label={t.lesson.standardGerman}
                sound={example.pronunciation.standardGerman}
                url={example.audio.standardGerman}
                playLabel={t.lesson.play(t.lesson.standardGerman)}
                noRecordingLabel={t.lesson.noRecording}
              />
              <ListenButton
                label={dialectName}
                sound={example.pronunciation.dialect}
                url={example.audio.dialect}
                playLabel={t.lesson.play(dialectName)}
                noRecordingLabel={t.lesson.noRecording}
                highlighted
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="rounded-2xl bg-highlight px-4 py-3">
        <span className="block text-sm font-semibold">{t.lesson.remember}</span>
        {rule.takeaway}
      </p>
    </LessonScreen>
  );
}
