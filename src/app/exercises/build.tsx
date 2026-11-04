"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { type BuildTask, isBuildCorrect } from "@/lib/exercises/tasks";

type BuildProps = {
  task: BuildTask;
  t: Dictionary["exercises"];
  answered: boolean;
  onAnswer: (correct: boolean) => void;
};

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

const tileClass =
  "min-h-11 rounded-lg border border-line bg-surface px-3 py-2 font-medium transition-colors enabled:hover:border-accent";

export function Build({ task, t, answered, onAnswer }: BuildProps) {
  // Positions in tiles rather than the words themselves, so repeated words stay distinct.
  const [placed, setPlaced] = useState<number[]>([]);

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t.putInOrder}</p>
        <h1 className="text-2xl font-bold tracking-tight">{task.prompt}</h1>
      </div>

      <div lang="gsw" className="flex min-h-14 flex-wrap items-center gap-2 border-b-2 border-line pb-3">
        {placed.map((tile) => (
          <button
            key={tile}
            disabled={answered}
            onClick={() => setPlaced(placed.filter((i) => i !== tile))}
            className={tileClass}
          >
            {task.tiles[tile]}
          </button>
        ))}
      </div>

      <div lang="gsw" className="flex flex-wrap gap-2">
        {task.tiles.map((tile, i) =>
          placed.includes(i) ? null : (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPlaced([...placed, i])}
              className={tileClass}
            >
              {tile}
            </button>
          ),
        )}
      </div>

      {!answered && (
        <button
          disabled={placed.length === 0}
          onClick={() => onAnswer(isBuildCorrect(task, placed))}
          className={primaryButton}
        >
          {t.check}
        </button>
      )}
    </>
  );
}
