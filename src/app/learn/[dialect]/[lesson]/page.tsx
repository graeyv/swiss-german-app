import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
import { findLesson, lessonHref, lessonParams } from "@/lib/learn/lessons";
import { LessonIcon } from "./lesson-icon";
import { LessonLoading, LessonScreen, ListLink, listClass } from "./lesson-screen";

export function generateStaticParams() {
  return lessonParams();
}

// A Learn lesson's overview: its sections, such as consonants and vowels, to open one by one.
export default function LessonPage({ params }: PageProps<"/learn/[dialect]/[lesson]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]">, "params">) {
  const { dialect, lesson: id } = await params;
  const found = findLesson(dialect, id);
  if (!found) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);
  const [first] = lesson.sections;

  return (
    <LessonScreen
      lang={language}
      back={{ href: "/learn", label: t.lesson.leave }}
      footer={
        // Straight to the first topic. The lists below are for looking one up.
        <Link
          href={lessonHref(dialect, lesson, first, first.rules[0])}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t.lesson.start}
        </Link>
      }
    >
      <title>{t.title(lesson.title)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="font-semibold text-accent">{lesson.subtitle}</p>
        <p className="text-muted">{lesson.description}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">{t.lesson.expect}</h2>
        <ul className="flex flex-col gap-4">
          {lesson.expectations.map((expectation) => (
            <li key={expectation.title} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface">
                <LessonIcon name={expectation.icon} />
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{expectation.title}</span>
                <span className="text-sm text-muted">{expectation.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">{t.lesson.topicsHeading}</h2>
        <ul className={listClass}>
          {lesson.sections.map((section) => (
            <li key={section.id}>
              <ListLink
                href={lessonHref(dialect, lesson, section)}
                title={section.title}
                text={t.lesson.topics(section.rules.length)}
              />
            </li>
          ))}
        </ul>
      </section>
    </LessonScreen>
  );
}
