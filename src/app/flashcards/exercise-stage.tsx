"use client";

import { useEffect, useState } from "react";
import { TaskView } from "@/app/exercises/task-view";
import { solutionOf } from "@/lib/exercises/tasks";
import { dictionary, type Locale } from "@/lib/i18n";
import type { GrammarCard } from "@/lib/types";
import { CARD_FACE, CardStack } from "./card-stack";
import { StatusBadge } from "./status-badge";

type ExerciseStageProps = {
  card: GrammarCard;
  locale: Locale;
  // Whether more cards wait behind this one, shown as a stack.
  stacked: boolean;
  saving: boolean;
  // Whether the answer is saved, so the session can move on.
  saved: boolean;
  saveError: string | null;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
};

const primaryButton =
  "min-h-12 w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

// A grammar card. Its front asks the exercise, and the answer is given with the controls below
// it, where words have their rating buttons. Answering turns the card over to show the solution.
// The answer is saved straight away, while the learner reads it, so Continue rarely waits.
// Keyed by the card's attempt, so each attempt starts unanswered.
export function ExerciseStage({
  card,
  locale,
  stacked,
  saving,
  saved,
  saveError,
  onAnswer,
  onContinue,
}: ExerciseStageProps) {
  const texts = dictionary(locale);
  const t = texts.session;
  const [correct, setCorrect] = useState<boolean | null>(null);
  const answered = correct !== null;
  const { task } = card.exercise;
  const { asked, solution } = solutionOf(task);
  const canContinue = answered && saved && !saving;
  // Sentences are Swiss German. A pick that asks about a sentence answers in the learner's
  // language, and a build asks in it.
  const askedLang = task.type === "pick" ? "gsw" : locale;
  const solutionLang = task.type === "pick" && asked ? locale : "gsw";

  // Enter moves on once the answer is saved.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("a, button, input")) return;
      if (event.key === "Enter" && canContinue) onContinue();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canContinue, onContinue]);

  function answer(value: boolean) {
    setCorrect(value);
    onAnswer(value);
  }

  return (
    <TaskView
      task={task}
      t={texts.exercises}
      answered={answered}
      onAnswer={answer}
      layout={({ prompt, controls }) => (
        <>
          <CardStack stacked={stacked}>
            <div className="relative min-h-64 flex-1 perspective-distant">
              <div
                className={`absolute inset-0 transition-transform duration-500 transform-3d motion-reduce:transition-none ${
                  answered ? "rotate-y-180" : ""
                }`}
              >
                {/* The side turned away can't be read or tapped. */}
                <div inert={answered} className={`${CARD_FACE} gap-6 overflow-y-auto`}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={card.status} t={t} />
                    <span className="truncate text-sm font-semibold text-muted">{card.title}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-6">{prompt}</div>
                </div>

                <div inert={!answered} className={`${CARD_FACE} rotate-y-180`}>
                  <p
                    aria-live="polite"
                    className={`text-lg font-semibold ${correct ? "text-success" : "text-danger"}`}
                  >
                    {answered && (correct ? `✓ ${t.correct}` : `✗ ${t.notQuite}`)}
                  </p>
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    {asked && (
                      <p lang={askedLang} className="text-lg font-semibold text-muted">
                        {asked}
                      </p>
                    )}
                    <p lang={solutionLang} className="text-3xl font-bold tracking-tight break-words">
                      {solution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardStack>

          <footer className="flex min-h-24 flex-col justify-end gap-3">
            {!answered && controls}
            {answered && (
              <>
                {saveError && (
                  <p aria-live="polite" className="text-sm text-danger">
                    {t.answerNotSaved(saveError)}
                  </p>
                )}
                {saveError ? (
                  <button onClick={() => onAnswer(correct)} disabled={saving} className={primaryButton}>
                    {t.tryAgain}
                  </button>
                ) : (
                  <button onClick={onContinue} disabled={!canContinue} className={primaryButton}>
                    {saved ? t.continue : t.saving}
                  </button>
                )}
              </>
            )}
          </footer>
        </>
      )}
    />
  );
}
