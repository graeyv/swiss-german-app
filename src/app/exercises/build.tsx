"use client";

import { useState } from "react";
import type { BuildTask } from "@/lib/exercises/tasks";
import type { TaskProps } from "./task-view";

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

const tileClass =
  "min-h-11 rounded-lg border px-3 py-2 font-medium transition-colors enabled:hover:border-accent";
const plainTile = `${tileClass} border-line bg-surface`;
const rightTile = `${tileClass} border-success bg-success/10 text-success`;
const wrongTile = `${tileClass} border-danger bg-danger/10 text-danger`;

// The sentence being built is part of the prompt, and the tiles left are the controls. Once
// answered, each placed tile turns green where it's the right word and red where it isn't.
export function Build({ task, t, answered, onAnswer, layout }: TaskProps<BuildTask>) {
  // Positions in tiles rather than the words themselves, so repeated words stay distinct.
  const [placed, setPlaced] = useState<number[]>([]);

  function placedClass(tile: number, position: number) {
    if (!answered) return plainTile;
    return task.tiles[tile] === task.answer[position] ? rightTile : wrongTile;
  }

  return layout({
    prompt: (
      <>
        <div>
          <p className="text-sm text-muted">{t.putInOrder}</p>
          <h1 className="text-2xl font-bold tracking-tight">{task.prompt}</h1>
        </div>

        <div lang="gsw" className="flex min-h-14 flex-wrap items-center gap-2 border-b-2 border-line pb-3">
          {placed.map((tile, position) => (
            <button
              key={tile}
              disabled={answered}
              onClick={() => setPlaced(placed.filter((i) => i !== tile))}
              className={placedClass(tile, position)}
            >
              {task.tiles[tile]}
            </button>
          ))}
        </div>
      </>
    ),
    controls: (
      <>
        <div lang="gsw" className="flex flex-wrap gap-2">
          {task.tiles.map((tile, i) =>
            placed.includes(i) ? null : (
              <button
                key={i}
                disabled={answered}
                onClick={() => setPlaced([...placed, i])}
                className={plainTile}
              >
                {tile}
              </button>
            ),
          )}
        </div>

        {!answered && (
          <button
            disabled={placed.length === 0}
            onClick={() => onAnswer({ type: "build", placed })}
            // At the bottom of the screen, within reach of the thumb.
            className={`${primaryButton} mt-auto`}
          >
            {t.check}
          </button>
        )}
      </>
    ),
  });
}
