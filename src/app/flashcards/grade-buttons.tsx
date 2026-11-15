import { Icon } from "@/app/ui/icon";
import type { Dictionary } from "@/lib/i18n";

export type Grade = 1 | 2 | 3 | 4;

const GRADES = [
  { grade: 1, key: "again" },
  { grade: 2, key: "hard" },
  { grade: 3, key: "good" },
  { grade: 4, key: "easy" },
] as const;

// "Again" is on rose with a brick icon, like a wrong answer. The others get greener the better the
// learner knew the card: mist, light sage, sage. Full class names, so Tailwind finds them.
const TONES: Record<Grade, string> = {
  1: "bg-rose text-brick",
  2: "bg-mist text-teal",
  3: "bg-sage-light text-teal",
  4: "bg-sage text-teal",
};

type GradeButtonsProps = {
  // When the card comes back after each rating, such as "10 Min." or "3 T.".
  intervals: Record<Grade, string>;
  onGrade: (grade: Grade) => void;
  disabled?: boolean;
  t: Dictionary["session"];
};

// How well the learner knew a card: four cards with a face (or arrows, to try again) and a word,
// and below each, with a clock, when the card comes back.
export function GradeButtons({ intervals, onGrade, disabled, t }: GradeButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADES.map(({ grade, key }) => (
        <button
          key={grade}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(grade)}
          aria-label={`${t.grades[key]}, ${intervals[grade]}`}
          className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 disabled:active:scale-100"
        >
          <span
            className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl ${TONES[grade]}`}
          >
            <Icon name={key} size={28} />
            <span className="text-caption font-semibold text-teal">{t.grades[key]}</span>
          </span>
          <span className="flex items-center gap-1 text-caption text-teal-soft tabular-nums">
            <Icon name="clock" size={16} />
            {intervals[grade]}
          </span>
        </button>
      ))}
    </div>
  );
}
