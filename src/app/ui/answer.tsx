import { Icon } from "./icon";

// Right and wrong from DESIGN.md: correct on sage with a check, wrong on rose with a brick cross.
// The text stays teal either way.
export function answerClass(correct: boolean) {
  return correct ? "bg-sage text-teal" : "bg-rose text-teal";
}

// The check or cross beside an answer. label says it for screen readers, such as "Richtig".
export function AnswerMark({ correct, label }: { correct: boolean; label: string }) {
  return (
    <span role="img" aria-label={label} className={correct ? "text-teal" : "text-brick"}>
      <Icon name={correct ? "check" : "cross"} />
    </span>
  );
}
