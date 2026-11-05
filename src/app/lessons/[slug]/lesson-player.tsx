"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import { TaskView } from "@/app/exercises/task-view";
import { answerText, isCorrect, type Task } from "@/lib/exercises/tasks";
import { dictionary, type Locale, translationOf } from "@/lib/i18n";
import type { Exercise, Vocabulary } from "@/lib/types";
import { completeLesson } from "./actions";

type LessonPlayerProps = {
  lessonId: string;
  locale: Locale;
  title: string;
  exercises: Exercise[];
};

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

// Lessons keep their own payloads. Each graded exercise is a task the shared exercises can show.
function lessonTask(exercise: Exercise): Task | null {
  if (exercise.type === "multiple_choice") {
    const { question, options, answer_index } = exercise.payload;
    return { type: "pick", prompt: question, options, answer: answer_index };
  }
  if (exercise.type === "word_order") {
    const { prompt, words, answer } = exercise.payload;
    return { type: "build", prompt, tiles: words, answer };
  }
  return null;
}

export function LessonPlayer({ lessonId, locale, title, exercises }: LessonPlayerProps) {
  const t = dictionary(locale);
  const [index, setIndex] = useState(0);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const gradedCount = exercises.filter((e) => e.type !== "vocab_card").length;

  // Next.js keeps visited routes hidden with their state. Leaving an unfinished lesson keeps
  // the learner's place, but a finished one must start over when reopened.
  useLayoutEffect(() => {
    if (finalScore === null) return;
    return () => {
      setIndex(0);
      setCorrectCount(0);
      setFinalScore(null);
      setSaveError(null);
    };
  }, [finalScore]);

  function save(score: number) {
    setSaveError(null);
    startSaving(async () => {
      const { error } = await completeLesson(lessonId, score);
      if (error) setSaveError(error);
    });
  }

  function handleContinue() {
    const total = correctCount + (wasCorrect ? 1 : 0);
    setCorrectCount(total);
    setWasCorrect(null);

    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      return;
    }
    const score = gradedCount === 0 ? 100 : Math.round((total / gradedCount) * 100);
    setFinalScore(score);
    save(score);
  }

  if (finalScore !== null) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="font-semibold text-success">{t.lesson.complete}</p>
        <h1 className="text-4xl font-bold tracking-tight">{t.lesson.score(finalScore)}</h1>
        <p className="text-muted">{t.lesson.finished(title)}</p>
        {saveError ? (
          <div aria-live="polite" className="flex flex-col gap-3">
            <p className="text-danger">{t.lesson.notSaved(saveError)}</p>
            <button onClick={() => save(finalScore)} disabled={saving} className={primaryButton}>
              {t.lesson.tryAgain}
            </button>
          </div>
        ) : (
          <Link
            href="/learn"
            aria-disabled={saving}
            className={`${primaryButton} text-center ${saving ? "pointer-events-none opacity-50" : ""}`}
          >
            {saving ? t.lesson.saving : t.lesson.backToLessons}
          </Link>
        )}
      </main>
    );
  }

  const exercise = exercises[index];
  if (!exercise) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="text-muted">{t.lesson.noExercises}</p>
        <Link href="/learn" className="underline underline-offset-4">
          {t.lesson.backToLessons}
        </Link>
      </main>
    );
  }

  const task = lessonTask(exercise);
  const answered = !task || wasCorrect !== null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-6">
      <header className="flex items-center gap-4">
        <Link href="/learn" aria-label={t.lesson.leave} className="text-xl text-muted">
          ×
        </Link>
        <div
          role="progressbar"
          aria-label={t.lesson.progress}
          aria-valuemin={0}
          aria-valuemax={exercises.length}
          aria-valuenow={index}
          className="h-2 flex-1 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(index / exercises.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6">
        {exercise.type === "vocab_card" && (
          <VocabCard vocabulary={exercise.vocabulary} locale={locale} />
        )}
        {task && (
          <TaskView
            key={exercise.id}
            task={task}
            t={t.exercises}
            answered={wasCorrect !== null}
            onAnswer={(response) => setWasCorrect(isCorrect(task, response))}
          />
        )}
      </div>

      <footer className="flex min-h-28 flex-col justify-end gap-3">
        <div aria-live="polite">
          {wasCorrect === true && <p className="font-semibold text-success">{t.lesson.correct}</p>}
          {wasCorrect === false && (
            <p className="font-semibold text-danger">{t.lesson.incorrect(task ? answerText(task) : "")}</p>
          )}
        </div>
        {answered && (
          <button onClick={handleContinue} className={primaryButton}>
            {t.lesson.continue}
          </button>
        )}
      </footer>
    </main>
  );
}

function VocabCard({ vocabulary, locale }: { vocabulary: Vocabulary; locale: Locale }) {
  const t = dictionary(locale);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-4xl font-bold tracking-tight" lang="gsw">
        {vocabulary.swiss_german}
      </p>
      <p className="text-lg">{translationOf(vocabulary, locale)}</p>
      {/* Unless the translation already is Standard German, that follows as a second one. */}
      {!t.translationIsStandardGerman && (
        <p className="text-muted">
          {t.standardGerman} <span lang="de">{vocabulary.high_german}</span>
        </p>
      )}
      {vocabulary.notes && <p className="mt-2 text-sm text-muted">{vocabulary.notes}</p>}
    </div>
  );
}
