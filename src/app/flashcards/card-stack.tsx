import type { ReactNode } from "react";

// One side of a card that turns over. Both sides sit on top of each other, and the back starts
// turned away with rotate-y-180.
export const CARD_FACE =
  "absolute inset-0 flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-lg backface-hidden";

// The card in play, with the cards waiting behind it shown as a stack.
export function CardStack({ stacked, children }: { stacked: boolean; children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col">
      {stacked && (
        <>
          <div
            aria-hidden
            className="absolute inset-x-6 top-4 -bottom-4 rounded-3xl border border-line bg-surface opacity-50"
          />
          <div
            aria-hidden
            className="absolute inset-x-3 top-2 -bottom-2 rounded-3xl border border-line bg-surface opacity-80"
          />
        </>
      )}
      {children}
    </div>
  );
}
