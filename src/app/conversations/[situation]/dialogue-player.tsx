"use client";

import { useEffect, useRef, useState } from "react";
import { type Line, lineAt, lineSpans } from "@/lib/conversations";
import { dictionary, type Locale } from "@/lib/i18n";

type DialoguePlayerProps = {
  audio: string | null;
  lines: Line[];
  locale: Locale;
};

// Slower helps catch what's said. Each tap on the speed button moves to the next.
const RATES = [1, 0.75] as const;

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// Plays a conversation and shows its transcript. The transcript stays locked until the
// conversation has been heard to the end once, since listening is the skill being trained, but a
// learner can open it anyway. Once it's open, tapping a line plays just that line, and the line
// being spoken is highlighted. Without a recording, the transcript is open from the start.
export function DialoguePlayer({ audio, lines, locale }: DialoguePlayerProps) {
  const t = dictionary(locale).conversations;
  const player = useRef<HTMLAudioElement>(null);
  // Where to stop when a single line is playing.
  const stopAt = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const [unlocked, setUnlocked] = useState(audio === null);
  const [transcriptOpen, setTranscriptOpen] = useState(audio === null);
  const [translationOpen, setTranslationOpen] = useState(false);

  const spans = lineSpans(lines);
  const percent = duration ? Math.min(100, (time / duration) * 100) : 0;
  const current = playing || time > 0 ? lineAt(lines, time) : -1;
  // Speakers alternate sides like in a chat, in the order they first speak.
  const speakers = [...new Set(lines.map((line) => line.speaker))];

  // The page is rendered on the server, so the browser can learn the recording's length before
  // this code runs and its loadedmetadata event is missed. Read it once here too.
  useEffect(() => {
    const element = player.current;
    if (element && element.readyState >= 1 && Number.isFinite(element.duration)) {
      setDuration(element.duration);
    }
    // Stops the conversation when the learner leaves the page.
    return () => element?.pause();
  }, []);

  // timeupdate only fires a few times a second, so while playing the position follows every
  // frame, for a bar that moves smoothly.
  useEffect(() => {
    if (!playing) return;
    let frame = requestAnimationFrame(function follow() {
      const element = player.current;
      if (element) setTime(element.currentTime);
      frame = requestAnimationFrame(follow);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // The transcript follows the conversation: each new line scrolls to the middle of the screen,
  // above the controls. Once the learner scrolls themselves, it stops following, so they can
  // reread in peace, and a button takes them back. Playing, skipping, seeking or tapping a line
  // follows again, since each asks to be taken to that point.
  const bubbles = useRef<(HTMLLIElement | null)[]>([]);
  const controls = useRef<HTMLElement>(null);
  const [following, setFollowing] = useState(true);
  // Where the line being spoken is when it's off screen while not following, for the button.
  const [currentIs, setCurrentIs] = useState<"above" | "below" | "visible">("visible");

  useEffect(() => {
    if (!following || current < 0 || stopAt.current !== null) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bubbles.current[current]?.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [current, following, transcriptOpen]);

  // Only the learner's own touch, wheel or keys count as scrolling: the transcript's own smooth
  // scrolling fires scroll events too. Touches on the controls, such as dragging the progress
  // bar, don't count either.
  useEffect(() => {
    const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    function scrolledByLearner(event: Event) {
      if (event.target instanceof Node && controls.current?.contains(event.target)) return;
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.includes(event.key)) return;
      setFollowing(false);
    }
    const events = ["touchmove", "wheel", "keydown"] as const;
    for (const name of events) window.addEventListener(name, scrolledByLearner, { passive: true });
    return () => {
      for (const name of events) window.removeEventListener(name, scrolledByLearner);
    };
  }, []);

  useEffect(() => {
    if (following) return;
    let frame = 0;
    function locate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = bubbles.current[current]?.getBoundingClientRect();
        const bottom = controls.current?.getBoundingClientRect().top ?? window.innerHeight;
        setCurrentIs(!box ? "visible" : box.bottom < 0 ? "above" : box.top > bottom ? "below" : "visible");
      });
    }
    locate();
    window.addEventListener("scroll", locate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", locate);
    };
  }, [following, current]);

  function seek(to: number) {
    const element = player.current;
    if (!element) return;
    setFollowing(true);
    stopAt.current = null;
    element.currentTime = Math.min(Math.max(0, to), duration || element.duration || 0);
    setTime(element.currentTime);
  }

  function toggle() {
    const element = player.current;
    if (!element) return;
    if (element.paused) {
      setFollowing(true);
      stopAt.current = null;
      if (element.ended) element.currentTime = 0;
      void element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }

  function changeRate() {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (player.current) player.current.playbackRate = next;
  }

  function playLine(index: number) {
    const element = player.current;
    const span = spans[index];
    if (!element || !span) return;
    setFollowing(true);
    element.currentTime = span.start;
    stopAt.current = span.end;
    void element.play().catch(() => setPlaying(false));
  }

  return (
    <>
      <section aria-label={t.transcript} className="flex flex-1 flex-col gap-4 pb-6">
        {!unlocked ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-highlight px-4 py-3">
            <p>{t.listenFirst}</p>
            <button
              type="button"
              onClick={() => {
                setUnlocked(true);
                setTranscriptOpen(true);
              }}
              className="-ml-1 min-h-11 px-1 text-sm font-semibold text-muted underline underline-offset-4 hover:text-foreground"
            >
              {t.showAnyway}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <ToggleButton open={transcriptOpen} onClick={() => setTranscriptOpen(!transcriptOpen)}>
              {transcriptOpen ? t.hideTranscript : t.showTranscript}
            </ToggleButton>
            {transcriptOpen && (
              <ToggleButton open={translationOpen} onClick={() => setTranslationOpen(!translationOpen)}>
                {translationOpen ? t.hideTranslation : t.showTranslation}
              </ToggleButton>
            )}
          </div>
        )}

        {unlocked && transcriptOpen && (
          <ol className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const right = speakers.indexOf(line.speaker) % 2 === 1;
              const playable = audio !== null && spans[index] !== null;
              const content = (
                <>
                  <span className="text-xs font-semibold text-muted">{line.speaker}</span>
                  <span lang="gsw" className="font-semibold">
                    {line.swissGerman}
                  </span>
                  {translationOpen && <Translation line={line} locale={locale} />}
                </>
              );
              const bubble = `flex max-w-[85%] flex-col gap-0.5 rounded-2xl px-4 py-2.5 text-left transition-colors ${
                right ? "rounded-br-md" : "rounded-bl-md"
              } ${index === current ? "bg-accent/10 ring-2 ring-accent" : "bg-surface ring-1 ring-line"}`;

              return (
                <li
                  key={index}
                  ref={(element) => {
                    bubbles.current[index] = element;
                  }}
                  className={`flex ${right ? "justify-end" : "justify-start"}`}
                >
                  {playable ? (
                    <button
                      type="button"
                      onClick={() => playLine(index)}
                      aria-label={`${t.playLine(line.speaker)}: ${line.swissGerman}`}
                      aria-current={index === current ? "true" : undefined}
                      className={`${bubble} active:scale-[0.98]`}
                    >
                      {content}
                    </button>
                  ) : (
                    <p className={bubble}>{content}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* The controls stay at the bottom, within thumb reach, however long the transcript is. */}
      <footer
        ref={controls}
        className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t border-line bg-background px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Floats above the controls while the transcript isn't following and the line being
            spoken is off screen. */}
        {!following && unlocked && transcriptOpen && current >= 0 && currentIs !== "visible" && (
          <button
            type="button"
            onClick={() => setFollowing(true)}
            className="absolute -top-14 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold whitespace-nowrap text-background shadow-lg transition-transform active:scale-95"
          >
            <span aria-hidden>{currentIs === "above" ? "↑" : "↓"}</span>
            {t.followAgain}
          </button>
        )}
        {audio ? (
          <>
            <audio
              ref={player}
              src={audio}
              preload="metadata"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              onDurationChange={(event) => {
                if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration);
              }}
              onSeeked={(event) => setTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(event) => {
                const element = event.currentTarget;
                setTime(element.currentTime);
                if (stopAt.current !== null && element.currentTime >= stopAt.current) {
                  stopAt.current = null;
                  element.pause();
                }
              }}
              onEnded={() => {
                setPlaying(false);
                setUnlocked(true);
              }}
            />
            {/* The bar is drawn here, with a transparent native slider on top: it takes taps and
                drags anywhere along it, the keyboard and screen readers, and looks the same in
                every browser. */}
            <div className="flex flex-col">
              <div className="relative flex h-11 items-center">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <span
                  aria-hidden
                  className="absolute size-4 -translate-x-1/2 rounded-full bg-accent shadow-sm ring-2 ring-background"
                  style={{ left: `${percent}%` }}
                />
                <input
                  type="range"
                  aria-label={t.progress}
                  aria-valuetext={`${clock(time)} / ${clock(duration)}`}
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={Math.min(time, duration || 1)}
                  disabled={!duration}
                  onChange={(event) => seek(Number(event.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                />
              </div>
              <div className="flex justify-between text-xs text-muted tabular-nums">
                <span>{clock(time)}</span>
                <span>{clock(duration)}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center justify-items-center">
              <button
                type="button"
                onClick={changeRate}
                aria-label={t.speed(`${rate}×`)}
                className={`flex h-12 min-w-12 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums transition-colors ${
                  rate === 1 ? "text-muted hover:text-foreground" : "bg-accent/10 text-accent"
                }`}
              >
                {rate}×
              </button>
              <SkipButton label={t.back5} onClick={() => seek(time - 5)} direction="back" />
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? t.pause : t.play}
                className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-transform active:scale-95"
              >
                {playing ? (
                  <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-7">
                    <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
                  </svg>
                ) : (
                  <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="ml-1 size-7">
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
                  </svg>
                )}
              </button>
              <SkipButton label={t.forward5} onClick={() => seek(time + 5)} direction="forward" />
              <button
                type="button"
                onClick={() => seek(0)}
                aria-label={t.restart}
                className="flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-6">
                  <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <p className="flex min-h-16 items-center justify-center rounded-2xl bg-line/60 font-semibold text-muted">
            {t.noRecording}
          </p>
        )}
      </footer>
    </>
  );
}

// Five seconds back or forward: a circular arrow with the 5 inside.
function SkipButton({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "back" | "forward";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground active:scale-95"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`size-8 ${direction === "forward" ? "-scale-x-100" : ""}`}
      >
        <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8" />
      </svg>
      <span aria-hidden className="absolute pt-0.5 text-[0.65rem] font-bold">
        5
      </span>
    </button>
  );
}

function ToggleButton({ open, onClick, children }: { open: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={open}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
        open ? "border-accent bg-accent/10 text-accent" : "border-line bg-surface hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

// Learners whose interface is German read Standard German; others read their own language, with
// Standard German as a second line, like on the flashcards.
function Translation({ line, locale }: { line: Line; locale: Locale }) {
  if (dictionary(locale).translationIsStandardGerman) {
    return (
      <span lang="de" className="text-sm text-muted">
        {line.standardGerman}
      </span>
    );
  }
  return (
    <>
      <span lang={locale} className="text-sm text-muted">
        {line.english}
      </span>
      <span lang="de" className="text-xs text-muted">
        {line.standardGerman}
      </span>
    </>
  );
}
