import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
import { findLesson, findSection, lessonHref, sectionParams } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen, ListLink, listClass } from "../lesson-screen";

export function generateStaticParams() {
  return sectionParams();
}

// A section of a lesson, such as the consonants: its rules, each with its takeaway, to open.
export default function SectionPage({ params }: PageProps<"/learn/[dialect]/[lesson]/[section]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Rules params={params} />
    </Suspense>
  );
}

async function Rules({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]/[section]">, "params">) {
  const { dialect, lesson: lessonId, section: sectionId } = await params;
  const found = findLesson(dialect, lessonId);
  const section = found && findSection(found.lesson, sectionId);
  if (!found || !section) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);

  return (
    <LessonScreen lang={language} back={{ href: lessonHref(dialect, lesson), label: t.lesson.back(lesson.title) }}>
      <title>{t.title(section.title)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{section.title}</h1>
        <p className="text-muted">{section.description}</p>
      </div>

      <ul className={listClass}>
        {section.rules.map((rule) => (
          <li key={rule.id}>
            <ListLink
              href={lessonHref(dialect, lesson, section, rule)}
              title={rule.title}
              text={rule.takeaway}
            />
          </li>
        ))}
      </ul>
    </LessonScreen>
  );
}
