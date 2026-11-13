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
} as const;

export type IconName = keyof typeof PATHS;

// For icons named in content files, such as a lesson's.
export function isIconName(name: string): name is IconName {
  return name in PATHS;
}

type IconProps = {
  name: IconName;
  // 24 px for icons in a row of text, 28 px where an icon leads a line, such as a list.
  size?: 24 | 28;
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
      className={`shrink-0 ${size === 28 ? "size-7" : "size-6"} ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
