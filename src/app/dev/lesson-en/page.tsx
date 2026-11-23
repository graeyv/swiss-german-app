import type { LessonListItem } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonList } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { lessonNumber } from "@/lib/learn/lessons";
import { devOnly } from "../dev-only";
import { MODULE, topicHref } from "./module";

const t = dictionary("en");

// Developer tool: the English track's Pronunciation module as its module page in Learn shows it,
// from its lesson file, without logging in. Its topics open below this one. Nothing is saved as
// read, so everything shows as new.
export default function DevPronunciationPage() {
  devOnly();
  const { lesson } = MODULE;
  const lessons: LessonListItem[] = lesson.sections.map((section, sectionIndex) => ({
    id: section.id,
    title: section.title,
    caption: t.lesson.topics(section.rules.length),
    topics: section.rules.map((rule, index) => ({
      title: rule.title,
      href: topicHref(section, rule),
      read: false,
      next: sectionIndex === 0 && index === 0,
    })),
  }));
  const [first] = lesson.sections;

  return (
    <LessonScreen
      lang="en"
      back={{ href: "/dev/design", label: "Design" }}
      footer={<ButtonLink href={topicHref(first, first.rules[0])}>{t.lesson.start}</ButtonLink>}
    >
      <title>{`${lesson.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(lessonNumber(MODULE))}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.expect}</h2>
        <ul className="flex flex-col gap-4">
          {lesson.expectations.map((expectation) => (
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
