"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { type Cheer, pickCheer } from "@/lib/flashcards/cheers";
import { advanceQueue } from "@/lib/flashcards/queue";
import { type Dictionary, dictionary, type Locale } from "@/lib/i18n";
import type { CardFront, Flashcard, WordCard } from "@/lib/types";
import {
  getTodaysGoal,
  markRatingTipSeen,
  type SavedReview,
  submitReview,
  type TodaysGoal,
  updateAutoplay,
  updateCardFront,
} from "./actions";
import { CARD_FACE, CardStack } from "./card-stack";
import { type Grade, GradeButtons } from "./grade-buttons";
import { SessionEnd } from "./session-end";
import { WordCardSide } from "./word-card-side";
import { Icon } from "@/app/ui/icons";
import { SoundBars } from "@/app/ui/sound-bars";
import { Tip } from "@/app/ui/tip";

type ReviewSessionProps = {
  cards: Flashcard[];
  cardFront: CardFront;
  // Whether a word's recording plays by itself as soon as its Swiss German shows.
  autoplay: boolean;
  // Whether to explain the rating buttons, once, on the first card the learner turns over.
  ratingTip: boolean;
  // Whether lifting today's limit would bring more new cards of this topic, offered at the end.
  canLift: boolean;
  locale: Locale;
  // The learner's dialect by its own name, such as "Bärndütsch", above the Swiss German on a card.
  dialectName?: string;
  // Whether today's goal was already met when the session started, so only the session that
  // completes it celebrates.
  goalReachedBefore: boolean;
  emptyMessage: string;
  // Where the learner returns to, such as the category the session started from.
  backHref: string;
  backLabel: string;
};
export function ReviewSession({
  cards,
  cardFront,
  autoplay: autoplayBefore,
  ratingTip,
  canLift,
  locale,
  dialectName,
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
  // Until the learner rates their first card with the tip showing.
  const [showTip, setShowTip] = useState(ratingTip);
  // Picked when the last card is answered, for the end screen.
  const [cheer, setCheer] = useState<Cheer | null>(null);
  // Today's goal, when this session reached it.
  const [goal, setGoal] = useState<TodaysGoal | null>(null);
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
      setGoal(null);
      setSaveError(null);
    };
  }, [finished]);

  if (finished) {
    return (
      <SessionEnd
        cheer={cheer}
        newLearned={newLearned}
        reviewed={reviewed}
        goal={goal}
        backHref={backHref}
        backLabel={backLabel}
        canLift={canLift}
        locale={locale}
      />
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
      const today = await getTodaysGoal().catch(() => null);
      setGoal(today?.reached && !goalReachedBefore ? today : null);
    }
    setQueue(next);
  }

  // A word moves on as soon as its rating is saved.
  function grade(value: Grade) {
    setSaveError(null);
    // Rating once is what the tip explains, so it's seen. Saving that happens meanwhile.
    if (showTip) {
      setShowTip(false);
      void markRatingTipSeen();
    }
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
        tip={showTip}
        locale={locale}
        dialectName={dialectName}
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
  // Whether the one-time tip shows above the rating buttons once the card is turned over.
  tip: boolean;
  locale: Locale;
  dialectName?: string;
  // Whether more cards wait behind this one, shown as a stack.
  stacked: boolean;
  saving: boolean;
  saveError: string | null;
  onGrade: (grade: Grade) => void;
};

// A word. Keyed by the card's attempt, so each card starts face down.
function CardStage({
  card,
  front,
  autoplay,
  tip,
  locale,
  dialectName,
  stacked,
  saving,
  saveError,
  onGrade,
}: CardStageProps) {
  const t = dictionary(locale).session;
  const [revealed, setRevealed] = useState(false);
  const recording = useRecording(card.audio_url);
  // Whether the side showing is the Swiss German one: the front when it comes first, else the back.
  // Only that side has the speaker, so it goes when the card turns to the translation, and hearing
  // the word can't give the answer away.
  const swissGermanShowing = (front === "swiss_german") !== revealed;
  // Plays once per card, the first time its Swiss German shows, when the learner wants that.
  const played = useRef(false);
  const { play } = recording;
  useEffect(() => {
    if (!autoplay || !swissGermanShowing || played.current) return;
    played.current = true;
    play();
  }, [autoplay, swissGermanShowing, play]);

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

  const back = front === "swiss_german" ? "translation" : "swiss_german";

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
                <WordCardSide card={card} side={front} place="front" dialectName={dialectName} locale={locale} />
              </span>
              <span aria-hidden={!revealed} className={`${CARD_FACE} rotate-y-180`}>
                <WordCardSide card={card} side={back} place="back" dialectName={dialectName} locale={locale} />
              </span>
            </span>
          </button>

          {swissGermanShowing && <AudioButton recording={recording} hasAudio={!!card.audio_url} t={t} />}
        </div>
      </CardStack>

      <footer className="flex min-h-24 flex-col justify-end gap-3">
        {saveError && (
          <p aria-live="polite" className="text-sm text-danger">
            {t.notSaved(saveError)}
          </p>
        )}
        {/* Rises in as the card finishes turning over (0.5 s). */}
        {revealed && tip && <Tip title={t.ratingTip.title} text={t.ratingTip.text} delay={0.45} />}
        {revealed && <GradeButtons intervals={card.intervals} onGrade={onGrade} disabled={saving} t={t} />}
      </footer>
    </>
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
