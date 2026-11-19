"use client";

import { useState } from "react";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { Button, TextButton } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import type { Dictionary } from "@/lib/i18n";
import {
  isLettersRight,
  letterTiles,
  type LettersTask,
  listOf,
  markedLetters,
  type PronunciationTask,
  type RepeatTask,
  type SayTask,
} from "@/lib/exercises/pronunciation";
import { useRecorder, usePlayer } from "./audio";
import { Compare, Footer, MarkedWord, RecordButton, SelfCheck, Tip } from "./parts";

// The longest a recording takes: a word, and a sentence.
const WORD_MS = 4000;
const SENTENCE_MS = 8000;

export type PronunciationProps<T = PronunciationTask> = {
  task: T;
  texts: Dictionary;
  dialectName: string;
  // The rule that explains marked letters, such as "R", with a way to open it. Undefined if none.
  ruleFor: (letters: string) => { title: string; open: () => void } | undefined;
  // When the exercise is done: whether it was right the first time, or sounded the same.
  onDone: (right: boolean) => void;
};

// A pronunciation exercise, with its own buttons at the bottom: spotting letters is checked,
// saying a word or sentence the learner judges by comparing. Give it a key per exercise.
export function PronunciationExercise({ task, ...props }: PronunciationProps) {
  if (task.type === "letters") return <Letters task={task} {...props} />;
  if (task.type === "say") return <Say task={task} {...props} />;
  return <Repeat task={task} {...props} />;
}

