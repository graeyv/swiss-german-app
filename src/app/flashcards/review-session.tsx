"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { type Cheer, pickCheer } from "@/lib/flashcards/cheers";
import { advanceQueue } from "@/lib/flashcards/queue";
import { type Dictionary, dictionary, type Locale, translationOf } from "@/lib/i18n";
import type { CardFront, Flashcard, WordCard } from "@/lib/types";
import { isTodaysGoalReached, type SavedReview, submitReview, updateAutoplay, updateCardFront } from "./actions";
import { CARD_FACE, CardStack } from "./card-stack";
import { type Grade, GradeButtons } from "./grade-buttons";
import { StatusBadge } from "./status-badge";
import { Icon } from "@/app/ui/icons";
import { SoundBars } from "@/app/ui/sound-bars";

type ReviewSessionProps = {
  cards: Flashcard[];
  cardFront: CardFront;
  // Whether a word's recording plays by itself as soon as its Swiss German shows.
  autoplay: boolean;
  locale: Locale;
  // Whether today's goal was already met when the session started, so only the session that
  // completes it celebrates.
  goalReachedBefore: boolean;
  emptyMessage: string;
  // Where the learner returns to, such as the category the session started from.
  backHref: string;
  backLabel: string;
};

const primaryButton =
  "w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export function ReviewSession({
  cards,
  cardFront,
  autoplay: autoplayBefore,
  locale,
  goalReachedBefore,
  emptyMessage,
  backHref,
  backLabel,
}: ReviewSessionProps) {
  const t = dictionary(locale).session;
  // Null until the first answer, so a session that hasn't started shows the latest cards.
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  // Cards finished for this session. A missed card goes back into the queue instead.
  const [completed, setCompleted] = useState(0);
  // Words, not answers: each counts once, on its first answer this session. Repeats of a new
  // word are part of learning it, and only words already known count as reviews.
  const [answered, setAnswered] = useState<ReadonlySet<string>>(new Set());
  const [newLearned, setNewLearned] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [front, setFront] = useState(cardFront);
  const [autoplay, setAutoplay] = useState(autoplayBefore);
  // Picked when the last card is answered, for the end screen.
  const [cheer, setCheer] = useState<Cheer | null>(null);
  const [goalJustReached, setGoalJustReached] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const activeQueue = queue ?? cards;
  const finished = queue !== null && queue.length === 0;
  const total = completed + activeQueue.length;

  // Next.js keeps visited routes hidden with their state. Leaving an unfinished session keeps
  // the learner's place, but a finished one must start over when reopened.
  useLayoutEffect(() => {
    if (!finished) return;
    return () => {
      setQueue(null);
      setCompleted(0);
      setAnswered(new Set());
      setNewLearned(0);
      setReviewed(0);
      setCheer(null);
      setGoalJustReached(false);
      setSaveError(null);
    };
  }, [finished]);

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <p aria-hidden className="text-6xl motion-safe:animate-pop">
            {goalJustReached ? "🎯" : "🎉"}
          </p>
          {cheer && (
            <h1 lang="gsw" className="text-4xl font-bold tracking-tight">
              {cheer}
            </h1>
          )}
        </div>

        {newLearned + reviewed > 0 && (
          <div className="flex divide-x divide-line rounded-2xl border border-line bg-surface">
            {newLearned > 0 && (
              <Stat value={newLearned} label={t.newWordsLearned(newLearned)} />
            )}
            {reviewed > 0 && (
              <Stat value={reviewed} label={t.wordsReviewed(reviewed)} />
            )}
          </div>
        )}

        {goalJustReached && (
          <div className="flex items-center gap-4 rounded-2xl bg-yellow p-5 motion-safe:animate-pop">
            <span aria-hidden className="text-3xl">
              🎯
            </span>
            <span className="flex flex-col">
              <strong className="text-lg text-success">{t.goalReached}</strong>
              <span className="text-sm text-muted">{t.goalReachedNote}</span>
            </span>
          </div>
        )}

        <Link href={backHref} className={`${primaryButton} text-center`}>
          {t.backTo(backLabel)}
        </Link>
      </main>
    );
  }

  const card = activeQueue[0];
  if (!card) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <p className="text-muted">{emptyMessage}</p>
        <Link href={backHref} className="underline underline-offset-4">
          {t.backTo(backLabel)}
        </Link>
      </main>
    );
  }

  // The card's next attempt, for when it comes back in this session.
  function repeatOf(result: SavedReview): Flashcard {
    return { ...card, status: "learning", review_id: result.reviewId, intervals: result.intervals };
  }

  async function advance(result: SavedReview) {
    const next = advanceQueue(activeQueue, repeatOf(result), new Date(result.dueAt), new Date());
    if (next.length < activeQueue.length) setCompleted((count) => count + 1);
    if (!answered.has(card.card_id)) {
      setAnswered(new Set(answered).add(card.card_id));
      if (card.status === "new") setNewLearned((count) => count + 1);
      if (card.status === "review") setReviewed((count) => count + 1);
    }
    if (next.length === 0) {
      setCheer(pickCheer());
      // A failed check only skips the celebration, so it doesn't hold up the end screen.
      const reached = await isTodaysGoalReached().catch(() => false);
      setGoalJustReached(reached && !goalReachedBefore);
    }
    setQueue(next);
  }

  // A word moves on as soon as its rating is saved.
  function grade(value: Grade) {
    setSaveError(null);
    // Saving refreshes the page, whose cards would no longer include this one. The session keeps
    // the queue it has from the first answer on.
    setQueue(activeQueue);
    startSaving(async () => {
      const result = await submitReview(card.review_id, card.card_id, value);
      if ("error" in result) {
        setSaveError(result.error);
        return;
      }
      await advance(result);
    });
  }

  // Takes effect straight away. Saving the choice for other sessions happens meanwhile.
  function toggleAutoplay() {
    setAutoplay(!autoplay);
    void updateAutoplay(!autoplay);
  }

  // The card turns over straight away. Saving the choice for other sessions happens meanwhile.
  function swapFront() {
    const next = front === "swiss_german" ? "translation" : "swiss_german";
    setFront(next);
    void updateCardFront(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label={t.leave}
          className="-ml-2 flex size-11 shrink-0 items-center justify-center text-xl text-muted"
        >
          ×
        </Link>
        <div
          role="progressbar"
          aria-label={t.progress}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          className="h-2 flex-1 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {completed} / {total}
        </p>
        {/* A speaker, crossed out while recordings only play on tap. */}
        <button
          onClick={toggleAutoplay}
          aria-pressed={autoplay}
          aria-label={t.autoplay}
          title={autoplay ? t.autoplayOn : t.autoplayOff}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-[color,transform] hover:text-foreground active:scale-90"
        >
          <Icon name="speaker" size={20} />
          {!autoplay && (
            <span aria-hidden className="absolute h-0.5 w-6 rotate-45 rounded-full bg-current ring-2 ring-background" />
          )}
        </button>
        <button
          onClick={swapFront}
          aria-label={front === "swiss_german" ? t.showingSwissGermanFirst : t.showingTranslationFirst}
          title={t.swap}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
        >
          <Icon name="swap" size={20} />
        </button>
      </header>

      <CardStage
        key={card.review_id}
        card={card}
        front={front}
        autoplay={autoplay}
        locale={locale}
        stacked={activeQueue.length > 1}
        saving={saving}
        saveError={saveError}
        onGrade={grade}
      />
    </main>
  );
}

