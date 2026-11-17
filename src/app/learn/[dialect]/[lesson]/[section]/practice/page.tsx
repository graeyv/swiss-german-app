import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dictionary } from "@/lib/i18n";
import {
  exercisesHref,
  findLesson,
  findSection,
  lessonHref,
  nextSection,
  roundExercises,
  sectionParams,
  sectionPath,
} from "@/lib/learn/lessons";
import { LessonLoading } from "../../lesson-screen";
import { PracticeRound } from "./practice-round";

export function generateStaticParams() {
  return sectionParams();
}

// A round of a section's exercises, such as the consonants: from the end of its last topic in
// Learn (?from=learn), or from the Practice tab. Where it was started decides where it leads
// afterwards.
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
  const section = found && findSection(found.lesson, sectionId);
  const round = section ? roundExercises(section) : [];
  if (!found || !section || round.length === 0) notFound();
  const { lesson, language } = found;
  const t = dictionary(language);
  const fromLearn = from === "learn";
  const next = nextSection(lesson, section);

  return (
    <>
      <title>{t.title(t.practice.done(section.title))}</title>
      <PracticeRound
        lang={language}
        dialectName={t.lesson.dialects[dialect] ?? dialect}
        path={sectionPath(dialect, lesson.id, section.id)}
        sectionTitle={section.title}
        rules={section.rules}
        round={round}
        // Leaving or finishing goes back where the round was started: the section in Learn, or
        // the module's exercises in the Practice tab.
        back={fromLearn ? lessonHref(dialect, lesson, section) : exercisesHref(dialect, lesson)}
        readAgain={lessonHref(dialect, lesson, section)}
        // From Learn, a good round leads on to the next section.
        next={
          fromLearn && next ? { href: lessonHref(dialect, lesson, next, next.rules[0]), title: next.title } : undefined
        }
      />
    </>
  );
}
