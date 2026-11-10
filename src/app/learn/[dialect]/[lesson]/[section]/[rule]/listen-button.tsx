"use client";

type ListenButtonProps = {
  // The variety, such as Standard German, and how the sound is called in it.
  label: string;
  sound: string;
  url: string | null;
  playLabel: string;
  noRecordingLabel: string;
  highlighted?: boolean;
};

// One side of an example: tap it to hear the word. Without a recording, it still shows the sound.
export function ListenButton({
  label,
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
      className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
        highlighted ? "border-accent/40 bg-accent/5" : "border-line bg-surface"
      } enabled:hover:border-accent`}
    >
      <span
        aria-hidden
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          url ? "bg-accent text-accent-foreground" : "bg-line text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
          <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold">{sound}</span>
      </span>
    </button>
  );
}
