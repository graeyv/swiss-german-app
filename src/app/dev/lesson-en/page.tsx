import type { LessonListItem } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonList } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { devOnly } from "../dev-only";
import { LESSONS, MODULE, topicHref } from "./content";

const t = dictionary("en");

// Developer tool: the English track's Pronunciation module while it's being written, as its module
// page will look in Learn. Its topics open as their own screens below this one. Nothing is saved
// as read.
export default function DevPronunciationPage() {
  devOnly();
  const lessons: LessonListItem[] = LESSONS.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    caption: t.lesson.topics(lesson.topics.length),
    topics: lesson.topics.map((topic, index) => ({
      title: topic.title,
      // Topics still to write show inactive, with "Coming soon".
      href: topic.theory !== undefined ? topicHref(lesson, topic) : undefined,
      read: false,
      next: lesson === LESSONS[0] && index === 0,
    })),
  }));
  const [first] = LESSONS;

  return (
    <LessonScreen
      lang="en"
      back={{ href: "/dev/design", label: "Design" }}
      footer={<ButtonLink href={topicHref(first, first.topics[0])}>{t.lesson.start}</ButtonLink>}
    >
      <title>{`${MODULE.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(MODULE.number)}</Eyebrow>
          <h1 className="text-title font-bold">{MODULE.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{MODULE.subtitle}</Highlight>
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.expect}</h2>
        <ul className="flex flex-col gap-4">
          {MODULE.expectations.map((expectation) => (
            <li key={expectation.title} className="flex items-center gap-4">
              {isIconName(expectation.icon) && <Icon name={expectation.icon} size={28} className="text-teal-soft" />}
              <span className="text-body">{expectation.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        <LessonList lessons={lessons} open={first.id} comingSoon={t.lesson.comingSoon} />
      </section>
    </LessonScreen>
  );
}
