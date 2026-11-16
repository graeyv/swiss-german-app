"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

// The room the tab bar takes at the bottom on phones, which hides what's underneath it.
const TAB_BAR = 112;
// How much of the row above stays in sight, so it's clear there's more above.
const PEEK = 72;

// Opens the page scrolled to its child when the child's end would otherwise be out of sight, such
// as the module where the learner left off far down the Learn tab. Only on arrival, at once rather
// than animated, and not at all when the child is already in reach.
export function ScrollIntoReach({ children }: { children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = element.current?.getBoundingClientRect();
    if (!box) return;
    const bottom = window.innerHeight - (window.matchMedia("(min-width: 48rem)").matches ? 0 : TAB_BAR);
    if (box.bottom <= bottom) return;
    window.scrollTo({ top: window.scrollY + box.top - PEEK, behavior: "instant" });
  }, []);

  return <div ref={element}>{children}</div>;
}
