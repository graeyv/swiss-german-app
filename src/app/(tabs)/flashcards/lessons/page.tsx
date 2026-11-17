import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { type Dictionary, dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { exercisesHref, hasExercises, LESSONS, lessonHref, practiceHref } from "@/lib/learn/lessons";
import { getReads, readCount } from "@/lib/learn/progress";
import { getRounds, practiceSections, roundOf, type Suggestion, suggest } from "@/lib/learn/suggestion";
import { createClient } from "@/lib/supabase/server";
import { PracticeSwitch } from "../practice-switch";

// The Practice tab's second view: the lessons' exercises. One suggestion at the top, then every
// module, to practise its lessons whenever the learner likes. There's no schedule.
export default function LessonExercisesPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <LessonExercises />
    </Suspense>
  );
}

async function LessonExercises() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);
  const [reads, rounds] = await Promise.all([getReads(supabase), getRounds(supabase, new Date())]);
  const suggestion = suggest(reads, rounds);
  const sections = practiceSections();

  return (
    <>
      <title>{t.title(t.practice.views.lessons)}</title>
      <h1 className="sr-only">{t.flashcards.title}</h1>
      <PracticeSwitch view="lessons" locale={locale} />

      {suggestion && <SuggestionCard suggestion={suggestion} reads={reads.read} t={t} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{t.practice.allExercises}</h2>
        <ListRows>
          {LESSONS.map((entry) => {
            const icon = isIconName(entry.lesson.icon) ? entry.lesson.icon : undefined;
            const key = `${entry.dialect}/${entry.lesson.id}`;
            if (!hasExercises(entry.lesson)) {
              return <ListRow key={key} icon={icon} title={entry.lesson.title} comingSoon={t.lesson.comingSoon} />;
            }
            const own = sections.filter((item) => item.entry === entry);
            const practised = own.filter((item) => roundOf(rounds, item)).length;
            return (
              <ListRow
                key={key}
                href={exercisesHref(entry.dialect, entry.lesson)}
                icon={icon}
                title={entry.lesson.title}
                caption={t.practice.sectionsPractised(practised, own.length)}
              />
            );
          })}
        </ListRows>
      </section>
    </>
  );
}

// The one thing suggested, as the Learn tab's card: why in the eyebrow, what in the title, one
// short line, and one button. Everything done is a quiet card on mist without a button.
function SuggestionCard({ suggestion, reads, t }: { suggestion: Suggestion; reads: Set<string>; t: Dictionary }) {
  if (suggestion.kind === "done") {
    return (
      <p className="flex items-center gap-2 rounded-3xl bg-mist p-6 text-heading font-bold">
        <Icon name="check" size={24} />
        {t.practice.allDone}
      </p>
    );
  }

  let eyebrow: string, title: string, caption: string, action: string, href: string;
  if (suggestion.kind === "read") {
    const { entry, section, rule } = suggestion.next;
    eyebrow = suggestion.practised ? t.practice.allPractised : t.practice.readFirst;
    title = t.practice.readOn(section.title);
    caption = t.practice.left(section.rules.length - readCount(entry, section, reads));
    action = `${t.lesson.next}: ${rule.title}`;
    href = lessonHref(entry.dialect, entry.lesson, section, rule);
  } else {
    const { entry, section } = suggestion;
    eyebrow = t.practice.next(entry.lesson.title);
    href = practiceHref(entry.dialect, entry.lesson, section);
    action = t.practice.start;
    if (suggestion.kind === "practise") {
      title = t.practice.practiseSection(section.title);
      caption = t.practice.allRead(section.rules.length);
    } else {
      const { daysAgo, correct, total } = suggestion.round;
      title = t.practice.refresh(section.title);
      caption = t.practice.lastRound(t.practice.ago(daysAgo), correct, total);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
      <span className="flex flex-col gap-1">
        {/* Teal rather than the softer teal of eyebrows, which is too faint on sage. */}
        <span className="text-caption font-semibold tracking-[0.08em] uppercase">{eyebrow}</span>
        <span className="text-heading font-bold">{title}</span>
        <span className="text-body">{caption}</span>
      </span>
      <ButtonLink href={href}>{action}</ButtonLink>
    </div>
  );
}
