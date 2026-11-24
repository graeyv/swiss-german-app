import { MarkedWord } from "@/app/exercises/pronunciation/parts";
import { withAppName } from "@/app/ui/app-name";
import { Takeaway } from "@/app/ui/takeaway";
import type { Dictionary } from "@/lib/i18n";
import type { Phrase, PointList, Rule } from "@/lib/learn/lessons";
import { ExampleList } from "./example-list";
import { ListenButton } from "./listen-button";
import { Sounds } from "./sound-list";

type RuleBodyProps = {
  rule: Rule;
  dialectName: string;
  // The dialect's accent, when the examples are Standard German words said with it.
  accent?: string;
  t: Dictionary["lesson"];
};

// What follows a topic's theory, each part only when the topic has it: its lists, its phrases,
// its words to compare by their sound, its letters and their words, a note on them, then what to
// remember and a tip. See DESIGN.md.
export function RuleBody({ rule, dialectName, accent, t }: RuleBodyProps) {
  return (
    <>
      {rule.points?.map((list, index) => <Points key={index} list={list} />)}
      {rule.phrases && rule.phrases.length > 0 && (
        <section className="flex flex-col gap-3">
          {rule.phrasesHeading && <h2 className="text-body font-bold">{rule.phrasesHeading}</h2>}
          <Phrases phrases={rule.phrases} dialectName={dialectName} t={t} />
        </section>
      )}
      {rule.examples.length > 0 && (
        <ExampleList examples={rule.examples} dialectName={dialectName} accent={accent} t={t} />
      )}
      {rule.sounds && rule.sounds.length > 0 && <Sounds sounds={rule.sounds} t={t} />}
      {rule.note && <p className="text-caption text-teal-soft">{rule.note}</p>}
      {rule.takeaway && <Takeaway label={t.remember}>{withAppName(rule.takeaway)}</Takeaway>}
      {rule.tip && (
        <Takeaway label={t.tip}>
          <MarkedWord word={rule.tip} small />
        </Takeaway>
      )}
    </>
  );
}

// A topic's text, one paragraph per part separated by an empty line, its bracketed letters
// underlined in sage, such as the y in "[y]es".
export function Theory({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index} className="text-body">
      <MarkedWord word={paragraph} small />
    </p>
  ));
}

// A list with its heading: plain points with a small dot, or terms in bold with what they are
// below, each on a row on mist, such as the four building blocks.
function Points({ list }: { list: PointList }) {
  return (
    <section className="flex flex-col gap-3">
      {list.heading && <h2 className="text-body font-bold">{list.heading}</h2>}
      <ul className="flex flex-col gap-3">
        {list.items.map((item, index) =>
          typeof item === "string" ? (
            <li key={index} className="flex gap-3 text-body">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-teal-soft" />
              {item}
            </li>
          ) : (
            // A row on mist, so terms stand apart from the list's heading.
            <li key={index} className="flex flex-col gap-0.5 rounded-3xl bg-mist px-6 py-4">
              <span className="text-body font-bold">{item.term}</span>
              <span className="text-caption text-teal-soft">{item.text}</span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

// Phrases in the dialect, each with what it means and, if given, how Standard German says it, and
// a play button when it has a recording to come or one. When the phrases have the Standard German
// recorded too, they compare like a rule's examples: a button for each side, the dialect first,
// the sides named once above them. Each column is as wide as its name, kept on one line, so the
// buttons line up under it.
function Phrases({ phrases, dialectName, t }: { phrases: Phrase[]; dialectName: string; t: Dictionary["lesson"] }) {
  const compare = phrases.some((phrase) => phrase.standardGermanAudio !== undefined);
  return (
    <ul
      className={
        compare
          ? "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-6"
          : "flex flex-col gap-6"
      }
    >
      {compare && (
        <li aria-hidden className="contents text-xs font-semibold whitespace-nowrap text-teal-soft">
          <span />
          <span className="-mb-3 text-center">{dialectName}</span>
          <span className="-mb-3 text-center">{t.standardGerman}</span>
        </li>
      )}
      {/* The same phrase can appear twice, said in two regions. */}
      {phrases.map((phrase, index) => (
        <li key={`${index}-${phrase.dialect}`} className={compare ? "contents" : "flex items-center gap-3"}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p lang="gsw" className="text-subtitle font-bold break-words">
              {phrase.dialect}
            </p>
            <p className="text-caption text-teal-soft">{phrase.meaning}</p>
            {phrase.standardGerman && (
              <p className="text-caption text-teal-soft">
                {t.standardGerman}: <span lang="de">{phrase.standardGerman}</span>
              </p>
            )}
          </div>
          {compare ? (
            <>
              {/* Each keeps its place when it has no recording, so the buttons line up. */}
              <span className="flex justify-center">
                {phrase.audio !== undefined && (
                  <ListenButton
                    url={phrase.audio}
                    label={`${t.play(dialectName)}: ${phrase.dialect}`}
                    noRecordingLabel={t.noRecording}
                  />
                )}
              </span>
              <span className="flex justify-center">
                {phrase.standardGerman && phrase.standardGermanAudio !== undefined && (
                  <ListenButton
                    url={phrase.standardGermanAudio}
                    label={`${t.play(t.standardGerman)}: ${phrase.standardGerman}`}
                    noRecordingLabel={t.noRecording}
                  />
                )}
              </span>
            </>
          ) : (
            phrase.audio !== undefined && (
              <ListenButton url={phrase.audio} label={`${t.listen}: ${phrase.dialect}`} noRecordingLabel={t.noRecording} />
            )
          )}
        </li>
      ))}
    </ul>
  );
}
