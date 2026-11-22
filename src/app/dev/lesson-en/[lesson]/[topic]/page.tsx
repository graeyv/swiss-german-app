import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Theory } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/rule-body";
import { MarkedWord } from "@/app/exercises/pronunciation/parts";
import { ListenButton } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/listen-button";
import { LessonLoading, LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { ButtonLink } from "@/app/ui/button";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { devOnly } from "../../../dev-only";
import { BASE, LESSONS, MODULE, type Sound, type Topic, topicHref, written } from "../../content";

const t = dictionary("en");

type Params = { params: Promise<{ lesson: string; topic: string }> };

export function generateStaticParams() {
  return LESSONS.flatMap((lesson) => written(lesson).map((topic) => ({ lesson: lesson.id, topic: topic.id })));
}

// Developer tool: one topic of the English Pronunciation module, as a Learn topic screen: the bar
// with its place in the lesson, the lesson's name above the title, the text, the sounds, and Back
// and Next at the bottom.
export default function DevTopicPage({ params }: Params) {
  devOnly();
  return (
    <Suspense fallback={<LessonLoading />}>
      <Topic params={params} />
    </Suspense>
  );
}

async function Topic({ params }: Params) {
  const { lesson: lessonId, topic: topicId } = await params;
  const lesson = LESSONS.find((each) => each.id === lessonId);
  const topics = lesson ? written(lesson) : [];
  const index = topics.findIndex((each) => each.id === topicId);
  if (!lesson || index === -1) notFound();
  const topic = topics[index];
  const previous = topics[index - 1];
  const next = topics[index + 1];

  return (
    <LessonScreen
      lang="en"
      back={{ href: BASE, label: t.lesson.back(MODULE.title), text: MODULE.title }}
      progress={{
        position: index + 1,
        count: topics.length,
        label: t.lesson.position(lesson.title, index + 1, topics.length),
      }}
      footer={
        // Back beside the main button, smaller, so going on stays the main thing.
        <div className={`grid w-full gap-3 ${previous ? "grid-cols-[1fr_2fr]" : ""}`}>
          {previous && (
            <ButtonLink href={topicHref(lesson, previous)} replace variant="secondary" className="min-h-14">
              {t.lesson.previous}
            </ButtonLink>
          )}
          {next ? (
            <ButtonLink href={topicHref(lesson, next)} replace>
              {t.lesson.next}
            </ButtonLink>
          ) : (
            <ButtonLink href={BASE}>{t.lesson.done}</ButtonLink>
          )}
        </div>
      }
    >
      <title>{`${topic.title} · ${lesson.title} – dev`}</title>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>{lesson.title}</Eyebrow>
          <h1 className="text-title font-bold">{topic.title}</h1>
        </div>
        {topic.theory && <Theory text={topic.theory} />}
      </div>

      {topic.sounds && <SoundList sounds={topic.sounds} />}
      {/* The lesson's first topic shows what's coming: the letters of the topics after it. */}
      {index === 0 && <LessonLetters topics={topics.slice(1)} />}
    </LessonScreen>
  );
}

// What a lesson covers, at its start: each later topic's title, and below it its letters in mist
// circles, as on the topic's cards. Only to look at: the topics follow with Next.
function LessonLetters({ topics }: { topics: Topic[] }) {
  const withSounds = topics.filter((topic) => topic.sounds);
  if (withSounds.length === 0) return null;
  return (
    <section className="flex flex-col gap-6">
      {withSounds.map((topic) => (
        <div key={topic.id} className="flex flex-col gap-3">
          <h2 className="text-body font-bold">{topic.title}</h2>
          <ul className="flex flex-wrap gap-2">
            {topic.sounds!.map((sound) => (
              <li
                key={sound.letter}
                className="flex size-11 items-center justify-center rounded-full bg-mist text-subtitle font-bold"
              >
                {sound.letter}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

// The proposed sound list: one mist card per letter, the letter large beside what it sounds like,
// and below, on an ivory strip inside the card, the Swiss German word with its meaning and its
// round play button. The button shares the strip only with the word, so it's clear the word is
// what plays. See DESIGN.md (not decided yet).
function SoundList({ sounds }: { sounds: Sound[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {sounds.map((sound) => (
        <li key={sound.letter} className="flex flex-col gap-3 rounded-3xl bg-mist p-4">
          <div className="flex items-center gap-4 px-2">
            <span className="w-8 shrink-0 text-title font-bold">{sound.letter}</span>
            <span className="text-body">
              {/* The letters that make the sound underlined in sage, as in the pronunciation exercises. */}
              <MarkedWord word={sound.like} small />
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-ivory py-2 pr-2 pl-4">
            <span className="flex min-w-0 flex-1 flex-col">
              <span lang="gsw" className="text-subtitle font-bold">
                {sound.word}
              </span>
              <span className="text-caption text-teal-soft">{sound.meaning}</span>
            </span>
            <ListenButton url={null} label={`${t.lesson.listen}: ${sound.word}`} noRecordingLabel={t.lesson.noRecording} />
          </div>
        </li>
      ))}
    </ul>
  );
}
