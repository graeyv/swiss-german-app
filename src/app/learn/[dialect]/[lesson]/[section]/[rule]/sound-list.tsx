import { MarkedWord } from "@/app/exercises/pronunciation/parts";
import type { Dictionary } from "@/lib/i18n";
import type { Rule, Sound, SoundWord } from "@/lib/learn/lessons";
import { ListenButton } from "./listen-button";

// A topic's letters and their words, as in the English pronunciation. Several letters each get a
// mist card; one letter's words are a quiet list, like the phrases. See DESIGN.md.
export function Sounds({ sounds, t }: { sounds: Sound[]; t: Dictionary["lesson"] }) {
  return sounds.length > 1 ? <SoundCards sounds={sounds} t={t} /> : <WordList words={sounds[0].words} t={t} />;
}

// One mist card per letter: the letter large beside what it sounds like, its English word's letters
// underlined in sage, and below, each on an ivory strip inside the card, the words with their
// meaning and a round play button. A button shares its strip only with its word, so it's clear
// the word is what plays.
function SoundCards({ sounds, t }: { sounds: Sound[]; t: Dictionary["lesson"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {sounds.map((sound) => (
        <li key={sound.letter} className="flex flex-col gap-3 rounded-3xl bg-mist p-4">
          <div className="flex items-center gap-4 px-2">
            <span className="min-w-8 shrink-0 text-title font-bold">{sound.letter}</span>
            {sound.like && (
              <span className="text-body">
                <MarkedWord word={sound.like} small />
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {sound.words.map((word) => (
              <li key={word.word} className="flex items-center gap-3 rounded-2xl bg-ivory py-2 pr-2 pl-4">
                <Word word={word} />
                <Listen word={word} t={t} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

// One letter's words: each in subtitle size, its meaning below, its play button on the right, and
// space between them. No cards and no colour.
function WordList({ words, t }: { words: SoundWord[]; t: Dictionary["lesson"] }) {
  return (
    <ul className="flex flex-col gap-6">
      {words.map((word) => (
        <li key={word.word} className="flex items-center gap-3">
          <Word word={word} />
          <Listen word={word} t={t} />
        </li>
      ))}
    </ul>
  );
}

function Word({ word }: { word: SoundWord }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span lang="gsw" className="text-subtitle font-bold break-words">
        {word.word}
      </span>
      <span className="text-caption text-teal-soft">{word.meaning}</span>
    </span>
  );
}

function Listen({ word, t }: { word: SoundWord; t: Dictionary["lesson"] }) {
  return <ListenButton url={word.audio} label={`${t.listen}: ${word.word}`} noRecordingLabel={t.noRecording} />;
}

// What a section covers, on its first topic when that has no letters of its own: the letters of
// the topics after it in mist circles (pills for a combination such as SCH). Under each topic's
// title when a topic has several letters, as the vowels; in one row when each has one, as J, W, Z
// and SCH. Only to look at: the topics follow with Next.
export function SectionLetters({ rules }: { rules: Rule[] }) {
  const withSounds = rules.filter((rule) => rule.sounds && rule.sounds.length > 0);
  if (withSounds.length === 0) return null;
  if (withSounds.every((rule) => rule.sounds!.length === 1)) {
    return <Letters sounds={withSounds.flatMap((rule) => rule.sounds!)} />;
  }
  return (
    <section className="flex flex-col gap-6">
      {withSounds.map((rule) => (
        <div key={rule.id} className="flex flex-col gap-3">
          <h2 className="text-body font-bold">{rule.title}</h2>
          <Letters sounds={rule.sounds!} />
        </div>
      ))}
    </section>
  );
}

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
