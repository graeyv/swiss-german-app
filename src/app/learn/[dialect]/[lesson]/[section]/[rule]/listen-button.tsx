"use client";

type ListenButtonProps = {
  // How the sound is called on this side, such as "Ach-Laut".
  sound: string;
  url: string | null;
  // For screen readers, which also name the side, as the column heading isn't read with it.
  playLabel: string;
  noRecordingLabel: string;
  // Marks the side where the sound differs from Standard German.
  highlighted?: boolean;
};

// One cell of the examples table: tap it to hear the word. Without a recording, it still shows the
// sound.
export function ListenButton({
  sound,
  url,
  playLabel,
  noRecordingLabel,
  highlighted = false,
}: ListenButtonProps) {
  return (
    <button
      type="button"
      onClick={() => url && void new Audio(url).play().catch(() => {})}
      disabled={!url}
      aria-label={`${url ? playLabel : noRecordingLabel}: ${sound}`}
      className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-2 py-2 text-left ${
        highlighted ? "font-semibold text-foreground" : "text-muted"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          url ? "bg-accent text-accent-foreground" : "bg-line text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
        </svg>
      </span>
      <span className="min-w-0 text-sm leading-snug">{sound}</span>
    </button>
  );
}
