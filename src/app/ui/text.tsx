import type { ReactNode } from "react";

// Text styles from DESIGN.md that are more than a size: the rest is the text-title, text-heading,
// text-subtitle, text-body and text-caption sizes in globals.css.

// The small line above a title, such as "LEKTION 1".
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{children}</p>
  );
}

// A hand-drawn yellow marker behind a few words, such as a lesson's subtitle. The screen's one
// yellow element.
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="-mx-2 rounded-[0.6em_0.3em_0.5em_0.25em/0.4em_0.5em_0.35em_0.5em] bg-yellow box-decoration-clone px-2 py-0.5">
      {children}
    </span>
  );
}
