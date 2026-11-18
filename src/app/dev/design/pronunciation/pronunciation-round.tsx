"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ExampleList } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/example-list";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { BottomSheet } from "@/app/ui/bottom-sheet";
import { Button } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { SoundBars } from "@/app/ui/sound-bars";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import type { Rule } from "@/lib/learn/lessons";

// Prototype of a pronunciation round on /dev/design/pronunciation, with placeholder words: spot
// the letters a Swiss reader says differently, say words yourself before hearing them, then
// repeat a sentence. Only the first part is scored. The words have no recordings yet, so their
// play buttons only show that they would play; the learner's own recordings play for real.

// A letter or a group of letters read as one sound, such as "st". rule is the rule that makes a
// Swiss reader say it differently, if one does.
type Tile = { text: string; rule?: string };

type Item =
  | { kind: "spot"; id: string; tiles: Tile[] }
  // help: the letters to watch are shown at once, behind a tip, or not at all.
  | { kind: "say"; id: string; tiles: Tile[]; help: "shown" | "tip" | "none" }
  | { kind: "repeat"; id: string; sentence: string };

const ROUND: Item[] = [
  {
    kind: "spot",
    id: "kasten",
    tiles: [{ text: "K", rule: "k-ck" }, { text: "a" }, { text: "st", rule: "st-sp" }, { text: "e" }, { text: "n" }],
  },
  { kind: "spot", id: "seife", tiles: [{ text: "S", rule: "s" }, { text: "ei" }, { text: "f" }, { text: "e" }] },
  { kind: "spot", id: "glas", tiles: [{ text: "G" }, { text: "l" }, { text: "a" }, { text: "s" }] },
  {
    kind: "say",
    id: "decke",
    help: "shown",
    tiles: [{ text: "D" }, { text: "e" }, { text: "ck", rule: "k-ck" }, { text: "e" }],
  },
  {
    kind: "say",
    id: "kiste",
    help: "tip",
    tiles: [{ text: "K", rule: "k-ck" }, { text: "i" }, { text: "st", rule: "st-sp" }, { text: "e" }],
  },
  { kind: "say", id: "puppe", help: "tip", tiles: [{ text: "P", rule: "t-p" }, { text: "u" }, { text: "pp" }, { text: "e" }] },
  {
    kind: "say",
    id: "rose",
    help: "none",
    tiles: [{ text: "R", rule: "r" }, { text: "o" }, { text: "s", rule: "s" }, { text: "e" }],
  },
  { kind: "repeat", id: "keller", sentence: "Die Kiste steht im Keller." },
];

const PARTS = {
  spot: { eyebrow: "Teil 1 von 3 · Hinschauen", task: "Tippe die Buchstaben an, die auf Berndeutsch anders klingen." },
  say: { eyebrow: "Teil 2 von 3 · Selber sagen", task: "Lies das Wort so, wie man es in Bern sagt. Dann hör es dir an." },
  repeat: { eyebrow: "Teil 3 von 3 · Im Satz", task: "Hör dir den Satz an und sprich ihn nach." },
};

const SAY_MS = 4000;
const SENTENCE_MS = 8000;
// How long a placeholder recording "plays".
const PLACEHOLDER_MS = 1200;
const SPOTS = ROUND.filter(({ kind }) => kind === "spot").length;
const SAYS = ROUND.filter(({ kind }) => kind === "say").length;

