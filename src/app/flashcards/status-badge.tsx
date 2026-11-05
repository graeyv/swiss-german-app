import type { Dictionary } from "@/lib/i18n";
import type { Flashcard } from "@/lib/types";

const BADGES: Record<Flashcard["status"], string> = {
  new: "bg-accent/10 text-accent",
  learning: "bg-tint-yellow",
  review: "bg-line",
};

// Whether the card is new, in its learning steps, or a review.
export function StatusBadge({ status, t }: { status: Flashcard["status"]; t: Dictionary["session"] }) {
  return (
    <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[status]}`}>
      {t.statuses[status]}
    </span>
  );
}
