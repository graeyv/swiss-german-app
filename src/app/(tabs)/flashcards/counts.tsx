// Today's new words and reviews for a deck, as chips. New words come first, as everywhere else.
export function Counts({ newWords, due }: { newWords: number; due: number }) {
  if (newWords + due === 0) return <span className="shrink-0 text-sm text-muted">Done for today</span>;

  return (
    <span className="flex shrink-0 flex-wrap gap-1.5 text-xs font-semibold">
      {newWords > 0 && (
        <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">{newWords} new</span>
      )}
      {due > 0 && (
        <span className="rounded-full bg-line px-2 py-1">
          {due} {due === 1 ? "review" : "reviews"}
        </span>
      )}
    </span>
  );
}
