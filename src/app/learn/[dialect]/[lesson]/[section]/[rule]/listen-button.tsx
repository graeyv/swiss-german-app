"use client";

import { useEffect, useRef, useState } from "react";

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

// The recording playing on the page, so starting another one stops it: two words at once can't be
// compared.
let current: { audio: HTMLAudioElement; stop: () => void } | null = null;

// One cell of the examples table: tap it to hear the word, and tap again to stop. While it plays,
// bars bounce in place of the play icon. Without a recording, it still shows the sound.
export function ListenButton({
  sound,
  url,
  playLabel,
  noRecordingLabel,
  highlighted = false,
}: ListenButtonProps) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Stops the sound when the learner moves on to the next topic.
  useEffect(() => () => audio.current?.pause(), []);

  function stop() {
    audio.current?.pause();
    if (current?.audio === audio.current) current = null;
    setPlaying(false);
  }

  function play() {
    if (!url) return;
    if (playing) return stop();
    current?.stop();
    audio.current ??= new Audio(url);
    const element = audio.current;
    element.currentTime = 0;
    element.onended = stop;
    current = { audio: element, stop };
    setPlaying(true);
    element.play().catch(stop);
  }

  return (
    <button
      type="button"
      onClick={play}
      disabled={!url}
      aria-label={`${url ? playLabel : noRecordingLabel}: ${sound}`}
      aria-pressed={url ? playing : undefined}
      className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-transform enabled:active:scale-95 ${
        highlighted || playing ? "font-semibold text-foreground" : "text-muted"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-shadow ${
          url ? "bg-accent text-accent-foreground" : "bg-line text-muted"
        } ${playing ? "ring-4 ring-accent/25" : ""}`}
      >
        {playing ? (
          <span className="flex h-3.5 items-center gap-0.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                style={{ animationDelay: `${delay}ms` }}
                className="h-full w-0.5 rounded-full bg-current motion-safe:animate-sound-bar"
              />
            ))}
          </span>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
            <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
          </svg>
        )}
      </span>
      <span className="min-w-0 text-sm leading-snug">{sound}</span>
    </button>
  );
}
