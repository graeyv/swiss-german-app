// The app's line icons: teal (they take the text colour), 2 px stroke, no box around them. See
// DESIGN.md. Add new ones here rather than drawing them in a screen.
const PATHS = {
  back: "M19 12H5m6-6-6 6 6 6",
  forward: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12.5 4.5 4.5L19 7",
  cross: "M6 6l12 12M18 6 6 18",
  headphones:
    "M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3Zm16 0a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-4a6 6 0 0 1-12 0m6 6v4m-3 0h6",
  // Ratings of a flashcard, after Lucide (ISC licence): try again, hard, good, easy.
  again: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
  hard: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01",
  good: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
  easy: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12ZM9 9h.01M15 9h.01",
  // When something comes back, such as a card's next review.
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  // Lucide "lightbulb" (ISC licence), for what to remember.
  bulb: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4",
} as const;

export type IconName = keyof typeof PATHS;

// For icons named in content files, such as a lesson's.
export function isIconName(name: string): name is IconName {
  return name in PATHS;
}

type IconProps = {
  name: IconName;
  // 24 px for icons in a row of text, 28 px where an icon leads a line, such as a list, 16 px
  // beside a caption, such as the clock before a review time.
  size?: 16 | 24 | 28;
  className?: string;
};

// Decorative: whatever the icon belongs to carries the words for screen readers.
export function Icon({ name, size = 24, className = "" }: IconProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${size === 28 ? "size-7" : size === 16 ? "size-4" : "size-6"} ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
