import Link from "next/link";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icons";
import { LESSONS, lessonHref, lessonNumber, topicCount } from "@/lib/learn/lessons";

// Made-up progress, as saving it is still to come: Aussprache finished, Verwandte Wörter at 5 of
// its 14 topics.
const DONE: Record<string, number> = { pronunciation: Infinity, "related-words": 5 };

// The Learn tab once progress is saved: the module in progress is expanded in place, with its
// progress bar, and finished modules carry a check.
export function LearnPathWithProgress() {
  const lessons = LESSONS.filter(({ dialect }) => dialect === "be").map((entry) => {
    const topics = topicCount(entry.lesson);
    return { ...entry, number: lessonNumber(entry), topics, done: Math.min(DONE[entry.lesson.id] ?? 0, topics) };
  });
  const current = lessons.find(({ topics, done }) => done < topics)!;

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-mist p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-title font-bold">Lernen</h3>
        <p className="text-subtitle font-semibold">Was Schweizerdeutsch vom Hochdeutschen unterscheidet.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {lessons.map((entry) => {
          const { lesson } = entry;
          const icon = isIconName(lesson.icon) ? lesson.icon : undefined;
          const finished = entry.topics > 0 && entry.done >= entry.topics;

          if (entry === current) {
            return (
              <li key={lesson.id} className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
                <Link href={lessonHref(entry.dialect, lesson)} className="flex flex-col gap-4">
                  {icon && <Icon name={icon} size={28} />}
                  <span className="flex flex-col gap-1">
                    <span className="text-caption font-semibold tracking-[0.08em] uppercase">Modul {entry.number}</span>
                    <span className="text-heading font-bold">{lesson.title}</span>
                    <span className="text-body">{lesson.subtitle}</span>
                  </span>
                </Link>
                <div className="flex flex-col gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-ivory">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${(entry.done / entry.topics) * 100}%` }} />
                  </div>
                  <p className="text-caption">
                    {entry.done} von {entry.topics} Themen
                  </p>
                </div>
                <ButtonLink href={lessonHref(entry.dialect, lesson)}>Weiter</ButtonLink>
              </li>
            );
          }

          return (
            <li key={lesson.id}>
              <Link
                href={lessonHref(entry.dialect, lesson)}
                className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4 transition-transform active:scale-[0.98]"
              >
                {icon && <Icon name={icon} size={28} className="text-teal-soft" />}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
                    Modul {entry.number}
                  </span>
                  <span className="text-body font-bold">{lesson.title}</span>
                  <span className="text-caption text-teal-soft">
                    {finished
                      ? "Abgeschlossen"
                      : `${lesson.sections.length} Lektionen${entry.topics > 0 ? ` · ${entry.topics} Themen` : ""}`}
                  </span>
                </span>
                {finished ? (
                  <span className="flex size-8 items-center justify-center rounded-full bg-sage">
                    <Icon name="check" />
                  </span>
                ) : (
                  <Icon name="forward" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
