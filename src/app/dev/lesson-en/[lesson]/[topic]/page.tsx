import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarkedWord } from "@/app/exercises/pronunciation/parts";
import { ListenButton } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/listen-button";
import { LessonLoading, LessonScreen } from "@/app/learn/[dialect]/[lesson]/lesson-screen";
import { ButtonLink } from "@/app/ui/button";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { devOnly } from "../../../dev-only";
import { BASE, LESSONS, MODULE, type Sound, type Topic, type Word, topicHref, written } from "../../content";

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
        {topic.theory && <MarkedTheory text={topic.theory} />}
      </div>

      {/* Several letters in a topic each get a card; one letter's words are a quiet list, as in the
          German pronunciation topics. */}
      {topic.sounds &&
        (topic.sounds.length > 1 ? <SoundList sounds={topic.sounds} /> : <WordList words={topic.sounds[0].words} />)}
      {/* The lesson's first topic shows what's coming: the letters of the topics after it. */}
      {index === 0 && <LessonLetters topics={topics.slice(1)} />}
    </LessonScreen>
  );
}

// A topic's text, one paragraph per part separated by an empty line, as Learn's, with its bracketed
// letters underlined in sage, such as the y in "yes".
function MarkedTheory({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index} className="text-body">
      <MarkedWord word={paragraph} small />
    </p>
  ));
}

// One letter's words, as a quiet list like Learn's phrases: each word in subtitle size, its meaning
// below, its play button on the right, and space between them. No cards and no colour.
function WordList({ words }: { words: Word[] }) {
  return (
    <ul className="flex flex-col gap-6">
      {words.map(({ word, meaning }) => (
        <li key={word} className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p lang="gsw" className="text-subtitle font-bold break-words">
              {word}
            </p>
            <p className="text-caption text-teal-soft">{meaning}</p>
          </div>
          <ListenButton url={null} label={`${t.lesson.listen}: ${word}`} noRecordingLabel={t.lesson.noRecording} />
        </li>
      ))}
    </ul>
  );
}

// What a lesson covers, at its start: the letters of its later topics in mist circles, as on the
// topics' cards. Grouped under each topic's title when a topic has several letters, as the vowels
// and consonants; in one row when each topic has one, as J, W, Z and SCH. Only to look at: the
// topics follow with Next.
function LessonLetters({ topics }: { topics: Topic[] }) {
  const withSounds = topics.filter((topic) => topic.sounds && topic.sounds.length > 0);
  if (withSounds.length === 0) return null;
  if (withSounds.every((topic) => topic.sounds!.length === 1)) {
    return <Letters sounds={withSounds.flatMap((topic) => topic.sounds!)} />;
  }
  return (
    <section className="flex flex-col gap-6">
      {withSounds.map((topic) => (
        <div key={topic.id} className="flex flex-col gap-3">
          <h2 className="text-body font-bold">{topic.title}</h2>
          <Letters sounds={topic.sounds!} />
        </div>
      ))}
    </section>
  );
}

// Letters in mist circles, or pills for a combination such as SCH.
function Letters({ sounds }: { sounds: Sound[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {sounds.map((sound) => (
        <li
          key={sound.letter}
          className="flex h-11 min-w-11 items-center justify-center rounded-full bg-mist px-3 text-subtitle font-bold"
        >
          {sound.letter}
        </li>
      ))}
    </ul>
  );
}

// The proposed sound list: one mist card per letter, the letter large beside what it sounds like,
// and below, each on an ivory strip inside the card, the Swiss German words with their meaning and
// a round play button. A button shares its strip only with its word, so it's clear the word is
// what plays. See DESIGN.md (not decided yet).
function SoundList({ sounds }: { sounds: Sound[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {sounds.map((sound) => (
        <li key={sound.letter} className="flex flex-col gap-3 rounded-3xl bg-mist p-4">
          <div className="flex items-center gap-4 px-2">
            <span className="min-w-8 shrink-0 text-title font-bold">{sound.letter}</span>
            <span className="text-body">
              {/* The letters that make the sound underlined in sage, as in the pronunciation exercises. */}
              <MarkedWord word={sound.like ?? ""} small />
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {sound.words.map(({ word, meaning }) => (
              <li key={word} className="flex items-center gap-3 rounded-2xl bg-ivory py-2 pr-2 pl-4">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span lang="gsw" className="text-subtitle font-bold">
                    {word}
                  </span>
                  <span className="text-caption text-teal-soft">{meaning}</span>
                </span>
                <ListenButton url={null} label={`${t.lesson.listen}: ${word}`} noRecordingLabel={t.lesson.noRecording} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