export function PronunciationRound({ rules }: { rules: Rule[] }) {
  const [index, setIndex] = useState(0);
  const [spotRight, setSpotRight] = useState(0);
  const [saidWell, setSaidWell] = useState(0);
  const [run, setRun] = useState(0);
  const done = index >= ROUND.length;
  const item = ROUND[index];

  function moveOn() {
    setIndex((value) => value + 1);
    window.scrollTo(0, 0);
  }

  return (
    <main lang="de" className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6">
      <title>Aussprache-Übungen – dev</title>
      <div className="sticky top-0 z-30 -mx-6 flex min-h-14 items-center gap-3 bg-ivory px-6 pt-[env(safe-area-inset-top)]">
        <Link href="/dev/design" aria-label="Verlassen" className="-ml-2 flex size-11 items-center justify-center">
          <Icon name="cross" />
        </Link>
        <div className="flex flex-1 gap-1">
          {ROUND.map(({ id }, position) => (
            <span key={id} className={`h-2 flex-1 rounded-full ${position < index ? "bg-teal" : "bg-mist"}`} />
          ))}
        </div>
        <span className="shrink-0 text-caption font-semibold text-teal-soft tabular-nums">
          {Math.min(index + 1, ROUND.length)} / {ROUND.length}
        </span>
      </div>

      {done ? (
        <Finished
          spotRight={spotRight}
          saidWell={saidWell}
          onAgain={() => {
            setIndex(0);
            setSpotRight(0);
            setSaidWell(0);
            setRun((value) => value + 1);
          }}
        />
      ) : (
        <div key={`${run}-${item.id}`} className="flex flex-1 flex-col">
          <div className="flex flex-col gap-1 pt-4">
            <Eyebrow>{PARTS[item.kind].eyebrow}</Eyebrow>
            <p className="text-body">{PARTS[item.kind].task}</p>
          </div>
          {item.kind === "spot" && (
            <Spot
              tiles={item.tiles}
              rules={rules}
              onDone={(right) => {
                if (right) setSpotRight((count) => count + 1);
                moveOn();
              }}
            />
          )}
          {item.kind === "say" && (
            <Say
              tiles={item.tiles}
              help={item.help}
              onDone={(well) => {
                if (well) setSaidWell((count) => count + 1);
                moveOn();
              }}
            />
          )}
          {item.kind === "repeat" && <Repeat sentence={item.sentence} onDone={moveOn} />}
        </div>
      )}
    </main>
  );
}

