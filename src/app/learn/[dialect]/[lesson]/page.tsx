import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/server";
import { findLesson } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen, ListLink, listClass } from "./lesson-screen";

// A Learn lesson's overview: its sections, such as consonants and vowels, to open one by one.
export default function LessonPage({ params }: PageProps<"/learn/[dialect]/[lesson]">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: Pick<PageProps<"/learn/[dialect]/[lesson]">, "params">) {
  const [{ dialect, lesson: id }, t] = await Promise.all([params, getDictionary()]);
  const lesson = findLesson(dialect, id);
  if (!lesson) notFound();

  return (
    <LessonScreen back={{ href: "/learn", label: t.lesson.leave }}>
      <title>{t.title(lesson.title)}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="font-semibold text-accent">{lesson.subtitle}</p>
        <p className="text-muted">{lesson.description}</p>
      </div>

      <ul className={listClass}>
        {lesson.sections.map((section) => (
          <li key={section.id}>
            <ListLink
              href={`/learn/${dialect}/${id}/${section.id}`}
              title={section.title}
              text={t.lesson.rules(section.rules.length)}
            />
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted">{lesson.note}</p>
    </LessonScreen>
  );
}