type CardStageProps = {
  card: WordCard;
  front: CardFront;
  autoplay: boolean;
  locale: Locale;
  // Whether more cards wait behind this one, shown as a stack.
  stacked: boolean;
  saving: boolean;
  saveError: string | null;
  onGrade: (grade: Grade) => void;
};

// A word. Keyed by the card's attempt, so each card starts face down.
function CardStage({ card, front, autoplay, locale, stacked, saving, saveError, onGrade }: CardStageProps) {
  const texts = dictionary(locale);
  const t = texts.session;
  const [revealed, setRevealed] = useState(false);
  const recording = useRecording(card.audio_url);
  // The Swiss German shows on the front, or once the card is turned when the translation comes
  // first: hearing it earlier would give the answer away.
  const heard = front === "swiss_german" || revealed;
  // Plays once per card, the first time its Swiss German shows, when the learner wants that.
  const played = useRef(false);
  const { play } = recording;
  useEffect(() => {
    if (!autoplay || !heard || played.current) return;
    played.current = true;
    play();
  }, [autoplay, heard, play]);

  // Space or Enter flips the card, and 1–4 grade it once it's revealed.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("a, button, input")) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      } else if (revealed && !saving && ["1", "2", "3", "4"].includes(event.key)) {
        onGrade(Number(event.key) as Grade);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealed, saving, onGrade]);

  const swissGerman = { text: card.swiss_german, lang: "gsw" };
  // Other ways of saying it, in a quiet line under the Swiss German wherever that shows.
  const variants = (size: "large" | "small") =>
    card.variants.length > 0 && (
      <span lang="gsw" className={`text-teal-soft ${size === "large" ? "text-lg" : "text-base"}`}>
        {t.also}: {card.variants.join(" · ")}
      </span>
    );
  const translation = { text: translationOf(card, locale), lang: locale };
  const [prompt, answer] =
    front === "swiss_german" ? [swissGerman, translation] : [translation, swissGerman];

  return (
    <>
      <CardStack stacked={stacked}>

        <div className="relative min-h-80 flex-1 perspective-distant">
          <button
            onClick={() => setRevealed(!revealed)}
            aria-pressed={revealed}
            className="absolute inset-0 rounded-3xl text-left outline-offset-4"
          >
            <span
              className={`relative block size-full transition-transform duration-500 transform-3d motion-reduce:transition-none ${
                revealed ? "rotate-y-180" : ""
              }`}
            >
              {/* Screen readers only read the side that is showing. */}
              <span aria-hidden={revealed} className={CARD_FACE}>
                <StatusBadge status={card.status} t={t} />
                <span className="flex flex-1 flex-col items-center justify-center gap-2 px-2 text-center">
                  <span lang={prompt.lang} className="text-5xl font-bold tracking-tight break-words">
                    {prompt.text}
                  </span>
                  {front === "swiss_german" && variants("large")}
                </span>
                <span className="mx-auto flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                  <span aria-hidden>👆</span> {t.tapToReveal}
                </span>
              </span>

              <span aria-hidden={!revealed} className={`${CARD_FACE} rotate-y-180`}>
                <span className="flex flex-col">
                  <span lang={prompt.lang} className="text-lg font-semibold text-muted">
                    {prompt.text}
                  </span>
                  {front === "swiss_german" && variants("small")}
                </span>
                <span className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <span lang={answer.lang} className="text-4xl font-bold tracking-tight break-words">
                    {answer.text}
                  </span>
                  {front === "translation" && variants("large")}
                  {/* Unless the translation already is Standard German, that follows as a second one. */}
                  {!texts.translationIsStandardGerman && (
                    <span className="text-muted">
                      {texts.standardGerman} <span lang="de">{card.high_german}</span>
                    </span>
                  )}
                  {card.notes && (
                    <span className="mt-2 max-w-sm rounded-xl bg-highlight px-4 py-3 text-sm">
                      {card.notes}
                    </span>
                  )}
                </span>
              </span>
            </span>
          </button>

          {/* Hearing the word first would give the answer away when the translation is the prompt. */}
          {heard && <AudioButton recording={recording} hasAudio={!!card.audio_url} t={t} />}
        </div>
      </CardStack>

      <footer className="flex min-h-24 flex-col justify-end gap-3">
        {saveError && (
          <p aria-live="polite" className="text-sm text-danger">
            {t.notSaved(saveError)}
          </p>
        )}
        {revealed && <GradeButtons intervals={card.intervals} onGrade={onGrade} disabled={saving} t={t} />}
      </footer>
    </>
  );
}

