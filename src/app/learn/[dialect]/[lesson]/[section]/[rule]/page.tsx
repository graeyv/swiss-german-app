import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
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
  const { dialect, lesson: lessonId, section: sectionId, rule: ruleId } = await params;
  const found = findLesson(dialect, lessonId);
  const section = found && findSection(found.lesson, sectionId);
  const index = section ? section.rules.findIndex((rule) => rule.id === ruleId) : -1;
  if (!found || !section || index === -1) notFound();
  const t = dictionary(found.language);
  const rule = section.rules[index];
  const next = section.rules[index + 1];
  const sectionHref = `/learn/${dialect}/${lessonId}/${section.id}`;
  const dialectName = t.lesson.dialects[dialect] ?? dialect;

  return (
    <LessonScreen
      lang={found.language}
      back={{ href: sectionHref, label: t.lesson.back(section.title) }}
      footer={
        next ? (
          <Link href={`${sectionHref}/${next.id}`} className={primaryButton}>
            {t.lesson.next}: {next.title}
          </Link>
        ) : (
          <Link href={sectionHref} className={secondaryButton}>
            {t.lesson.overview}
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

      <div className="flex gap-3 rounded-2xl bg-highlight px-4 py-3">
        <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 size-5 shrink-0">
          <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.553 7.553 0 0 1-2.274 0Z" />
        </svg>
        <p>
          <span className="block text-sm font-semibold">{t.lesson.remember}</span>
          {rule.takeaway}
        </p>
      </div>
    </LessonScreen>
  );
}
