// Three bars bouncing in turn, in place of a play or speaker icon while a recording plays. Still for
// learners who'd rather have less motion. See DESIGN.md.
export function SoundBars() {
  return (
    <span aria-hidden className="flex h-4 items-center gap-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="h-full w-0.5 rounded-full bg-current motion-safe:animate-sound-bar"
        />
      ))}
    </span>
  );
}
