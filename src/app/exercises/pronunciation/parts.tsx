"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Button, TextButton } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { SoundBars } from "@/app/ui/sound-bars";
import { Eyebrow } from "@/app/ui/text";
import { letterTiles } from "@/lib/exercises/pronunciation";
import type { Dictionary } from "@/lib/i18n";
import type { Player, Recorder } from "./audio";

// The parts the pronunciation exercises share. See DESIGN.md.

// A word as it's written, with its bracketed letters underlined in sage, unless underline is off.
// small: a thinner line, for text in body or heading size, such as a sentence or the round's review.
export function MarkedWord({ word, underline = true, small = false }: { word: string; underline?: boolean; small?: boolean }) {
  const line = small ? "decoration-2 underline-offset-4" : "decoration-4 underline-offset-8";
  return letterTiles(word).map((tile, position) => (
    <span key={position} className={underline && tile.marked ? `underline decoration-sage ${line}` : ""}>
      {tile.text}
    </span>
  ));
}

// What to do, under what the exercises are: "HOCHDEUTSCH MIT BERNER AKZENT", or the dialect's name,
// "BÄRNDÜTSCH", when the words are its own, as in the English track. In the German track, the
// round's first exercise also says once why the words stay Standard German.
export function Instruction({
  accent,
  dialect,
  first,
  t,
  children,
}: {
  accent: string;
  // The dialect's name, when the words are its own rather than Standard German with its accent.
  dialect?: string;
  first: boolean;
  t: Dictionary["pronunciation"];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow>{dialect ?? t.frame(accent)}</Eyebrow>
      <p className="text-body">{children}</p>
      {first && !dialect && <p className="text-caption text-teal-soft">{t.why}</p>}
    </div>
  );
}

// Underlines the letters to watch, before the learner says it.
export function Tip({ onTip, t }: { onTip: () => void; t: Dictionary["pronunciation"] }) {
  return (
    <button
      type="button"
      onClick={onTip}
      className="flex min-h-11 items-center gap-2 self-center rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
    >
      <Icon name="bulb" size={16} />
      {t.tip}
    </button>
  );
}

// The buttons at the bottom of an exercise, within thumb reach.
export function Footer({ children }: { children: ReactNode }) {
  return (
    <footer className="sticky bottom-0 -mx-6 flex flex-col gap-3 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </footer>
  );
}

// Recordings side by side, each a round play button named below it, playing again on tap. The
// learner's own has a microphone, the others a speaker. One not recorded yet is inactive.
export function Compare({
  player,
  clips,
  t,
}: {
  player: Player;
  clips: { key: string; label: string; url: string | null }[];
  t: Dictionary["pronunciation"];
}) {
  return (
    <div className="flex justify-center gap-8">
      {clips.map((clip) => {
        const playing = player.playing === clip.key;
        return (
          <button
            key={clip.key}
            type="button"
            disabled={!clip.url}
            onClick={() => player.play([clip])}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className={`flex size-14 items-center justify-center rounded-full transition-[background-color,color,transform] group-active:scale-90 group-disabled:scale-100 ${
                playing ? "bg-teal text-ivory" : clip.url ? "bg-mist text-teal" : "bg-mist text-teal-soft"
              }`}
            >
              {playing ? <SoundBars /> : <Icon name={clip.key === "own" ? "mic" : "speaker"} size={24} />}
            </span>
            <span className={`text-caption font-semibold ${clip.url ? "" : "text-teal-soft"}`}>{clip.label}</span>
            {!clip.url && <span className="text-caption text-teal-soft">{t.noRecording}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Records, with a bar filling up meanwhile and "Fertig" to stop early. Without a microphone, the
// learner says it out loud and goes on to listen, without a recording.
export function RecordButton({
  recorder,
  maxMs,
  onRecorded,
  t,
}: {
  recorder: Recorder;
  maxMs: number;
  onRecorded: (url: string | null) => void;
  t: Dictionary["pronunciation"];
}) {
  if (recorder.state === "denied") {
    return (
      <Button onClick={() => onRecorded(null)}>
        <Icon name="speaker" size={20} />
        {t.said}
      </Button>
    );
  }
  if (recorder.state === "recording") {
    return (
      <div className="flex flex-col gap-3">
        <RecordingBar ms={maxMs} label={t.recording} />
        <Button onClick={recorder.stop}>{t.stop}</Button>
      </div>
    );
  }
  return (
    <Button onClick={() => recorder.start(onRecorded)}>
      <Icon name="mic" size={20} />
      {t.record}
    </Button>
  );
}

// Fills up over the longest a recording can take.
function RecordingBar({ ms, label }: { ms: number; label: string }) {
  const fill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = still
      ? undefined
      : fill.current?.animate([{ width: "0%" }, { width: "100%" }], { duration: ms, easing: "linear", fill: "forwards" });
    return () => animation?.cancel();
  }, [ms]);
  return (
    <span role="status" aria-label={label} className="flex h-2 overflow-hidden rounded-full bg-mist">
      <span ref={fill} className="h-full bg-teal motion-reduce:w-full" />
    </span>
  );
}

// After saying it, at the bottom: the question, with its answers right below it, so they read as
// one. "Ja" goes on, as right; "Noch nicht" records again at once (without a microphone, it plays
// both again); and a quiet "Trotzdem weiter" goes on without it, as not right.
export function SelfCheck({
  recorder,
  onAnswer,
  onRecorded,
  t,
}: {
  recorder: Recorder;
  onAnswer: (same: boolean) => void;
  onRecorded: (url: string | null) => void;
  t: Dictionary["pronunciation"];
}) {
  return (
    <>
      <p className="text-center text-subtitle font-semibold">{t.sameQuestion}</p>
      <Button onClick={() => onAnswer(true)}>{t.yes}</Button>
      <Button
        variant="secondary"
        onClick={() => (recorder.state === "denied" ? onRecorded(null) : recorder.start(onRecorded))}
      >
        <Icon name="mic" size={20} />
        {t.notYet}
      </Button>
      <TextButton onClick={() => onAnswer(false)}>{t.skip}</TextButton>
    </>
  );
}
