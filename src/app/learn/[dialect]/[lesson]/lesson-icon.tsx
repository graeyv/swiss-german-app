// Icons a lesson's content can name. An unknown name shows a plain dot, so a typo in a lesson file
// doesn't break the screen.
const PATHS: Record<string, string> = {
  // Sound waves, for hearing the sounds.
  sound: "M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2",
  // Heroicons "microphone", for speaking.
  speak:
    "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
};

export function LessonIcon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
    >
      {name in PATHS ? <path d={PATHS[name]} /> : <circle cx="12" cy="12" r="2" />}
    </svg>
  );
}
