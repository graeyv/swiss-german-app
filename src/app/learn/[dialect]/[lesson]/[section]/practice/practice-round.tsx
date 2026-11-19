"use client";

import Link from "next/link";
import { type ReactNode, useLayoutEffect, useRef, useState, useTransition } from "react";
import { saveRound } from "@/app/learn/actions";
import { MarkedWord } from "@/app/exercises/pronunciation/parts";
import { PronunciationExercise } from "@/app/exercises/pronunciation/pronunciation-exercise";
import { TaskView } from "@/app/exercises/task-view";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button, ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { isPronunciationTask, listOf, markedLetters, ruleForLetters } from "@/lib/exercises/pronunciation";
import { answerText, isCorrect, type Response } from "@/lib/exercises/tasks";
import { type Dictionary, dictionary, type Locale } from "@/lib/i18n";
import type { LessonExercise, Rule } from "@/lib/learn/lessons";
import { ExampleList } from "../[rule]/example-list";

type PracticeRoundProps = {
  lang: Locale;
  dialectName: string;
  // The section's path in lesson_rounds, such as "be/pronunciation/consonants".
  path: string;
  sectionTitle: string;
  // Every rule of the module, with its section's title, this section's first: a pronunciation
  // exercise can lead to a rule of another section, such as a consonant in the vowels' round.
  rules: RuleRef[];
  // Each exercise with the rule it practises, if it practises one.
  round: { ruleId?: string; exercise: LessonExercise }[];
  // Where leaving and "Fertig" lead.
  back: string;
  // The section's page, to read it again after a weak round.
  readAgain: string;
  // The next section, to go on to after a good round started in Learn.
  next?: { href: string; title: string };
};

type RuleRef = { rule: Rule; section: string };

// Below this share right the first time, the round suggests reading the section again.
const WEAK = 0.6;

// A section's exercises one after the other, then how it went. After a wrong answer, the rule the
// exercise is about opens in a sheet over the round, which keeps its place. The result is saved
// at the end.
export function PracticeRound(props: PracticeRoundProps) {
  // Each run starts the round afresh: the whole round, or only the exercises that were wrong.
  const [run, setRun] = useState<{ count: number; only?: string[] }>({ count: 0 });
  // Next.js keeps pages the learner leaves alive in the background, with their state, so coming
  // back would show the round where it was left, such as at its end. A new run starts the whole
  // round whenever the page is hidden.
  useLayoutEffect(() => () => setRun(({ count }) => ({ count: count + 1 })), []);
  const { only } = run;
  return (
    <Round
      key={run.count}
      {...props}
      round={only ? props.round.filter(({ exercise }) => only.includes(exercise.id)) : props.round}
      // The exercises not brought back were right before.
      before={only ? { right: props.round.length - only.length, total: props.round.length } : undefined}
      onAgain={(ids) => setRun(({ count }) => ({ count: count + 1, only: ids }))}
    />
  );
}

function Round({
  lang,
  dialectName,
  path,
  sectionTitle,
  rules,
  round,
  back,
  readAgain,
  next,
  before,
  onAgain,
}: PracticeRoundProps & {
  // When this run only has the exercises that were wrong: how many of the whole round were right
  // before, and how many it has. The run's right ones add to them, and the whole round's new score
  // is saved, so fixing mistakes counts.
  before?: { right: number; total: number };
  // Starts again: only the exercises with these ids, or the whole round.
  onAgain: (ids?: string[]) => void;
}) {
  const texts = dictionary(lang);
  const t = texts.practice;
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  // Whether each exercise done so far was right, for the review at the end.
  const [results, setResults] = useState<boolean[]>([]);
  // Whether the exercise on screen was answered rightly, or null until it's answered.
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const done = index >= round.length;

  function answered(response: Response) {
    const { exercise } = round[index];
    if (isPronunciationTask(exercise)) return;
    const right = isCorrect(exercise, response);
    setAnswer(right);
    setResults((list) => [...list, right]);
    if (right) setCorrect((count) => count + 1);
  }

  // Saves the result, when the round ends or again after it failed.
  function save(result: number) {
    setError(null);
    startSaving(async () => {
      const saved = await saveRound(path, (before?.right ?? 0) + result, before?.total ?? round.length);
      if (saved.error) setError(saved.error);
    });
  }

  function moveOn(result = correct) {
    if (index === round.length - 1) save(result);
    setAnswer(null);
    setIndex((value) => value + 1);
    window.scrollTo(0, 0);
  }

  // A pronunciation exercise says itself whether it was right, as it ends.
  function ended(right: boolean) {
    const result = correct + (right ? 1 : 0);
    setCorrect(result);
    setResults((list) => [...list, right]);
    moveOn(result);
  }

  return (
    <main lang={lang} className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6">
      <div className="sticky top-0 z-30 -mx-6 flex min-h-14 items-center gap-3 bg-ivory px-6 pt-[env(safe-area-inset-top)]">
        <Link href={back} aria-label={t.leave} className="-ml-2 flex size-11 items-center justify-center">
          <Icon name="cross" />
        </Link>
        <div
          role="progressbar"
          aria-label={t.progress(Math.min(index + 1, round.length), round.length)}
          aria-valuemin={0}
          aria-valuemax={round.length}
          aria-valuenow={index}
          className="flex flex-1 gap-1"
        >
          {round.map(({ exercise }, position) => (
            <span key={exercise.id} className={`h-2 flex-1 rounded-full ${position < index ? "bg-teal" : "bg-mist"}`} />
          ))}
        </div>
        <span aria-hidden className="shrink-0 text-caption font-semibold text-teal-soft tabular-nums">
          {Math.min(index + 1, round.length)} / {round.length}
        </span>
      </div>

      {done ? (
        <Finished
          texts={texts}
          saving={saving}
          error={error}
          onRetry={() => save(correct)}
          sectionTitle={sectionTitle}
          correct={(before?.right ?? 0) + correct}
          total={before?.total ?? round.length}
          relearned={before !== undefined}
          back={back}
          readAgain={readAgain}
          next={next}
          onAgain={onAgain}
          review={round.map(({ exercise }, position) => ({ exercise, right: results[position] ?? false }))}
        />
      ) : (
        <Exercise
          // A new exercise starts unanswered.
          key={round[index].exercise.id}
          texts={texts}
          dialectName={dialectName}
          exercise={round[index].exercise}
          rule={rules.find(({ rule }) => rule.id === round[index].ruleId)}
          rules={rules}
          answer={answer}
          onAnswer={answered}
          onContinue={() => moveOn()}
          onDone={ended}
        />
      )}
    </main>
  );
}

