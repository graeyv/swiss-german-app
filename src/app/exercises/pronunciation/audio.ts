"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A recording to play, by a key that says which one is playing, such as "own" or "dialect".
export type Clip = { key: string; url: string | null };

// Plays clips one after the other, with a short pause between them, and tells which one is
// playing. A clip without a recording is skipped. Everything stops when the exercise goes.
export function usePlayer() {
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    audio.current?.pause();
    audio.current = null;
    window.clearTimeout(timer.current);
    setPlaying(null);
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (queue: Clip[]) => {
      stop();
      const next = (rest: Clip[]) => {
        const [clip, ...after] = rest;
        if (!clip) return setPlaying(null);
        if (!clip.url) return next(after);
        setPlaying(clip.key);
        const then = () => {
          setPlaying(null);
          timer.current = window.setTimeout(() => next(after), 300);
        };
        const element = new Audio(clip.url);
        audio.current = element;
        element.onended = then;
        // Browsers can refuse to play, such as when the file is missing.
        element.play().catch(then);
      };
      next(queue);
    },
    [stop],
  );

  return { playing, play };
}

export type Player = ReturnType<typeof usePlayer>;

// Records from the microphone, stopping by itself after maxMs. state is "denied" when there's no
// microphone or the learner didn't allow it. The recording stays in the browser.
export function useRecorder(maxMs: number) {
  const [state, setState] = useState<"idle" | "recording" | "denied">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(
    async (onDone: (url: string) => void) => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setState("denied");
        return;
      }
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      recorder.current = media;
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const recording = URL.createObjectURL(new Blob(chunks, { type: media.mimeType }));
        setUrl(recording);
        setState("idle");
        onDone(recording);
      };
      media.start();
      setState("recording");
      timer.current = window.setTimeout(stop, maxMs);
    },
    [maxMs, stop],
  );

  // A new recording replaces the last one, which is let go.
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  // Leaving while recording stops the microphone without playing anything.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      const media = recorder.current;
      if (!media) return;
      media.onstop = () => media.stream.getTracks().forEach((track) => track.stop());
      if (media.state === "recording") media.stop();
    },
    [],
  );

  return { state, url, start, stop };
}

export type Recorder = ReturnType<typeof useRecorder>;
