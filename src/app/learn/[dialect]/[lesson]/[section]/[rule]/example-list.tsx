import type { Dictionary } from "@/lib/i18n";
import type { Example } from "@/lib/learn/lessons";
import { ListenButton } from "./listen-button";

type ExampleListProps = {
  examples: Example[];
  // The dialect's name, such as "Berndeutsch".
  dialectName: string;
  // The dialect's accent, such as "Berner", when the examples are Standard German words said with
  // it. Their side is then "Berner Akzent" rather than "Berndeutsch".
  accent?: string;
  t: Dictionary["lesson"];
};

// A rule's examples, as a quiet list: each word with one line on what happens to its sound, and a
// play button for each side. The sides are named once, above their buttons. No colour and no
// lines: space separates the words, so the rule and its takeaway stay what stands out.
export function ExampleList({ examples, dialectName, accent, t }: ExampleListProps) {
  const side = accent ? t.accentName(accent) : dialectName;
  const play = accent ? t.playAccent(accent) : t.play(dialectName);
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden className="flex justify-end gap-3 text-xs font-semibold text-teal-soft">
        <span className="w-20 text-center">{t.standardGerman}</span>
        <span className="w-20 text-center">{side}</span>
      </div>
      <ul className="flex flex-col gap-6">
        {examples.map((example) => (
          <li key={example.word} className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-subtitle font-bold break-words">{example.word}</p>
              <SoundLine example={example} dialectName={dialectName} t={t} />
            </div>
            {/* The Standard German button keeps its place when there's none, so the dialect
                buttons line up. */}
            <span className="flex w-20 justify-center">
              {example.pronunciation.standardGerman !== null && (
                <ListenButton
                  url={example.audio.standardGerman}
                  label={`${t.play(t.standardGerman)}: ${example.word}`}
                  noRecordingLabel={t.noRecording}
                />
              )}
            </span>
            <span className="flex w-20 justify-center">
              <ListenButton
                url={example.audio.dialect}
                label={`${play}: ${example.word}`}
                noRecordingLabel={t.noRecording}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// What happens to the sound: "Ich-Laut → Ach-Laut", "Ach-Laut → gleich", or "Kurzes Ü, nur
// Berndeutsch" for a word Standard German doesn't have. Only a changed sound is bold.
function SoundLine({ example, dialectName, t }: Pick<ExampleListProps, "dialectName" | "t"> & { example: Example }) {
  const { standardGerman, dialect } = example.pronunciation;
  return (
    <p className="text-caption text-teal-soft">
      {standardGerman === null ? (
        `${dialect}, ${t.onlyIn(dialectName)}`
      ) : standardGerman === dialect ? (
        <>
          {dialect} <span aria-hidden>→</span> {t.same}
        </>
      ) : (
        <>
          {standardGerman} <span aria-hidden>→</span>
          <span className="sr-only">{t.becomes}</span>{" "}
          <span className="font-bold text-teal">{dialect}</span>
        </>
      )}
    </p>
  );
}
