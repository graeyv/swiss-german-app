"use client";

import type { Dictionary } from "@/lib/i18n";
import type { Task } from "@/lib/exercises/tasks";
import { Build } from "./build";
import { Pick } from "./pick";
import { SpotError } from "./spot-error";

type TaskViewProps = {
  task: Task;
  t: Dictionary["exercises"];
  answered: boolean;
  onAnswer: (correct: boolean) => void;
};

// Shows any task. Give it a key per exercise, so a new one starts without the last answer.
export function TaskView({ task, ...props }: TaskViewProps) {
  if (task.type === "pick") return <Pick task={task} {...props} />;
  if (task.type === "build") return <Build task={task} {...props} />;
  return <SpotError task={task} {...props} />;
}
