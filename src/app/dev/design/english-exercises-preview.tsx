"use client";

import { type ReactNode, useState } from "react";
import { PronunciationExercise } from "@/app/exercises/pronunciation/pronunciation-exercise";
import { isPronunciationTask, ruleForLetters } from "@/lib/exercises/pronunciation";
import { dictionary } from "@/lib/i18n";
import { findLesson } from "@/lib/learn/lessons";

// Developer preview only: the English track's pronunciation exercises, from its lesson file, as a
// round shows them, each in a phone-sized screen that starts over once it's done. No recordings
// yet.

const en = dictionary("en");
const SOUNDS = findLesson("be", "sounds")!.lesson;
const RULES = SOUNDS.sections.flatMap((section) => section.rules);

// A phone-sized screen, so the buttons kept at the bottom stay at the bottom of it.
function Phone({ children }: { children: (restart: () => void) => ReactNode }) {
  const [round, setRound] = useState(0);
  return (
    <div
      key={round}
      className="flex h-[600px] w-[390px] max-w-full flex-col overflow-y-auto rounded-[2rem] bg-ivory px-6 ring-1 ring-mist"
    >
      {children(() => setRound(round + 1))}
    </div>
  );
}

// One exercise of the module by its lesson and id, such as "different-letters" and "w".
export function EnglishExercisePreview({ section, id, first = false }: { section: string; id: string; first?: boolean }) {
  const exercise = SOUNDS.sections.find((each) => each.id === section)?.exercises?.find((each) => each.id === id);
  if (!exercise || !isPronunciationTask(exercise)) return <p className="text-caption text-brick">Nicht gefunden: {id}</p>;
  return (
    <Phone>
      {(restart) => (
        <PronunciationExercise
          task={exercise}
          texts={en}
          accent={en.lesson.accents.be}
          dialect={en.lesson.dialects.be}
          first={first}
          // The pill after a mistake shows here as in a round; the round opens the rule in a sheet.
          ruleFor={(letters) => {
            const rule = ruleForLetters(RULES, letters);
            return rule && { title: rule.title, open: () => {} };
          }}
          onDone={restart}
        />
      )}
    </Phone>
  );
}
