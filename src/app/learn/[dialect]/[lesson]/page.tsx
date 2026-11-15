import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icon";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { Pill } from "@/app/ui/surface";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findLesson, isReady, lessonHref, lessonNumber, lessonParams } from "@/lib/learn/lessons";
import { LessonLoading, LessonScreen } from "./lesson-screen";

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
  const ready = isReady(lesson);
  const first = lesson.sections.find(isReady);

  return (
    <LessonScreen
      lang={language}
      back={{ href: "/learn", label: t.lesson.leave }}
      footer={
        // Straight to the first topic. The lists below are for looking one up. A lesson still
        // being written has nothing to start yet.
        first && (
          <ButtonLink href={lessonHref(dialect, lesson, first, first.rules[0])}>{t.lesson.start}</ButtonLink>
        )
      }
    >
      <title>{t.title(lesson.title)}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(lessonNumber(found))}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
        {!ready && <Pill>{t.lesson.comingSoon}</Pill>}
      </div>

      {lesson.expectations.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-heading font-bold">{t.lesson.expect}</h2>
          <ul className="flex flex-col gap-4">
            {lesson.expectations.map((expectation) => (
              <li key={expectation.title} className="flex items-center gap-4">
                {isIconName(expectation.icon) && <Icon name={expectation.icon} size={28} />}
                <span className="text-body">{expectation.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        {!ready && <p className="text-body">{t.lesson.inTheMaking}</p>}
        <ListRows>
          {lesson.sections.map((section) => (
            // A section still being written names its planned topics, or says what it's about.
            <ListRow
              key={section.id}
              href={isReady(section) ? lessonHref(dialect, lesson, section) : undefined}
              title={section.title}
              caption={
                isReady(section)
                  ? t.lesson.topics(section.rules.length)
                  : (section.planned?.join(" · ") ?? section.description)
              }
            />
          ))}
        </ListRows>
      </section>
    </LessonScreen>
  );
}
