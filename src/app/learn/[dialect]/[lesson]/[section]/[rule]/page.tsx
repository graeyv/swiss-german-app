import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
import {
  findLesson,
  findRule,
  lessonHref,
  ruleParams,
} from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen } from "../../lesson-screen";
import { ListenButton } from "./listen-button";

const primaryButton =
  "flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90";

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
  const {
    dialect,
    lesson: lessonId,
    section: sectionId,
    rule: ruleId,
  } = await params;
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
      heading={t.lesson.position(section.title, place.position, place.count)}
      footer={
        nextHref ? (
          // Within a section the next topic is named, and at its end the next section.
          <Link href={nextHref} className={primaryButton}>
            {t.lesson.next}:{" "}
            {next.section === section ? next.rule.title : next.section.title}
          </Link>
        ) : (
          <Link href={lessonHref(dialect, lesson)} className={primaryButton}>
            {t.lesson.done}
          </Link>
        )
      }
    >
      <title>{t.title(`${rule.title} · ${section.title}`)}</title>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">{rule.title}</h1>
        <p>{rule.theory}</p>
      </div>

      {/* The sides are named once, above their columns. Where the sound changes, the dialect side
          is highlighted, so the difference stands out from the words that sound the same. Each word
          heads its own row, so on a phone both sides get half the width for their sound. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full table-fixed divide-y divide-line">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="px-3 pt-3 pb-2 font-semibold">
                {t.lesson.standardGerman}
              </th>
              <th scope="col" className="px-3 pt-3 pb-2 font-semibold">
                {dialectName}
              </th>
            </tr>
          </thead>
          {rule.examples.map((example) => {
            const differs =
              example.pronunciation.dialect !==
              example.pronunciation.standardGerman;
            return (
              <tbody key={example.word}>
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={2}
                    className="px-3 pt-3 text-left font-normal"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 text-lg font-semibold break-words">
                        {example.word}
                      </span>
                      {/* Only sameness is spelled out; a difference shows in the dialect cell. */}
                      {!differs && (
                        <span className="shrink-0 rounded-full bg-tint-green px-2.5 py-0.5 text-xs font-semibold text-success">
                          = {t.lesson.same}
                        </span>
                      )}
                    </span>
                  </th>
                </tr>
                <tr>
                  <td className="px-1 pb-1">
                    {example.pronunciation.standardGerman === null ? (
                      // A dialect-only word has nothing to hear on this side.
                      <span className="flex min-h-12 items-center px-2 text-sm text-muted">
                        <span aria-hidden>–</span>
                        <span className="sr-only">{t.lesson.dialectOnly}</span>
                      </span>
                    ) : (
                      <ListenButton
                        sound={example.pronunciation.standardGerman}
                        url={example.audio.standardGerman}
                        playLabel={t.lesson.play(t.lesson.standardGerman)}
                        noRecordingLabel={t.lesson.noRecording}
                      />
                    )}
                  </td>
                  <td className="px-1 pb-1">
                    <ListenButton
                      sound={example.pronunciation.dialect}
                      url={example.audio.dialect}
                      playLabel={t.lesson.play(dialectName)}
                      noRecordingLabel={t.lesson.noRecording}
                      highlighted={differs}
                    />
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>

      <div className="flex gap-3 rounded-2xl bg-highlight px-4 py-3">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 size-5 shrink-0"
        >
          <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.553 7.553 0 0 1-2.274 0Z" />
        </svg>
        <p>
          <span className="block text-sm font-semibold">
            {t.lesson.remember}
          </span>
          {rule.takeaway}
        </p>
      </div>
    </LessonScreen>
  );
}
