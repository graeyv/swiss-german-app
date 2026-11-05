"use client";

import { useEffect, useState } from "react";
import { TaskView } from "@/app/exercises/task-view";
import { answerReview, type Response, type Segment } from "@/lib/exercises/tasks";
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

// How long the learner sees their answer marked on the card and the controls before the card
// turns over to compare it with the solution.
const TURN_DELAY_MS = 1000;

const primaryButton =
  "min-h-12 w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

// A grammar card. Its front asks the exercise, and the answer is given with the controls below
// it, where words have their rating buttons. The answer is marked right or wrong where it was
// given, then the card turns over to show it beside the solution. The answer is saved straight
// away, so Continue rarely waits. Keyed by the card's attempt, so each attempt starts unanswered.
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
  const [response, setResponse] = useState<Response | null>(null);
  const [turned, setTurned] = useState(false);
  const { task } = card.exercise;
  const review = response && answerReview(task, response);
  const canContinue = turned && saved && !saving;
  // Sentences are Swiss German. A pick that asks about a sentence answers in the learner's
  // language, and a build asks in it.
  const askedLang = task.type === "pick" ? "gsw" : locale;
  const answerLang = review?.asked && task.type === "pick" ? locale : "gsw";

  useEffect(() => {
    if (!response) return;
    const timer = setTimeout(() => setTurned(true), TURN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [response]);

  // Enter moves on once the answer is saved.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("a, button, input")) return;
      if (event.key === "Enter" && canContinue) onContinue();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canContinue, onContinue]);

  function answer(given: Response) {
    setResponse(given);
    onAnswer(answerReview(task, given).correct);
  }

  return (
    <TaskView
      task={task}
      t={texts.exercises}
      answered={response !== null}
      onAnswer={answer}
      layout={({ prompt, controls }) => (
        <>
          <CardStack stacked={stacked}>
            <div className="relative min-h-64 flex-1 perspective-distant">
              <div
                className={`absolute inset-0 transition-transform duration-500 transform-3d motion-reduce:transition-none ${
                  turned ? "rotate-y-180" : ""
                }`}
              >
                {/* The side turned away can't be read or tapped. */}
                <div inert={turned} className={`${CARD_FACE} gap-6 overflow-y-auto`}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={card.status} t={t} />
                    <span className="truncate text-sm font-semibold text-muted">{card.title}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-6">{prompt}</div>
                </div>

                <div inert={!turned} className={`${CARD_FACE} gap-5 overflow-y-auto rotate-y-180`}>
                  {review && (
                    <>
                      <p
                        aria-live="polite"
                        className={`flex items-center gap-2 text-xl font-bold ${
                          review.correct ? "text-success" : "text-danger"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex size-8 items-center justify-center rounded-full text-base text-surface ${
                            review.correct ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {review.correct ? "✓" : "✗"}
                        </span>
                        {review.correct ? t.correct : t.notQuite}
                      </p>

                      <div className="flex flex-1 flex-col justify-center gap-5">
                        {review.asked && (
                          <p lang={askedLang} className="text-lg font-semibold text-muted">
                            {review.asked}
                          </p>
                        )}
                        {review.correct ? (
                          <Sentence segments={review.solution} lang={answerLang} />
                        ) : (
                          <>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                                {t.yourAnswer}
                              </p>
                              <Sentence segments={review.given} lang={answerLang} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                                {t.correctAnswer}
                              </p>
                              <Sentence segments={review.solution} lang={answerLang} />
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardStack>

          <footer className="flex min-h-24 flex-col justify-end gap-3">
            {/* The controls stay, marked, until the card turns, so the learner sees their answer. */}
            {!turned && controls}
            {turned && (
              <>
                {saveError && (
                  <p aria-live="polite" className="text-sm text-danger">
                    {t.answerNotSaved(saveError)}
                  </p>
                )}
                {saveError && review ? (
                  <button onClick={() => onAnswer(review.correct)} disabled={saving} className={primaryButton}>
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

const MARKS = {
  right: "rounded-md bg-success/15 px-1 text-success",
  wrong: "rounded-md bg-danger/15 px-1 text-danger",
};

// A sentence with what the learner got right or wrong highlighted.
function Sentence({ segments, lang }: { segments: Segment[]; lang: string }) {
  return (
    <p lang={lang} className="text-2xl leading-relaxed font-bold tracking-tight break-words">
      {segments.map((segment, i) =>
        segment.mark ? (
          <mark key={i} className={MARKS[segment.mark]}>
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
