"use client";

import Link from "next/link";
import { useState } from "react";
import { ComingSoonPill } from "@/app/ui/coming-soon-pill";
import { Icon } from "@/app/ui/icons";

export type LessonListItem = {
  id: string;
  title: string;
  // Such as "2 von 6 Themen gelesen".
  caption: string;
  // Empty for a lesson still being written. A topic still being written has no href: it shows,
  // inactive, with the "Bald verfügbar" pill.
  topics: { title: string; href?: string; read: boolean; next: boolean }[];
};

type LessonListProps = {
  lessons: LessonListItem[];
  // The lesson unfolded at first: the one the learner is reading in.
  open?: string;
  comingSoon: string;
};

// A module's lessons, each a card on mist that unfolds its topics, so the page stays short however
// many topics there are. Several can be open. See DESIGN.md.
export function LessonList({ lessons, open, comingSoon }: LessonListProps) {
  const [unfolded, setUnfolded] = useState(() => new Set(open ? [open] : []));

  function toggle(id: string) {
    setUnfolded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {lessons.map((lesson) => {
        if (lesson.topics.length === 0) {
          return (
            <li key={lesson.id} className="flex min-h-18 flex-col justify-center gap-0.5 rounded-3xl bg-mist px-6 py-4">
              <span className="text-body font-bold text-teal-soft">{lesson.title}</span>
              <ComingSoonPill label={comingSoon} />
            </li>
          );
        }
        const isOpen = unfolded.has(lesson.id);
        return (
          <li key={lesson.id} className="rounded-3xl bg-mist">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`topics-${lesson.id}`}
              onClick={() => toggle(lesson.id)}
              className="flex min-h-18 w-full items-center gap-4 rounded-3xl px-6 py-4 text-left transition-transform active:scale-[0.98]"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-bold">{lesson.title}</span>
                <span className="text-caption text-teal-soft">{lesson.caption}</span>
              </span>
              <Icon
                name="down"
                className={`transition-transform motion-reduce:transition-none ${isOpen ? "" : "-rotate-90"}`}
              />
            </button>
            {isOpen && (
              // In order, numbered: read ones teal with a check, the next one sage, the rest ivory.
              <ol id={`topics-${lesson.id}`} className="flex flex-col pb-3">
                {lesson.topics.map((topic, index) =>
                  topic.href ? (
                    <li key={topic.title}>
                      <Link
                        href={topic.href}
                        className="flex min-h-13 items-center gap-4 px-6 transition-transform active:scale-[0.98]"
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-bold ${
                            topic.read ? "bg-teal text-ivory" : topic.next ? "bg-sage" : "bg-ivory"
                          }`}
                        >
                          {topic.read ? <Icon name="check" size={16} /> : index + 1}
                        </span>
                        <span className="flex-1 text-body font-semibold">{topic.title}</span>
                        <Icon name="forward" size={20} />
                      </Link>
                    </li>
                  ) : (
                    // Still being written: its number and title in teal-soft, the pill instead of the arrow.
                    <li key={topic.title} className="flex min-h-13 items-center gap-4 px-6">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ivory text-caption font-bold text-teal-soft">
                        {index + 1}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-body font-semibold text-teal-soft">{topic.title}</span>
                        <ComingSoonPill label={comingSoon} />
                      </span>
                    </li>
                  ),
                )}
              </ol>
            )}
          </li>
        );
      })}
    </ul>
  );
}
