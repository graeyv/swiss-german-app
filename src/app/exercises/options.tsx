"use client";

type OptionsProps = {
  options: string[];
  answer: number;
  // The option the learner picked, once they have.
  selected: number | null;
  answered: boolean;
  // Swiss German options are marked, so screen readers pronounce them as such.
  lang?: string;
  onPick: (index: number) => void;
};

// A column of options. Once answered, the right one turns green and a wrong pick red.
export function Options({ options, answer, selected, answered, lang, onPick }: OptionsProps) {
  function optionClass(i: number) {
    if (answered && i === answer) return "border-success bg-success/10 text-success";
    if (answered && i === selected) return "border-danger bg-danger/10 text-danger";
    return "border-line bg-surface";
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, i) => (
        <button
          key={i}
          lang={lang}
          disabled={answered}
          onClick={() => onPick(i)}
          className={`rounded-xl border-2 p-4 text-left font-medium transition-colors enabled:hover:border-accent ${optionClass(i)}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
