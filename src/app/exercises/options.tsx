"use client";

import { useState } from "react";

type OptionsProps = {
  options: string[];
  answer: number;
  answered: boolean;
  // Swiss German options are marked, so screen readers pronounce them as such.
  lang?: string;
  onPick: (index: number) => void;
};

// A column of options. Once answered, the right one turns green and a wrong pick red.
export function Options({ options, answer, answered, lang, onPick }: OptionsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function optionClass(i: number) {
    if (answered && i === answer) return "border-success text-success";
    if (answered && i === selected) return "border-danger text-danger";
    return "border-line";
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, i) => (
        <button
          key={i}
          lang={lang}
          disabled={answered}
          onClick={() => {
            setSelected(i);
            onPick(i);
          }}
          className={`rounded-xl border-2 bg-surface p-4 text-left font-medium transition-colors enabled:hover:border-accent ${optionClass(i)}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
