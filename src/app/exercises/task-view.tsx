"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Response, Task } from "@/lib/exercises/tasks";
import { Build } from "./build";
import { Pick } from "./pick";
import { SpotError } from "./spot-error";

// Places a task's two parts: what it asks, and the controls to answer with.
export type TaskLayout = (parts: { prompt: ReactNode; controls: ReactNode }) => ReactNode;

export type TaskProps<T> = {
  task: T;
  t: Dictionary["exercises"];
  answered: boolean;
  // What the learner answered. isCorrect in src/lib/exercises/tasks.ts tells whether it's right.
  onAnswer: (response: Response) => void;
  layout: TaskLayout;
};

// The prompt above its controls, as lessons show tasks.
const stacked: TaskLayout = ({ prompt, controls }) => (
  <>
    {prompt}
    {controls}
  </>
);

type TaskViewProps = Omit<TaskProps<Task>, "layout"> & { layout?: TaskLayout };

// Shows any task. Give it a key per exercise, so a new one starts without the last answer.
export function TaskView({ task, layout = stacked, ...props }: TaskViewProps) {
  if (task.type === "pick") return <Pick task={task} layout={layout} {...props} />;
  if (task.type === "build") return <Build task={task} layout={layout} {...props} />;
  return <SpotError task={task} layout={layout} {...props} />;
}
