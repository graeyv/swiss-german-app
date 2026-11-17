import type { ReactNode } from "react";

// Cards and pills from DESIGN.md. Mist for everyday cards, sage for content that should stand out
// as a group, yellow only for an achievement, at most once per screen.
type Tone = "mist" | "sage" | "yellow";

const TONES: Record<Tone, string> = { mist: "bg-mist", sage: "bg-sage", yellow: "bg-yellow" };

type CardProps = { tone?: Tone; className?: string; children: ReactNode };

// No border, no shadow: the background sets it off.
export function Card({ tone = "mist", className = "", children }: CardProps) {
  return <div className={`rounded-3xl p-6 ${TONES[tone]} ${className}`}>{children}</div>;
}

type PillProps = { tone?: Tone | "teal" | "ivory"; className?: string; children: ReactNode };

// A small label, such as "= gleich" or a card's status. Ivory stands out on a mist card.
export function Pill({ tone = "mist", className = "", children }: PillProps) {
  const colours =
    tone === "teal" ? "bg-teal text-ivory" : tone === "ivory" ? "bg-ivory text-teal" : `${TONES[tone]} text-teal`;
  return (
    <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-semibold ${colours} ${className}`}>
      {children}
    </span>
  );
}
