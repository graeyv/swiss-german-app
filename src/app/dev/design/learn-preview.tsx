import Link from "next/link";
import { ButtonLink } from "@/app/ui/button";
import { Icon, isIconName } from "@/app/ui/icon";
import { LESSONS, lessonHref, lessonNumber, topicCount } from "@/lib/learn/lessons";

// The Learn tab once every lesson has content and progress is saved, for a learner who has
// finished Aussprache and is in the middle of Verwandte Wörter. Progress isn't saved yet, so it's
// made up here.
const DONE: Record<string, number> = { pronunciation: Infinity, "related-words": 5 };

export function LearnPreviewComplete() {
  const lessons = LESSONS.filter(({ dialect }) => dialect === "be").map((entry) => {
    const topics = topicCount(entry.lesson);
    const done = Math.min(DONE[entry.lesson.id] ?? 0, topics);
    return { ...entry, number: lessonNumber(entry), topics, done };
  });
  const current = lessons.find(({ topics, done }) => done < topics)!;

  return (
    <div className="flex flex-col gap-8 rounded-3xl border border-mist p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-title font-bold">Lernen</h3>
        <p className="text-body text-teal-soft">Was im Berndeutschen anders ist.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
        {isIconName(current.lesson.icon) && <Icon name={current.lesson.icon} size={28} />}
        <div className="flex flex-col gap-1">
          <p className="text-caption font-semibold tracking-[0.08em] uppercase">
            Modul {current.number}
          </p>
          <p className="text-heading font-bold">{current.lesson.title}</p>
          <p className="text-body">{current.lesson.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-ivory">
            <div className="h-full rounded-full bg-teal" style={{ width: `${(current.done / current.topics) * 100}%` }} />
          </div>
          <p className="text-caption">
            {current.done} von {current.topics} Themen
          </p>
        </div>
        <ButtonLink href={lessonHref(current.dialect, current.lesson)}>Weiter</ButtonLink>
      </div>

      <section className="flex flex-col gap-4">
        <h4 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
          Alle Module
        </h4>
        <ul className="flex flex-col gap-3">
          {lessons.map((entry) => {
            const finished = entry.done >= entry.topics;
            return (
              <li key={entry.lesson.id}>
                <Link
                  href={lessonHref(entry.dialect, entry.lesson)}
                  className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4 transition-transform active:scale-[0.98]"
                >
                  {isIconName(entry.lesson.icon) && <Icon name={entry.lesson.icon} size={28} />}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">
                      Modul {entry.number}
                    </span>
                    <span className="text-body font-bold">{entry.lesson.title}</span>
                    <span className="text-caption text-teal-soft">
                      {finished
                        ? "Abgeschlossen"
                        : entry.done > 0
                          ? `${entry.done} von ${entry.topics} Themen`
                          : `${entry.lesson.sections.length} Teile · ${entry.topics} Themen`}
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
      </section>
    </div>
  );
}