// Part 1: tap the letters that sound different, or none. After checking, the word plays in
// Standard German and then the Swiss way, and each changed letter links to its rule.
function Spot({ tiles, rules, onDone }: { tiles: Tile[]; rules: Rule[]; onDone: (right: boolean) => void }) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [openRule, setOpenRule] = useState<Rule | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const player = usePlayer();

  const changed = tiles.flatMap((tile, position) => (tile.rule ? [position] : []));
  const right = changed.length === tapped.length && changed.every((position) => tapped.includes(position));
  const changedRules = [...new Set(changed.map((position) => tiles[position].rule!))].map(
    (id) => rules.find((rule) => rule.id === id)!,
  );
  const clips = [
    { key: "de", url: null },
    { key: "be", url: null },
  ];

  function tileClass(position: number) {
    const isChanged = changed.includes(position);
    const isTapped = tapped.includes(position);
    if (!checked) return isTapped ? "bg-teal text-ivory" : "bg-mist";
    if (isChanged) return isTapped ? "bg-sage" : "bg-rose";
    if (isTapped) return "bg-rose line-through decoration-brick";
    return "text-teal-soft";
  }

  function check() {
    setChecked(true);
    player.play(clips);
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-8 pb-8">
        <div className="flex flex-wrap justify-center gap-1">
          {tiles.map((tile, position) => (
            <button
              key={position}
              type="button"
              disabled={checked}
              aria-pressed={tapped.includes(position)}
              onClick={() =>
                setTapped((current) =>
                  current.includes(position) ? current.filter((value) => value !== position) : [...current, position],
                )
              }
              className={`flex min-h-16 min-w-12 items-center justify-center rounded-3xl px-3 text-title font-bold transition-[background-color,transform] active:scale-95 disabled:active:scale-100 ${tileClass(position)}`}
            >
              {tile.text}
            </button>
          ))}
        </div>

        {checked && (
          <div aria-live="polite" className="flex flex-col gap-4">
            <p
              className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl px-6 text-body font-semibold ${answerClass(right)}`}
            >
              {right
                ? changed.length
                  ? "Richtig"
                  : "Richtig, hier klingt alles gleich"
                : changed.length
                  ? `Nicht ganz: ${changed.map((position) => tiles[position].text.toUpperCase()).join(" und ")} ${changed.length > 1 ? "klingen" : "klingt"} anders`
                  : "Nicht ganz: hier klingt alles gleich"}
              <AnswerMark correct={right} label={right ? "Richtig" : "Nicht ganz"} />
            </p>
            <Compare
              player={player}
              clips={[
                { key: "de", label: "Hochdeutsch", url: null },
                { key: "be", label: "Berndeutsch", url: null },
              ]}
            />
            {changedRules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {changedRules.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => {
                      setOpenRule(rule);
                      sheet.current?.showModal();
                    }}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
                  >
                    <Icon name="learn" size={16} />
                    Regel: {rule.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer>
        {checked ? (
          <Button onClick={() => onDone(right)}>Weiter</Button>
        ) : (
          <Button onClick={check}>{tapped.length ? "Prüfen" : "Klingt alles gleich"}</Button>
        )}
      </Footer>

      <BottomSheet ref={sheet} label={openRule?.title ?? "Regel"}>
        {openRule && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Eyebrow>Regel · Konsonanten</Eyebrow>
                <h2 className="text-title font-bold">{openRule.title}</h2>
              </div>
              <p className="text-body">{openRule.theory}</p>
            </div>
            <ExampleList examples={openRule.examples} dialectName="Berndeutsch" t={dictionary("de").lesson} />
            <Takeaway label="Merke">{openRule.takeaway}</Takeaway>
            <Button onClick={() => sheet.current?.close()}>Zurück zur Übung</Button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// Part 2: say the word first, then hear yourself and the recording back to back, and judge it.
// "Noch nicht" gives one more try, with the letters to watch shown.
function Say({ tiles, help, onDone }: { tiles: Tile[]; help: "shown" | "tip" | "none"; onDone: (well: boolean) => void }) {
  const [attempt, setAttempt] = useState(1);
  const [tip, setTip] = useState(false);
  const [stage, setStage] = useState<"ready" | "compare">("ready");
  const player = usePlayer();
  const recorder = useRecorder(SAY_MS);
  const watch = help === "shown" || tip || attempt > 1 || stage === "compare";

  function recorded(own: string | null) {
    setStage("compare");
    player.play(own ? [{ key: "own", url: own }, { key: "be", url: null }] : [{ key: "be", url: null }]);
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-8 pb-8">
        {/* One word, with the letters to watch underlined in sage. */}
        <p className="flex min-h-16 items-center justify-center text-title font-bold">
          {tiles.map((tile, position) => (
            <span
              key={position}
              className={watch && tile.rule ? "underline decoration-sage decoration-4 underline-offset-8" : ""}
            >
              {tile.text}
            </span>
          ))}
        </p>

        {stage === "ready" && help === "tip" && !tip && attempt === 1 && (
          <button
            type="button"
            onClick={() => setTip(true)}
            className="flex min-h-11 items-center gap-2 self-center rounded-full bg-mist px-4 text-caption font-semibold transition-transform active:scale-95"
          >
            <Icon name="bulb" size={16} />
            Tipp: worauf achten?
          </button>
        )}
        {stage === "ready" && attempt > 1 && (
          <p className="text-center text-caption text-teal-soft">Achte auf die markierten Buchstaben.</p>
        )}
        {recorder.state === "denied" && stage === "ready" && (
          <p className="text-center text-caption text-teal-soft">
            Ohne Mikrofon: sag das Wort laut, dann hör es dir an.
          </p>
        )}

        {stage === "compare" && (
          <div className="flex flex-col gap-4">
            <Compare
              player={player}
              clips={[
                ...(recorder.url ? [{ key: "own", label: "Du", url: recorder.url }] : []),
                { key: "be", label: "So klingt's", url: null },
              ]}
            />
            <p className="text-center text-subtitle font-semibold">Klang es gleich?</p>
          </div>
        )}
      </div>

      <Footer>
        {stage === "compare" ? (
          <>
            <Button onClick={() => onDone(true)}>Ja</Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (attempt > 1) return onDone(false);
                setAttempt(2);
                setStage("ready");
              }}
            >
              {attempt > 1 ? "Noch nicht, weiter" : "Noch nicht, nochmals"}
            </Button>
          </>
        ) : (
          <RecordButton recorder={recorder} maxMs={SAY_MS} onRecorded={recorded} />
        )}
      </Footer>
    </>
  );
}

// Part 3: hear the sentence, say it, then hear both. Not judged.
function Repeat({ sentence, onDone }: { sentence: string; onDone: () => void }) {
  const [stage, setStage] = useState<"listen" | "ready" | "compare">("listen");
  const player = usePlayer();
  const recorder = useRecorder(SENTENCE_MS);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-8 pb-8">
        <p className="text-center text-heading font-bold">{sentence}</p>
        {stage !== "listen" && (
          <Compare
            player={player}
            clips={[
              { key: "be", label: "So klingt's", url: null },
              ...(stage === "compare" && recorder.url ? [{ key: "own", label: "Du", url: recorder.url }] : []),
            ]}
          />
        )}
        {recorder.state === "denied" && stage === "ready" && (
          <p className="text-center text-caption text-teal-soft">Ohne Mikrofon: sprich den Satz laut nach.</p>
        )}
      </div>

      <Footer>
        {stage === "listen" && (
          <Button
            onClick={() => {
              setStage("ready");
              player.play([{ key: "be", url: null }]);
            }}
          >
            <Icon name="speaker" size={20} />
            Anhören
          </Button>
        )}
        {stage === "ready" && (
          <RecordButton
            recorder={recorder}
            maxMs={SENTENCE_MS}
            onRecorded={(own) => {
              setStage("compare");
              player.play(own ? [{ key: "own", url: own }, { key: "be", url: null }] : [{ key: "be", url: null }]);
            }}
          />
        )}
        {stage === "compare" && (
          <>
            <Button onClick={onDone}>Weiter</Button>
            <Button variant="secondary" onClick={() => setStage("ready")}>
              Nochmals aufnehmen
            </Button>
          </>
        )}
      </Footer>
    </>
  );
}

function Finished({ spotRight, saidWell, onAgain }: { spotRight: number; saidWell: number; onAgain: () => void }) {
  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-6 pt-4 pb-8">
        <div className="flex flex-col gap-2 rounded-3xl bg-yellow p-6">
          <Icon name="check" size={32} />
          <h1 className="text-heading font-bold">Konsonanten geübt</h1>
          <p className="text-body">
            {spotRight} von {SPOTS} richtig erkannt
          </p>
        </div>
        <p className="flex items-center gap-3 text-body">
          <Icon name="mic" className="shrink-0 text-teal-soft" />
          {saidWell} von {SAYS} Wörtern sicher gesagt
        </p>
      </div>
      <Footer>
        <Button onClick={onAgain}>Nochmals</Button>
      </Footer>
    </>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <footer className="sticky bottom-0 -mx-6 flex flex-col gap-3 bg-ivory px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </footer>
  );
}

// The recordings to compare, each a round play button with its name, playing again on tap.
function Compare({
  player,
  clips,
}: {
  player: ReturnType<typeof usePlayer>;
  clips: { key: string; label: string; url: string | null }[];
}) {
  return (
    <div className="flex justify-center gap-8">
      {clips.map((clip) => {
        const playing = player.playing === clip.key;
        return (
          <button
            key={clip.key}
            type="button"
            onClick={() => player.play([clip])}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`flex size-14 items-center justify-center rounded-full transition-[background-color,color,transform] active:scale-90 ${
                playing ? "bg-teal text-ivory" : "bg-mist text-teal"
              }`}
            >
              {playing ? <SoundBars /> : <Icon name={clip.key === "own" ? "mic" : "speaker"} size={24} />}
            </span>
            <span className="text-caption font-semibold">{clip.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Records with the microphone, up to maxMs, with a bar filling up meanwhile. Without a
// microphone, or when it's not allowed, it moves on without a recording.
function RecordButton({
  recorder,
  maxMs,
  onRecorded,
}: {
  recorder: ReturnType<typeof useRecorder>;
  maxMs: number;
  onRecorded: (url: string | null) => void;
}) {
  if (recorder.state === "denied") {
    return (
      <Button onClick={() => onRecorded(null)}>
        <Icon name="speaker" size={20} />
        Gesagt, anhören
      </Button>
    );
  }
  if (recorder.state === "recording") {
    return (
      <div className="flex flex-col gap-3">
        <RecordingBar ms={maxMs} />
        <Button onClick={recorder.stop}>Fertig</Button>
      </div>
    );
  }
  return (
    <Button onClick={() => recorder.start(onRecorded)}>
      <Icon name="mic" size={20} />
      Aufnehmen
    </Button>
  );
}

function RecordingBar({ ms }: { ms: number }) {
  const fill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const animation = fill.current?.animate([{ width: "0%" }, { width: "100%" }], { duration: ms, easing: "linear", fill: "forwards" });
    return () => animation?.cancel();
  }, [ms]);
  return (
    <span aria-label="Nimmt auf" role="status" className="flex h-2 overflow-hidden rounded-full bg-mist">
      <span ref={fill} className="h-full bg-teal" />
    </span>
  );
}

type Clip = { key: string; url: string | null };

// Plays clips one after the other, and which one is playing. A clip without a recording yet only
// pretends to play for a moment.
function usePlayer() {
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
        setPlaying(clip.key);
        const then = () => {
          setPlaying(null);
          timer.current = window.setTimeout(() => next(after), 300);
        };
        if (!clip.url) {
          timer.current = window.setTimeout(then, PLACEHOLDER_MS);
          return;
        }
        const element = new Audio(clip.url);
        audio.current = element;
        element.onended = then;
        element.play().catch(then);
      };
      next(queue);
    },
    [stop],
  );

  return { playing, play };
}

// Records from the microphone into a recording that can be played back, stopping by itself after
// maxMs. "denied" when there's no microphone or the learner didn't allow it.
function useRecorder(maxMs: number) {
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
