"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "./ui/icons";

type TopBarProps = {
  // Where the back button leads. label names it for screen readers when no text is shown.
  back: { href: string; label?: string };
  // Shown beside the arrow, such as "‹ Alltag", when the screen it leads to is worth naming.
  backText?: string;
  // Shown beside the back button, such as a lesson's progress.
  children?: ReactNode;
  className?: string;
};

// The top of every screen with a back button. It stays at the top while the page scrolls
// underneath, so going back never means scrolling up first. A line under it appears once content
// scrolls beneath. It must sit directly in the page's main column, or it scrolls away with
// whatever holds it.
export function TopBar({ back, backText, children, className = "" }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-top-bar
      className={`sticky top-0 z-30 -mx-6 border-b bg-background/85 px-6 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-colors ${
        scrolled ? "border-line" : "border-transparent"
      } ${className}`}
    >
      <div className="flex min-h-14 items-center gap-3">
        <Link
          href={back.href}
          aria-label={backText ? undefined : back.label}
          className="-ml-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 px-1 text-teal transition-colors active:text-teal-soft"
        >
          {backText ? (
            <>
              <span aria-hidden className="text-xl leading-none">
                ‹
              </span>
              <span className="max-w-[60vw] truncate text-sm font-semibold">{backText}</span>
            </>
          ) : (
            <Icon name="back" size={28} />
          )}
        </Link>
        {children}
      </div>
    </div>
  );
}