// One half of the summary panel. Halves share the width equally, and one alone fills it.
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 basis-0 flex-col items-center px-4 py-4 text-center">
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

// A word's recording: play it from the start, and whether it's playing now. It stops when the card
// goes, so a word never plays over the next one.
function useRecording(url: string | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => audio.current?.pause(), []);

  const play = useCallback(() => {
    if (!url) return;
    audio.current ??= new Audio(url);
    const element = audio.current;
    element.onplaying = () => setPlaying(true);
    element.onended = () => setPlaying(false);
    element.onpause = () => setPlaying(false);
    element.currentTime = 0;
    // Browsers can refuse to play before the learner has tapped anything on the page.
    element.play().catch(() => setPlaying(false));
  }, [url]);

  return { play, playing };
}

// Plays the word again. Like the play buttons in Learn, it turns teal with bouncing bars while the
// word plays, and gives under the finger when tapped.
function AudioButton({
  recording,
  hasAudio,
  t,
}: {
  recording: ReturnType<typeof useRecording>;
  hasAudio: boolean;
  t: Dictionary["session"];
}) {
  const { play, playing } = recording;
  return (
    <button
      onClick={play}
      disabled={!hasAudio}
      aria-label={hasAudio ? t.playPronunciation : t.noRecording}
      title={hasAudio ? t.playPronunciation : t.noRecording}
      className={`absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full transition-[background-color,color,transform] active:scale-90 disabled:active:scale-100 ${
        playing ? "bg-teal text-ivory" : hasAudio ? "bg-mist text-teal" : "bg-mist text-teal-soft"
      }`}
    >
      {playing ? <SoundBars /> : <Icon name="speaker" size={20} />}
    </button>
  );
}
