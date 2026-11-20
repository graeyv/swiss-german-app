"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LessonList, type LessonListItem } from "@/app/learn/[dialect]/[lesson]/lesson-list";
import { LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { RuleBody, Theory } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/rule-body";
import { ButtonLink } from "@/app/ui/button";
import { Icon, type IconName, isIconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary, type Locale } from "@/lib/i18n";
import { type Lesson, lessonsFor, type Rule } from "@/lib/learn/lessons";
import englishFile from "./english-b2.json";
import germanIntroFile from "./german-intro.json";
import variantsFile from "./topic-variants.json";

// Proposed curricula, laid out as in the app: the Learn tab's module list, the module pages, and
// every topic with content. ?track=de for the German track (English by default), &module=… for a
// module, &lesson=…&topic=0 for a topic. A lesson's topics still to come are its planned ones.

type Track = {
  locale: Locale;
  // The modules with content, in the lesson format.
  written: Lesson[];
  // Modules after them that only have a title so far.
  later: { id: string; title: string; icon: IconName }[];
};

const TRACKS: Record<Locale, Track> = {
  // Proposal B2, with the content brief's texts.
  en: {
    locale: "en",
    written: englishFile as unknown as Lesson[],
    later: [
      { id: "building-sentences", title: "Building sentences", icon: "puzzle" },
      { id: "expanding-your-grammar", title: "Expanding your grammar", icon: "grid" },
      { id: "everyday-communication", title: "Everyday communication", icon: "chat" },
      { id: "talking-about-your-life", title: "Talking about your life", icon: "user" },
      { id: "becoming-fluent", title: "Becoming fluent", icon: "sparkles" },
    ],
  },
  // A short first module proposed for German speakers, then the track's modules as they are.
  de: {
    locale: "de",
    written: [germanIntroFile as unknown as Lesson, ...lessonsFor("de").map(({ lesson }) => lesson)],
    later: [],
  },
};

// Other versions of a topic's content, by the topic's id, to compare: ?variant=… picks one.
const VARIANTS = variantsFile as unknown as Record<string, Record<string, Rule>>;

const HERE = "/dev/design/curriculum";
const listHref = (track: Track) => `${HERE}?track=${track.locale}`;
const moduleHref = (track: Track, lesson: Lesson) => `${listHref(track)}&module=${lesson.id}`;
const topicHref = (track: Track, lesson: Lesson, section: string, topic: number) =>
  `${moduleHref(track, lesson)}&lesson=${section}&topic=${topic}`;
const topicCount = (lesson: Lesson) =>
  lesson.sections.reduce((sum, section) => sum + section.rules.length + (section.planned?.length ?? 0), 0);
const isWritten = (lesson: Lesson) => lesson.sections.some((section) => section.rules.length > 0);

export function CurriculumPreview() {
  const params = useSearchParams();
  const track = TRACKS[params.get("track") === "de" ? "de" : "en"];
  const lesson = track.written.find((each) => each.id === params.get("module"));
  const section = lesson?.sections.find((each) => each.id === params.get("lesson"));
  const index = Number(params.get("topic"));
  if (lesson && section && section.rules[index]) {
    return <Topic track={track} lesson={lesson} sectionId={section.id} index={index} variant={params.get("variant")} />;
  }
  if (lesson) return <ModulePage track={track} lesson={lesson} />;
  return <ModuleList track={track} />;
}

// The Learn tab's module list, as the app shows it: modules without content carry the pill.
function ModuleList({ track }: { track: Track }) {
  const t = dictionary(track.locale);
  return (
    <main lang={track.locale} className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-6">
      <title>Curriculum – dev</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold">{t.nav.learn}</h1>
        <p className="text-subtitle font-semibold">{t.learn.intro}</p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{t.learn.allModules}</h2>
        <ListRows>
          {track.written.map((lesson, index) => (
            <ListRow
              key={lesson.id}
              href={moduleHref(track, lesson)}
              icon={isIconName(lesson.icon) ? lesson.icon : undefined}
              eyebrow={t.lesson.number(index + 1)}
              title={lesson.title}
              caption={
                topicCount(lesson) > 0
                  ? `${t.lesson.sections(lesson.sections.length)} · ${t.lesson.topics(topicCount(lesson))}`
                  : t.lesson.sections(lesson.sections.length)
              }
              comingSoon={isWritten(lesson) ? undefined : t.lesson.comingSoon}
            />
          ))}
          {track.later.map((later, index) => (
            <ListRow
              key={later.id}
              icon={later.icon}
              eyebrow={t.lesson.number(track.written.length + index + 1)}
              title={later.title}
              comingSoon={t.lesson.comingSoon}
            />
          ))}
        </ListRows>
      </section>
    </main>
  );
}

// A module's page, as the app lays it out, with its lessons unfolding their topics: those with
// content first, then those still to come.
function ModulePage({ track, lesson }: { track: Track; lesson: Lesson }) {
  const t = dictionary(track.locale);
  const lessons: LessonListItem[] = lesson.sections.map((section) => ({
    id: section.id,
    title: section.title,
    caption: t.lesson.topics(section.rules.length + (section.planned?.length ?? 0)),
    // Unlike in the app, a lesson with nothing written yet still unfolds its planned topics, to
    // review the structure.
    topics: [
      ...section.rules.map((rule, index) => ({
        title: rule.title,
        href: topicHref(track, lesson, section.id, index),
        read: false,
        next: index === 0,
      })),
      ...(section.planned ?? []).map((title) => ({ title, read: false, next: false })),
    ],
  }));
  const firstWritten = lesson.sections.find((section) => section.rules.length > 0)?.id;
  const open = firstWritten ?? lesson.sections[0]?.id;

  return (
    <LessonScreen
      lang={track.locale}
      back={{ href: listHref(track), label: t.lesson.leave }}
      footer={
        firstWritten ? (
          <ButtonLink href={topicHref(track, lesson, firstWritten, 0)}>{t.lesson.start}</ButtonLink>
        ) : undefined
      }
    >
      <title>{`${lesson.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t.lesson.number(track.written.indexOf(lesson) + 1)}</Eyebrow>
          <h1 className="text-title font-bold">{lesson.title}</h1>
        </div>
        <p className="text-subtitle font-semibold">
          <Highlight>{lesson.subtitle}</Highlight>
        </p>
        <p className="text-body">{lesson.description}</p>
      </div>

      {lesson.expectations.length > 0 && (
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
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-bold">{t.lesson.topicsHeading}</h2>
        <LessonList lessons={lessons} open={open} comingSoon={t.lesson.comingSoon} />
      </section>
    </LessonScreen>
  );
}

// A topic, as the app lays it out: the module named at the top, its lesson's progress, "Back"
// and "Next" at the bottom, on to the next lesson with content after the last topic.
function Topic({
  track,
  lesson,
  sectionId,
  index,
  variant,
}: {
  track: Track;
  lesson: Lesson;
  sectionId: string;
  index: number;
  variant: string | null;
}) {
  const t = dictionary(track.locale);
  const all = lesson.sections.flatMap((section) => section.rules.map((rule, position) => ({ section, rule, position })));
  const at = all.findIndex((item) => item.section.id === sectionId && item.position === index);
  const { section } = all[at];
  // The topic as written, or one of its other versions.
  const versions = VARIANTS[all[at].rule.id];
  const rule = (variant && versions?.[variant]) || all[at].rule;
  const here = topicHref(track, lesson, section.id, index);
  const previous = all[at - 1];
  const next = all[at + 1];
  const dialectName = t.lesson.dialects.be;

  const back = previous && (
    <ButtonLink
      href={topicHref(track, lesson, previous.section.id, previous.position)}
      replace
      variant="secondary"
      className="min-h-14"
    >
      <Icon name="back" size={20} />
      {t.lesson.previous}
    </ButtonLink>
  );

  return (
    <LessonScreen
      lang={track.locale}
      back={{ href: moduleHref(track, lesson), label: t.lesson.back(lesson.title), text: lesson.title }}
      progress={{
        position: index + 1,
        count: section.rules.length,
        label: t.lesson.position(section.title, index + 1, section.rules.length),
      }}
      footer={
        <div className={`grid w-full gap-3 ${back ? "grid-cols-[1fr_2fr]" : ""}`}>
          {back}
          {next ? (
            <ButtonLink href={topicHref(track, lesson, next.section.id, next.position)} replace>
              {t.lesson.next}: {next.section === section ? next.rule.title : next.section.title}
            </ButtonLink>
          ) : (
            <ButtonLink href={moduleHref(track, lesson)}>{t.lesson.done}</ButtonLink>
          )}
        </div>
      }
    >
      <title>{`${rule.title} – dev`}</title>
      {versions && (
        <div className="-mb-4 flex flex-wrap gap-1.5">
          {["Written", ...Object.keys(versions)].map((name) => {
            const current = name === "Written" ? !variant || !versions[variant] : variant === name;
            return (
              <Link
                key={name}
                href={name === "Written" ? here : `${here}&variant=${encodeURIComponent(name)}`}
                replace
                className={`flex min-h-11 items-center rounded-full px-4 text-caption font-semibold ${
                  current ? "bg-teal text-ivory" : "bg-mist"
                }`}
              >
                {name}
              </Link>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{section.title}</Eyebrow>
          <h1 className="text-title font-bold">{rule.title}</h1>
        </div>
        <Theory text={rule.theory} />
      </div>
      <RuleBody
        rule={rule}
        dialectName={dialectName}
        accent={lesson.accent ? (t.lesson.accents.be ?? dialectName) : undefined}
        t={t.lesson}
      />
    </LessonScreen>
  );
}
