"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useTransition } from "react";
import type { Exercise, Vocabulary } from "@/lib/types";
import { completeLesson } from "./actions";

type LessonPlayerProps = {
  lessonId: string;
  title: string;
  exercises: Exercise[];
};

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

function correctAnswer(exercise: Exercise) {
  if (exercise.type === "multiple_choice") {
    return exercise.payload.options[exercise.payload.answer_index];
  }
  if (exercise.type === "word_order") return exercise.payload.answer.join(" ");
  return "";
}

export function LessonPlayer({ lessonId, title, exercises }: LessonPlayerProps) {
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
        <p className="font-semibold text-success">Lesson complete</p>
        <h1 className="text-4xl font-bold tracking-tight">{finalScore}% correct</h1>
        <p className="text-muted">You finished &ldquo;{title}&rdquo;.</p>
        {saveError ? (
          <div aria-live="polite" className="flex flex-col gap-3">
            <p className="text-danger">Your progress wasn&rsquo;t saved: {saveError}</p>
            <button onClick={() => save(finalScore)} disabled={saving} className={primaryButton}>
              Try again
            </button>
          </div>
        ) : (
          <Link
            href="/learn"
            aria-disabled={saving}
            className={`${primaryButton} text-center ${saving ? "pointer-events-none opacity-50" : ""}`}
          >
            {saving ? "Saving…" : "Back to lessons"}
          </Link>
        )}
      </main>
    );
  }

  const exercise = exercises[index];
  if (!exercise) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="text-muted">This lesson has no exercises yet.</p>
        <Link href="/learn" className="underline underline-offset-4">
          Back to lessons
        </Link>
      </main>
    );
  }

  const answered = exercise.type === "vocab_card" || wasCorrect !== null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-6">
      <header className="flex items-center gap-4">
        <Link href="/learn" aria-label="Leave lesson" className="text-xl text-muted">
          ×
        </Link>
        <div
          role="progressbar"
          aria-label="Lesson progress"
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
        {exercise.type === "vocab_card" && <VocabCard vocabulary={exercise.vocabulary} />}
        {exercise.type === "multiple_choice" && (
          <MultipleChoice
            key={exercise.id}
            {...exercise.payload}
            answered={wasCorrect !== null}
            onAnswer={setWasCorrect}
          />
        )}
        {exercise.type === "word_order" && (
          <WordOrder
            key={exercise.id}
            {...exercise.payload}
            answered={wasCorrect !== null}
            onAnswer={setWasCorrect}
          />
        )}
      </div>

      <footer className="flex min-h-28 flex-col justify-end gap-3">
        <div aria-live="polite">
          {wasCorrect === true && <p className="font-semibold text-success">Correct!</p>}
          {wasCorrect === false && (
            <p className="font-semibold text-danger">
              Not quite. The answer is: {correctAnswer(exercise)}
            </p>
          )}
        </div>
        {answered && (
          <button onClick={handleContinue} className={primaryButton}>
            Continue
          </button>
        )}
      </footer>
    </main>
  );
}

function VocabCard({ vocabulary }: { vocabulary: Vocabulary }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-4xl font-bold tracking-tight" lang="gsw">
        {vocabulary.swiss_german}
      </p>
      <p className="text-lg">{vocabulary.english}</p>
      <p className="text-muted">
        Standard German: <span lang="de">{vocabulary.high_german}</span>
      </p>
      {vocabulary.notes && <p className="mt-2 text-sm text-muted">{vocabulary.notes}</p>}
    </div>
  );
}

type MultipleChoiceProps = {
  question: string;
  options: string[];
  answer_index: number;
  answered: boolean;
  onAnswer: (correct: boolean) => void;
};

function MultipleChoice({
  question,
  options,
  answer_index,
  answered,
  onAnswer,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function optionClass(i: number) {
    if (answered && i === answer_index) return "border-success text-success";
    if (answered && i === selected) return "border-danger text-danger";
    return "border-line";
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{question}</h1>
      <div className="flex flex-col gap-3">
        {options.map((option, i) => (
          <button
            key={option}
            disabled={answered}
            onClick={() => {
              setSelected(i);
              onAnswer(i === answer_index);
            }}
            className={`rounded-xl border-2 bg-surface p-4 text-left font-medium transition-colors enabled:hover:border-accent ${optionClass(i)}`}
          >
            {option}
          </button>
        ))}
      </div>
    </>
  );
}

type WordOrderProps = {
  prompt: string;
  words: string[];
  answer: string[];
  answered: boolean;
  onAnswer: (correct: boolean) => void;
};

function WordOrder({ prompt, words, answer, answered, onAnswer }: WordOrderProps) {
  // Positions in words rather than the words themselves, so repeated words stay distinct.
  const [placed, setPlaced] = useState<number[]>([]);

  const wordClass =
    "rounded-lg border border-line bg-surface px-3 py-2 font-medium transition-colors enabled:hover:border-accent";

  return (
    <>
      <div>
        <p className="text-sm text-muted">Put the words in order:</p>
        <h1 className="text-2xl font-bold tracking-tight">{prompt}</h1>
      </div>

      <div className="flex min-h-14 flex-wrap items-center gap-2 border-b-2 border-line pb-3">
        {placed.map((wordIndex) => (
          <button
            key={wordIndex}
            disabled={answered}
            onClick={() => setPlaced(placed.filter((i) => i !== wordIndex))}
            className={wordClass}
          >
            {words[wordIndex]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {words.map((word, i) =>
          placed.includes(i) ? null : (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPlaced([...placed, i])}
              className={wordClass}
            >
              {word}
            </button>
          ),
        )}
      </div>

      {!answered && (
        <button
          disabled={placed.length === 0}
          onClick={() =>
            onAnswer(placed.map((i) => words[i]).join(" ") === answer.join(" "))
          }
          className={primaryButton}
        >
          Check
        </button>
      )}
    </>
  );
}
