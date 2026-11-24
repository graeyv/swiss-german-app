import { ListRow, ListRows } from "@/app/ui/list-row";
import type { Dictionary } from "@/lib/i18n";
import { type DialectLesson, MIXED, mixedSection, roundExercises, type Section } from "@/lib/learn/lessons";
import { isReadThrough, readCount } from "@/lib/learn/progress";
import { type Rounds, roundOf } from "@/lib/learn/suggestion";

// A module's exercise sets, one per lesson and a mixed one at the end, each saying how it went
// last or how much of its lesson is read. In the Practice tab and in the module in Learn, which
// lead to the sets their own way.
export function ExerciseSets({
  entry,
  read,
  rounds,
  href,
  t,
}: {
  entry: DialectLesson;
  read: Set<string>;
  rounds: Rounds;
  href: (section: Section) => string;
  t: Dictionary;
}) {
  const { lesson } = entry;
  return (
    <ListRows>
      {[...lesson.sections, ...[mixedSection(lesson)].filter((section) => section !== undefined)].map((section) => {
        // A lesson without exercises yet shows what's coming, but doesn't open.
        if (roundExercises(section).length === 0) {
          return <ListRow key={section.id} title={section.title} comingSoon={t.lesson.comingSoon} />;
        }
        const round = roundOf(rounds, { entry, section });
        const count = readCount(entry, section, read);
        const caption = round
          ? t.practice.practisedScore(t.practice.ago(round.daysAgo), round.correct, round.total)
          : isReadThrough(entry, section, read)
            ? t.practice.readNotPractised
            : section.id === MIXED
              ? t.practice.mixedAfter
              : count > 0
                ? t.learn.topicsRead(count, section.rules.length)
                : t.practice.notRead(section.rules.length);
        return <ListRow key={section.id} href={href(section)} title={section.title} caption={caption} />;
      })}
    </ListRows>
  );
}