type ExerciseProps = {
  texts: ReturnType<typeof dictionary>;
  dialectName: string;
  exercise: LessonExercise;
  // The rule the exercise practises, if one.
  rule?: RuleRef;
  rules: RuleRef[];
  answer: boolean | null;
  onAnswer: (response: Response) => void;
  onContinue: () => void;
  // When a pronunciation exercise ends, whether it was right.
  onDone: (right: boolean) => void;
};

// One exercise: the task, then whether it was right, with the right answer and a way to the rule
// after a wrong one. "Weiter" waits at the bottom, within thumb reach. A pronunciation exercise
// brings its own buttons, and leads to the rules of the letters it marks.
function Exercise({ texts, dialectName, exercise, rule, rules, answer, onAnswer, onContinue, onDone }: ExerciseProps) {
  const t = texts.practice;
  const sheet = useRef<HTMLDialogElement>(null);
  // The rule in the sheet.
  const [shown, setShown] = useState(rule);

  function openRule(ref: RuleRef) {
    setShown(ref);
    sheet.current?.showModal();
  }

  // Always there, so it can open as soon as a rule is chosen.
  const ruleSheet = (
    // Only the rule: no back arrow and no lesson progress, as it isn't a step of the lesson.
    <BottomSheet ref={sheet} label={shown?.rule.title ?? t.rule("")}>
      {shown && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>{t.rule(shown.section)}</Eyebrow>
              <h2 className="text-title font-bold">{shown.rule.title}</h2>
            </div>
            <p className="text-body">{shown.rule.theory}</p>
          </div>
          {shown.rule.examples.length > 0 && (
            <ExampleList examples={shown.rule.examples} dialectName={dialectName} t={texts.lesson} />
          )}
          <Takeaway label={texts.lesson.remember}>{shown.rule.takeaway}</Takeaway>
          <Button onClick={() => sheet.current?.close()}>{t.backToExercise}</Button>
        </div>
      )}
    </BottomSheet>
  );

  if (isPronunciationTask(exercise)) {
    return (
      <>
        <PronunciationExercise
          task={exercise}
          texts={texts}
          dialectName={dialectName}
          ruleFor={(letters) => {
            const found = ruleForLetters(
              rules.map((ref) => ref.rule),
              letters,
            );
            const ref = rules.find((each) => each.rule === found);
            return ref && { title: ref.rule.title, open: () => openRule(ref) };
          }}
          onDone={onDone}
        />
        {ruleSheet}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        <TaskView task={exercise} t={texts.exercises} answered={answer !== null} onAnswer={onAnswer} />
        {answer !== null && (
          <div aria-live="polite" className="flex flex-col gap-3">
            <p
              className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl px-6 text-body font-semibold ${answerClass(answer)}`}
            >
              {answer ? texts.session.correct : `${texts.session.correctAnswer}: ${answerText(exercise)}`}
              <AnswerMark correct={answer} label={answer ? texts.session.correct : texts.session.notQuite} />
            </p>
            {!answer && rule && (
              <button
                type="button"
                onClick={() => openRule(rule)}
                className="flex min-h-11 items-center gap-2 self-start rounded-full bg-mist px-4 text-caption font-semibold"
              >
                <Icon name="learn" size={16} />
                {t.readRule(rule.rule.title)}
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 -mx-6 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button disabled={answer === null} onClick={onContinue}>
          {texts.session.continue}
        </Button>
      </footer>

      {ruleSheet}
    </>
  );
}

type FinishedProps = {
  texts: ReturnType<typeof dictionary>;
  saving: boolean;
  // Why saving the result failed, if it did.
  error: string | null;
  onRetry: () => void;
  sectionTitle: string;
  correct: number;
  total: number;
  // After practising the mistakes: the score is the whole round's now, not the first time's.
  relearned: boolean;
  back: string;
  readAgain: string;
  next?: { href: string; title: string };
  onAgain: (ids?: string[]) => void;
  // Every exercise, with whether it was right.
  review: { exercise: LessonExercise; right: boolean }[];
};

// How the round went, saved as the last exercise is left, then every exercise with how it went.
// After a weak round, reading the section again comes first. After a good one started in Learn,
// the next section does. Practising again is always there.
function Finished({
  texts,
  saving,
  error,
  onRetry,
  sectionTitle,
  correct,
  total,
  relearned,
  back,
  readAgain,
  next,
  onAgain,
  review,
}: FinishedProps) {
  const t = texts.practice;
  const weak = correct / total < WEAK;
  // The wrong ones again, or the whole round when everything was right.
  const wrong = review.filter(({ right }) => !right).map(({ exercise }) => exercise.id);
  const again = (
    <Button variant="secondary" className="min-h-14" onClick={() => onAgain(wrong.length > 0 ? wrong : undefined)}>
      {wrong.length > 0 ? t.againMistakes(wrong.length) : t.again}
    </Button>
  );
  const finish = (
    <ButtonLink href={back} variant="secondary" className="min-h-14">
      {t.finish}
    </ButtonLink>
  );

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-4 pb-8">
        <div className="flex flex-col gap-2 rounded-3xl bg-yellow p-6">
          <Icon name="check" size={32} />
          <h1 className="text-heading font-bold">{t.done(sectionTitle)}</h1>
          <p className="text-body">{relearned ? t.scoreNow(correct, total) : t.score(correct, total)}</p>
        </div>
        {weak && (
          <p className="flex items-center gap-3 text-body">
            <Icon name="learn" className="shrink-0 text-teal-soft" />
            {t.weak}
          </p>
        )}
        {error && (
          <p aria-live="polite" className="text-caption text-brick">
            {t.notSaved(error)}
          </p>
        )}
        {saving && <p className="text-caption text-teal-soft">{texts.session.saving}</p>}

        <section className="flex flex-col gap-3 pt-2">
          <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{t.review}</h2>
          <ol className="flex flex-col gap-2">
            {review.map(({ exercise, right }) => (
              <ReviewRow key={exercise.id} exercise={exercise} right={right} texts={texts} />
            ))}
          </ol>
        </section>
      </div>

      <footer className="sticky bottom-0 -mx-6 flex flex-col gap-3 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error || weak || next ? (
          <>
            {error ? (
              <Button onClick={onRetry} disabled={saving}>
                {texts.session.tryAgain}
              </Button>
            ) : weak ? (
              <ButtonLink href={readAgain}>
                <Icon name="learn" size={20} />
                {t.readAgain(sectionTitle)}
              </ButtonLink>
            ) : (
              next && (
                <ButtonLink href={next.href}>
                  {texts.lesson.next}: {next.title}
                </ButtonLink>
              )
            )}
            {/* More room for practising again, whose label is longer. */}
            <div className="grid grid-cols-[3fr_2fr] gap-3">
              {again}
              {finish}
            </div>
          </>
        ) : (
          <>
            <ButtonLink href={back}>{t.finish}</ButtonLink>
            {again}
          </>
        )}
      </footer>
    </>
  );
}

// One exercise of the round, as it went: a check or cross, then the solution. A word to say or
// spot shows its letters that sound different underlined, with which they are.
function ReviewRow({ exercise, right, texts }: { exercise: LessonExercise; right: boolean; texts: Dictionary }) {
  const t = texts.pronunciation;
  let title: ReactNode;
  let caption: string | undefined;
  if (exercise.type === "letters" || exercise.type === "say") {
    title = <MarkedWord word={exercise.word} small />;
    const letters = markedLetters(exercise.word);
    caption =
      exercise.type === "say"
        ? right
          ? t.soundedSame
          : t.notSameYet
        : t.changed(letters.length, listOf(letters, t.and));
  } else if (exercise.type === "repeat") {
    title = exercise.sentence;
    caption = right ? t.soundedSame : t.notSameYet;
  } else {
    title = answerText(exercise);
    caption = right ? undefined : texts.session.correctAnswer;
  }
  return (
    <li className="flex items-center gap-4 rounded-3xl bg-mist px-6 py-3">
      <AnswerMark correct={right} label={right ? texts.session.correct : texts.session.notQuite} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-bold">{title}</span>
        {caption && <span className="text-caption text-teal-soft">{caption}</span>}
      </span>
    </li>
  );
}
