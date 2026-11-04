"use client";

import { Fragment } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { PickTask } from "@/lib/exercises/tasks";
import { Options } from "./options";
import type { TaskProps } from "./task-view";

export function Pick({ task, t, answered, onAnswer, layout }: TaskProps<PickTask>) {
  return layout({
    prompt: (
      <div>
        {task.context && <p className="text-sm text-muted">{task.context}</p>}
        <h1 lang={task.promptLang} className="text-2xl font-bold tracking-tight">
          <WithGaps text={task.prompt} fill={answered ? task.options[task.answer] : null} t={t} />
        </h1>
      </div>
    ),
    controls: (
      <Options
        options={task.options}
        answer={task.answer}
        answered={answered}
        onPick={(i) => onAnswer(i === task.answer)}
      />
    ),
  });
}

// Each "___" becomes a gap, which shows the right answer once the task is answered.
function WithGaps({ text, fill, t }: { text: string; fill: string | null; t: Dictionary["exercises"] }) {
  return text.split("___").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <span className="inline-block min-w-16 border-b-2 border-accent text-center text-success">
          {fill ?? <span className="sr-only">{t.gap}</span>}
        </span>
      )}
      {part}
    </Fragment>
  ));
}
