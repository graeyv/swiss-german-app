"use client";

import { useState } from "react";
import { isSpotErrorCorrect, sentenceWords, type SpotErrorTask } from "@/lib/exercises/tasks";
import { Options } from "./options";
import type { TaskProps } from "./task-view";

// The learner taps the word they think is wrong, then picks what replaces it. They can tap
// another word until they've picked. The sentence is the prompt, the corrections the controls.
export function SpotError({ task, t, answered, onAnswer, layout }: TaskProps<SpotErrorTask>) {
  const words = sentenceWords(task.sentence);
  const [tapped, setTapped] = useState<number | null>(null);

  function wordClass(i: number) {
    if (answered && task.wrong.includes(i)) return "border-danger text-danger line-through";
    if (i === tapped) return "border-accent bg-accent/10";
    return "border-transparent";
  }

  return layout({
    prompt: (
      <div className="flex flex-col gap-2">
        {task.context && <p className="text-sm text-muted">{task.context}</p>}
        <p className="text-sm text-muted">{t.findMistake}</p>
        <div lang="gsw" className="-mx-2 flex flex-wrap text-2xl font-bold tracking-tight">
          {words.map((word, i) => (
            <button
              key={i}
              disabled={answered}
              aria-pressed={i === tapped}
              onClick={() => setTapped(i)}
              className={`min-h-11 rounded-lg border-2 px-2 transition-colors enabled:hover:border-accent ${wordClass(i)}`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    ),
    controls: tapped !== null && (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t.replaceWith(words[tapped])}</p>
        <Options
          options={task.options}
          answer={task.answer}
          answered={answered}
          lang="gsw"
          onPick={(i) => onAnswer(isSpotErrorCorrect(task, tapped, i))}
        />
      </div>
    ),
  });
}
