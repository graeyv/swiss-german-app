"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/app/ui/icons";

type ListenButtonProps = {
  url: string | null;
  // For screen readers, naming the side and the word, as the column heading isn't read with it.
  label: string;
  noRecordingLabel: string;
};

// The recording playing on the page, so starting another one stops it: two words at once can't be
// compared.
let current: { audio: HTMLAudioElement; stop: () => void } | null = null;

// A round play button in the examples list: tap it to hear the word, and tap again to stop. It sits
// quietly on mist and turns teal while it plays, with bars bouncing in place of the play icon.
// Without a recording, its icon is pale and it does nothing.
export function ListenButton({ url, label, noRecordingLabel }: ListenButtonProps) {
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
      aria-label={url ? label : `${label}: ${noRecordingLabel}`}
      aria-pressed={url ? playing : undefined}
      className={`flex size-11 items-center justify-center rounded-full transition-transform active:scale-95 disabled:active:scale-100 ${
        playing ? "bg-teal text-ivory" : url ? "bg-mist text-teal" : "bg-mist text-teal-soft"
      }`}
    >
      {playing ? (
        <span aria-hidden className="flex h-4 items-center gap-0.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
              className="h-full w-0.5 rounded-full bg-current motion-safe:animate-sound-bar"
            />
          ))}
        </span>
      ) : (
        <Icon name="play" size={16} className="ml-0.5" />
      )}
    </button>
  );
}
