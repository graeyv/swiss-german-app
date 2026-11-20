import { Takeaway } from "@/app/ui/takeaway";
import type { Dictionary } from "@/lib/i18n";
import type { Phrase, PointList, Rule } from "@/lib/learn/lessons";
import { ExampleList } from "./example-list";
import { ListenButton } from "./listen-button";

type RuleBodyProps = {
  rule: Rule;
  dialectName: string;
  // The dialect's accent, when the examples are Standard German words said with it.
  accent?: string;
  t: Dictionary["lesson"];
};

// What follows a topic's theory, each part only when the topic has it: its lists, its phrases,
// its words to compare by their sound, a note on them, then what to remember. See DESIGN.md.
export function RuleBody({ rule, dialectName, accent, t }: RuleBodyProps) {
  return (
    <>
      {rule.points?.map((list, index) => <Points key={index} list={list} />)}
      {rule.phrases && rule.phrases.length > 0 && (
        <section className="flex flex-col gap-3">
          {rule.phrasesHeading && <h2 className="text-body font-bold">{rule.phrasesHeading}</h2>}
          <Phrases phrases={rule.phrases} t={t} />
        </section>
      )}
      {rule.examples.length > 0 && (
        <ExampleList examples={rule.examples} dialectName={dialectName} accent={accent} t={t} />
      )}
      {rule.note && <p className="text-caption text-teal-soft">{rule.note}</p>}
      {rule.takeaway && <Takeaway label={t.remember}>{rule.takeaway}</Takeaway>}
    </>
  );
}

// A topic's text, one paragraph per part separated by an empty line.
export function Theory({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index} className="text-body">
      {paragraph}
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
// a play button when it has a recording to come or one.
function Phrases({ phrases, t }: { phrases: Phrase[]; t: Dictionary["lesson"] }) {
  return (
    <ul className="flex flex-col gap-6">
      {phrases.map((phrase) => (
        <li key={phrase.dialect} className="flex items-center gap-3">
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
          {phrase.audio !== undefined && (
            <ListenButton url={phrase.audio} label={`${t.listen}: ${phrase.dialect}`} noRecordingLabel={t.noRecording} />
          )}
        </li>
      ))}
    </ul>
  );
}
