import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/server";
import { findLesson, findSection } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen, ListLink, listClass } from "../lesson-screen";

// A section of a lesson, such as the consonants: its rules, each with its takeaway, to open.
export default function SectionPage({ params }: PageProps<"/learn/[dialect]/[lesson]/[section]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Rules params={params} />
    </Suspense>
  );
}

async function Rules({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]/[section]">, "params">) {
  const [{ dialect, lesson: lessonId, section: sectionId }, t] = await Promise.all([
    params,
    getDictionary(),
  ]);
  const lesson = findLesson(dialect, lessonId);
  const section = lesson && findSection(lesson, sectionId);
  if (!lesson || !section) notFound();
  const base = `/learn/${dialect}/${lessonId}`;

  return (
    <LessonScreen back={{ href: base, label: t.lesson.back(lesson.title) }}>
      <title>{t.title(section.title)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{section.title}</h1>
        <p className="text-muted">{section.description}</p>
      </div>

      <ul className={listClass}>
        {section.rules.map((rule) => (
          <li key={rule.id}>
            <ListLink href={`${base}/${section.id}/${rule.id}`} title={rule.title} text={rule.takeaway} />
          </li>
        ))}
      </ul>
    </LessonScreen>
  );
}