// Tap the letters that sound different. Checked, the word plays in Standard German and
// then in the dialect, and each marked letter leads to its rule.
function Letters({ task, texts, dialectName, ruleFor, onDone }: PronunciationProps<LettersTask>) {
  const t = texts.pronunciation;
  const tiles = letterTiles(task.word);
  const [tapped, setTapped] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const player = usePlayer();

  const marked = tiles.flatMap((tile, position) => (tile.marked ? [position] : []));
  const right = isLettersRight(task, tapped);
  const clips = [
    { key: "standardGerman", label: texts.lesson.standardGerman, url: task.audio?.standardGerman ?? null },
    { key: "dialect", label: dialectName, url: task.audio?.dialect ?? null },
  ];
  // One link per rule, in the word's order.
  const rules = marked
    .map((position) => ruleFor(tiles[position].text))
    .filter(
      (rule, index, all): rule is NonNullable<typeof rule> =>
        !!rule && all.findIndex((other) => other?.title === rule.title) === index,
    );

  function tileClass(position: number) {
    const isMarked = marked.includes(position);
    const isTapped = tapped.includes(position);
    if (!checked) return isTapped ? "bg-teal text-ivory" : "bg-mist";
    if (isMarked) return isTapped ? "bg-sage" : "bg-rose";
    if (isTapped) return "bg-rose line-through decoration-brick";
    return "text-teal-soft";
  }

  const result = right
    ? t.right
    : t.wrongChanged(markedLetters(task.word).length, listOf(markedLetters(task.word), t.and));

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        <p className="text-body">{t.letters(dialectName)}</p>
        {/* Narrow enough for a long word, such as "Tätowieren", on one line. */}
        <div className="flex flex-wrap justify-center gap-0.5 pt-4">
          {tiles.map((tile, position) => (
            <button
              key={position}
              type="button"
              disabled={checked}
              aria-pressed={tapped.includes(position)}
              onClick={() =>
                setTapped((current) =>
                  current.includes(position) ? current.filter((value) => value !== position) : [...current, position],
                )
              }
              className={`flex min-h-16 min-w-7 items-center justify-center rounded-3xl px-1 text-title font-bold transition-[background-color,transform] active:scale-95 disabled:active:scale-100 ${tileClass(position)}`}
            >
              {tile.text}
            </button>
          ))}
        </div>

        {checked && (
          <div aria-live="polite" className="flex flex-col gap-4">
            <p
              className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl px-6 text-body font-semibold ${answerClass(right)}`}
            >
              {result}
              <AnswerMark correct={right} label={right ? texts.session.correct : texts.session.notQuite} />
            </p>
            <Compare player={player} clips={clips} t={t} />
            {rules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {rules.map((rule) => (
                  <button
                    key={rule.title}
                    type="button"
                    onClick={rule.open}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
                  >
                    <Icon name="learn" size={16} />
                    {texts.practice.readRule(rule.title)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer>
        {checked ? (
          <Button onClick={() => onDone(right)}>{texts.session.continue}</Button>
        ) : (
          <>
            {/* Every word has letters that sound different, so there's nothing to check before one is tapped. */}
            <Button
              disabled={tapped.length === 0}
              onClick={() => {
                setChecked(true);
                player.play(clips);
              }}
            >
              {texts.exercises.check}
            </Button>
            {/* Going on without an answer, as not right. */}
            <TextButton onClick={() => onDone(false)}>{texts.practice.skip}</TextButton>
          </>
        )}
      </Footer>
    </>
  );
}

// Say the word first, then hear oneself and the recording back to back, and judge it: "Ja" goes
// on, "Noch nicht" records again at once, as often as the learner likes, and "Trotzdem weiter"
// goes on without it. A tip underlines the
// letters to watch, and once the learner has said it they stay underlined.
function Say({ task, texts, dialectName, onDone }: PronunciationProps<SayTask>) {
  const t = texts.pronunciation;
  const [tip, setTip] = useState(false);
  const [tries, setTries] = useState(0);
  const player = usePlayer();
  const recorder = useRecorder(WORD_MS);
  const comparing = tries > 0;

  function recorded(own: string | null) {
    setTries((count) => count + 1);
    player.play([
      { key: "own", url: own },
      { key: "dialect", url: task.audio ?? null },
    ]);
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        <p className="text-body">{t.say(dialectName)}</p>
        <p className="flex min-h-16 items-center justify-center pt-4 text-title font-bold">
          <MarkedWord word={task.word} underline={tip || comparing} />
        </p>

        {!comparing && !tip && <Tip onTip={() => setTip(true)} t={t} />}
        {!comparing && recorder.state === "denied" && (
          <p className="text-center text-caption text-teal-soft">{t.noMicrophone}</p>
        )}

        {comparing && (
          <div className="flex flex-col gap-4">
            <Compare
              player={player}
              t={t}
              clips={[
                ...(recorder.url ? [{ key: "own", label: t.you, url: recorder.url }] : []),
                { key: "dialect", label: t.model, url: task.audio ?? null },
              ]}
            />
          </div>
        )}
      </div>

      <Footer>
        {comparing && recorder.state !== "recording" ? (
          <SelfCheck recorder={recorder} onAnswer={onDone} onRecorded={recorded} t={t} />
        ) : (
          <>
            <RecordButton recorder={recorder} maxMs={WORD_MS} onRecorded={recorded} t={t} />
            {recorder.state !== "recording" && <TextButton onClick={() => onDone(false)}>{texts.practice.skip}</TextButton>}
          </>
        )}
      </Footer>
    </>
  );
}

// Hear the sentence, say it after, then hear both and judge it, as with a word. Its letters to
// watch are underlined behind a tip, and once the learner has said it.
function Repeat({ task, texts, onDone }: PronunciationProps<RepeatTask>) {
  const t = texts.pronunciation;
  const model = task.audio ?? null;
  // Without a recording yet, there's nothing to hear first.
  const [listened, setListened] = useState(!model);
  const [tip, setTip] = useState(false);
  const [tries, setTries] = useState(0);
  const player = usePlayer();
  const recorder = useRecorder(SENTENCE_MS);
  const comparing = tries > 0;

  function recorded(own: string | null) {
    setTries((count) => count + 1);
    player.play([
      { key: "own", url: own },
      { key: "dialect", url: model },
    ]);
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        <p className="text-body">{t.repeat}</p>
        <p className="pt-4 text-center text-heading font-bold">
          <MarkedWord word={task.sentence} underline={tip || comparing} small />
        </p>
        {!comparing && !tip && /\[/.test(task.sentence) && <Tip onTip={() => setTip(true)} t={t} />}
        {listened && (
          <Compare
            player={player}
            t={t}
            clips={[
              { key: "dialect", label: t.model, url: model },
              ...(comparing && recorder.url ? [{ key: "own", label: t.you, url: recorder.url }] : []),
            ]}
          />
        )}
        {listened && !comparing && recorder.state === "denied" && (
          <p className="text-center text-caption text-teal-soft">{t.noMicrophone}</p>
        )}
      </div>

      <Footer>
        {!listened ? (
          <Button
            onClick={() => {
              setListened(true);
              player.play([{ key: "dialect", url: model }]);
            }}
          >
            <Icon name="speaker" size={20} />
            {t.listen}
          </Button>
        ) : comparing && recorder.state !== "recording" ? (
          <SelfCheck recorder={recorder} onAnswer={onDone} onRecorded={recorded} t={t} />
        ) : (
          <RecordButton recorder={recorder} maxMs={SENTENCE_MS} onRecorded={recorded} t={t} />
        )}
        {/* Until it's recorded, going on without it, as not right. */}
        {!comparing && recorder.state !== "recording" && (
          <TextButton onClick={() => onDone(false)}>{texts.practice.skip}</TextButton>
        )}
      </Footer>
    </>
  );
}
