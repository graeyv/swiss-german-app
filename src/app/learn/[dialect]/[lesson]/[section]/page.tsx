import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { dictionary } from "@/lib/i18n";
import { findLesson, findSection, isReady, lessonHref, sectionParams } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen } from "../lesson-screen";

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
  // A section still being written has no page yet.
  if (!found || !section || !isReady(section)) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);

  return (
    <LessonScreen lang={language} back={{ href: lessonHref(dialect, lesson), label: t.lesson.back(lesson.title) }}>
      <title>{t.title(section.title)}</title>
      <div className="flex flex-col gap-3">
        <h1 className="text-title font-bold">{section.title}</h1>
        <p className="text-body">{section.description}</p>
      </div>

      <ListRows>
        {section.rules.map((rule) => (
          <ListRow
            key={rule.id}
            href={lessonHref(dialect, lesson, section, rule)}
            title={rule.title}
            caption={rule.takeaway}
          />
        ))}
      </ListRows>
    </LessonScreen>
  );
}
