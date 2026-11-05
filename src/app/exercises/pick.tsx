"use client";

import { Fragment, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { PickTask } from "@/lib/exercises/tasks";
import { Options } from "./options";
import type { TaskProps } from "./task-view";

export function Pick({ task, t, answered, onAnswer, layout }: TaskProps<PickTask>) {
  const [picked, setPicked] = useState<number | null>(null);
  const gapClass = picked === task.answer ? "text-success" : "text-danger";

  return layout({
    prompt: (
      <div>
        {task.context && <p className="text-sm text-muted">{task.context}</p>}
        <h1 lang={task.promptLang} className="text-2xl font-bold tracking-tight">
          <WithGaps
            text={task.prompt}
            fill={answered && picked !== null ? task.options[picked] : null}
            fillClass={gapClass}
            t={t}
          />
        </h1>
      </div>
    ),
    controls: (
      <Options
        options={task.options}
        answer={task.answer}
        selected={picked}
        answered={answered}
        onPick={(i) => {
          setPicked(i);
          onAnswer({ type: "pick", picked: i });
        }}
      />
    ),
  });
}

// Each "___" becomes a gap, which shows the learner's answer once they've given it, green if it's
// right and red if it isn't.
type WithGapsProps = { text: string; fill: string | null; fillClass: string; t: Dictionary["exercises"] };

function WithGaps({ text, fill, fillClass, t }: WithGapsProps) {
  return text.split("___").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <span className={`inline-block min-w-16 border-b-2 border-accent text-center ${fillClass}`}>
          {fill ?? <span className="sr-only">{t.gap}</span>}
        </span>
      )}
      {part}
    </Fragment>
  ));
}
