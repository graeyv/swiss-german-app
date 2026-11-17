"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { saveRound } from "@/app/learn/actions";
import { TaskView } from "@/app/exercises/task-view";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button, ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { answerText, isCorrect, type Response } from "@/lib/exercises/tasks";
import { dictionary, type Locale } from "@/lib/i18n";
import type { LessonExercise, Rule } from "@/lib/learn/lessons";
import { ExampleList } from "../[rule]/example-list";

type PracticeRoundProps = {
  lang: Locale;
  dialectName: string;
  // The section's path in lesson_rounds, such as "be/pronunciation/consonants".
  path: string;
  sectionTitle: string;
  rules: Rule[];
  round: { ruleId: string; exercise: LessonExercise }[];
  // Where leaving and "Fertig" lead.
  back: string;
  // The section's page, to read it again after a weak round.
  readAgain: string;
  // The next section, to go on to after a good round started in Learn.
  next?: { href: string; title: string };
};

// Below this share right the first time, the round suggests reading the section again.
const WEAK = 0.6;

// A section's exercises one after the other, then how it went. After a wrong answer, the rule the
// exercise is about opens in a sheet over the round, which keeps its place. The result is saved
// at the end.
export function PracticeRound({
  lang,
  dialectName,
  path,
  sectionTitle,
  rules,
  round,
  back,
  readAgain,
  next,
}: PracticeRoundProps) {
  const texts = dictionary(lang);
  const t = texts.practice;
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  // Whether the exercise on screen was answered rightly, or null until it's answered.
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const done = index >= round.length;

  function answered(response: Response) {
    const right = isCorrect(round[index].exercise, response);
    setAnswer(right);
    if (right) setCorrect((count) => count + 1);
  }

  // Saves the result, when the round ends or again after it failed.
  function save(result: number) {
    setError(null);
    startSaving(async () => {
      const saved = await saveRound(path, result, round.length);
      if (saved.error) setError(saved.error);
    });
  }

  function moveOn() {
    if (index === round.length - 1) save(correct);
    setAnswer(null);
    setIndex((value) => value + 1);
    window.scrollTo(0, 0);
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
          correct={correct}
          total={round.length}
          back={back}
          readAgain={readAgain}
          next={next}
        />
      ) : (
        <Exercise
          // A new exercise starts unanswered.
          key={round[index].exercise.id}
          texts={texts}
          dialectName={dialectName}
          sectionTitle={sectionTitle}
          exercise={round[index].exercise}
          rule={rules.find(({ id }) => id === round[index].ruleId)!}
          answer={answer}
          onAnswer={answered}
          onContinue={moveOn}
        />
      )}
    </main>
  );
}

type ExerciseProps = {
  texts: ReturnType<typeof dictionary>;
  dialectName: string;
  sectionTitle: string;
  exercise: LessonExercise;
  rule: Rule;
  answer: boolean | null;
  onAnswer: (response: Response) => void;
  onContinue: () => void;
};

// One exercise: the task, then whether it was right, with the right answer and a way to the rule
// after a wrong one. "Weiter" waits at the bottom, within thumb reach.
function Exercise({ texts, dialectName, sectionTitle, exercise, rule, answer, onAnswer, onContinue }: ExerciseProps) {
  const t = texts.practice;
  const sheet = useRef<HTMLDialogElement>(null);

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
            {!answer && (
              <button
                type="button"
                onClick={() => sheet.current?.showModal()}
                className="flex min-h-11 items-center gap-2 self-start rounded-full bg-mist px-4 text-caption font-semibold"
              >
                <Icon name="learn" size={16} />
                {t.readRule(rule.title)}
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

      {/* Only the rule: no back arrow and no lesson progress, as it isn't a step of the lesson. */}
      <BottomSheet ref={sheet} label={rule.title}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>{t.rule(sectionTitle)}</Eyebrow>
              <h2 className="text-title font-bold">{rule.title}</h2>
            </div>
            <p className="text-body">{rule.theory}</p>
          </div>
          {rule.examples.length > 0 && <ExampleList examples={rule.examples} dialectName={dialectName} t={texts.lesson} />}
          <Takeaway label={texts.lesson.remember}>{rule.takeaway}</Takeaway>
          <Button onClick={() => sheet.current?.close()}>{t.backToExercise}</Button>
        </div>
      </BottomSheet>
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
  back: string;
  readAgain: string;
  next?: { href: string; title: string };
};

// How the round went, saved as the last exercise is left. After a weak round, reading the section
// again comes first. After a good one started in Learn, the next section does.
function Finished({ texts, saving, error, onRetry, sectionTitle, correct, total, back, readAgain, next }: FinishedProps) {
  const t = texts.practice;
  const weak = correct / total < WEAK;

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-6 pt-4 pb-8">
        <div className="flex flex-col gap-2 rounded-3xl bg-yellow p-6">
          <Icon name="check" size={32} />
          <h1 className="text-heading font-bold">{t.done(sectionTitle)}</h1>
          <p className="text-body">{t.score(correct, total)}</p>
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
      </div>

      <footer className="sticky bottom-0 -mx-6 flex flex-col gap-3 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error ? (
          <Button onClick={onRetry} disabled={saving}>
            {texts.session.tryAgain}
          </Button>
        ) : weak ? (
          <>
            <ButtonLink href={readAgain}>
              <Icon name="learn" size={20} />
              {t.readAgain(sectionTitle)}
            </ButtonLink>
            <ButtonLink href={back} variant="secondary" className="min-h-14">
              {t.finish}
            </ButtonLink>
          </>
        ) : (
          <>
            {next && (
              <ButtonLink href={next.href}>
                {texts.lesson.next}: {next.title}
              </ButtonLink>
            )}
            <ButtonLink href={back} variant={next ? "secondary" : "primary"} className="min-h-14">
              {t.finish}
            </ButtonLink>
          </>
        )}
      </footer>
    </>
  );
}
