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
  const current = playing || time > 0 ? lineAt(lines, time) : -1;
  // Speakers alternate sides like in a chat, in the order they first speak.
  const speakers = [...new Set(lines.map((line) => line.speaker))];

  // Stops the conversation when the learner leaves the page.
  useEffect(() => () => player.current?.pause(), []);

  function toggle() {
    const element = player.current;
    if (!element) return;
    if (element.paused) {
      stopAt.current = null;
      if (element.ended) element.currentTime = 0;
      void element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }

  function skipBack() {
    const element = player.current;
    if (element) element.currentTime = Math.max(0, element.currentTime - 5);
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
                <li key={index} className={`flex ${right ? "justify-end" : "justify-start"}`}>
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
      <footer className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t border-line bg-background px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {audio ? (
          <>
            <audio
              ref={player}
              src={audio}
              preload="metadata"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
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
            <div className="flex items-center gap-3 text-xs text-muted tabular-nums">
              <span>{clock(time)}</span>
              <input
                type="range"
                aria-label={t.progress}
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(event) => {
                  if (player.current) player.current.currentTime = Number(event.target.value);
                }}
                className="h-11 flex-1 accent-accent"
              />
              <span>{clock(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={skipBack}
                aria-label={t.back5}
                className="flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-7">
                  <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
              </button>
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
              <button
                type="button"
                onClick={changeRate}
                aria-label={t.speed(`${rate}×`)}
                className="flex size-12 items-center justify-center rounded-full text-sm font-semibold text-muted tabular-nums transition-colors hover:text-foreground"
              >
                {rate}×
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
