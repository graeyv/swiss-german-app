import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
import {
  exercisesListHref,
  findLesson,
  findPracticeUnit,
  lessonHref,
  MIXED,
  mixedSection,
  nextSection,
  practiceHref,
  practiceParams,
  practiceUnits,
  roundExercises,
  sectionPath,
} from "@/lib/learn/lessons";
import { LessonLoading } from "../../lesson-screen";
import { PracticeRound } from "./practice-round";

export function generateStaticParams() {
  return practiceParams();
}

// A round of a section's exercises, such as the consonants, or of a module's mixed round: from the
// end of a section's last topic in Learn (?from=learn), or from the Practice tab. Where it was
// started decides where it leads afterwards.
export default function PracticePage({
  params,
  searchParams,
}: PageProps<"/learn/[dialect]/[lesson]/[section]/practice">) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <Practice params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Practice({
  params,
  searchParams,
}: Pick<PageProps<"/learn/[dialect]/[lesson]/[section]/practice">, "params" | "searchParams">) {
  const [{ dialect, lesson: lessonId, section: sectionId }, { from }] = await Promise.all([params, searchParams]);
  const found = findLesson(dialect, lessonId);
  const section = found && findPracticeUnit(found.lesson, sectionId);
  const round = section ? roundExercises(section) : [];
  if (!found || !section || round.length === 0) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);
  const fromLearn = from === "learn";
  const mixed = section.id === MIXED;
  // After a section, from Learn: the next section to read, or after the last one the mixed round.
  const nextToRead = mixed ? undefined : nextSection(lesson, section);
  const mixedRound = mixedSection(lesson);
  const next = nextToRead
    ? { href: lessonHref(dialect, lesson, nextToRead, nextToRead.rules[0]), title: nextToRead.title }
    : !mixed && mixedRound
      ? { href: `${practiceHref(dialect, lesson, mixedRound)}?from=learn`, title: mixedRound.title }
      : undefined;
  // Every rule of the module, this section's first, for the rules the exercises lead to.
  const rules = [section, ...lesson.sections.filter((each) => each.id !== section.id)].flatMap((each) =>
    each.rules.map((rule) => ({ rule, section: each.title })),
  );

  return (
    <>
      <title>{t.title(t.practice.done(section.title))}</title>
      <PracticeRound
        lang={language}
        dialectName={t.lesson.dialects[dialect] ?? dialect}
        path={sectionPath(dialect, lesson.id, section.id)}
        sectionTitle={section.title}
        rules={rules}
        round={round}
        // Leaving or finishing goes back where the round was started: the module in Learn, or
        // the module's rounds in the Practice tab, or Lektionen if it has only one.
        back={
          fromLearn
            ? lessonHref(dialect, lesson)
            : practiceUnits(lesson).length === 1
              ? "/flashcards/lessons"
              : exercisesListHref(dialect, lesson)
        }
        // The mixed round covers the whole module, so reading again starts at its page.
        readAgain={mixed ? lessonHref(dialect, lesson) : lessonHref(dialect, lesson, section, section.rules[0])}
        // From Learn, a good round leads on.
        next={fromLearn ? next : undefined}
      />
    </>
  );
}
