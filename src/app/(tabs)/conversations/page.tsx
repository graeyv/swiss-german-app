import Link from "next/link";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { textIn, TOPICS } from "@/lib/conversations";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { TINTS } from "../flashcards/deck-card";

// Swiss German conversations as they're heard in everyday situations, grouped by topic. Each
// situation is a card, like the flashcard decks, that opens its dialogue. Every learner sees every
// conversation for now, whatever their dialect.
export default function ConversationsPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Conversations />
    </Suspense>
  );
}

async function Conversations() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <>
      <title>{t.title(t.nav.conversations)}</title>
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.conversations}</h1>

      {TOPICS.map((topic) => (
        <section key={topic.id} aria-labelledby={`topic-${topic.id}`} className="flex flex-col gap-3">
          <h2 id={`topic-${topic.id}`} className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span aria-hidden>{topic.emoji}</span>
            {textIn(topic.title, locale)}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {topic.situations.map((situation) => (
              <li key={situation.id} className="flex">
                <Link
                  href={`/conversations/${situation.id}`}
                  className={`flex flex-1 flex-col gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] ${TINTS[topic.color]}`}
                >
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-xl bg-surface/70 text-2xl"
                  >
                    {situation.emoji}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <strong className="leading-snug font-semibold">
                      {textIn(situation.title, locale)} <span aria-hidden className="text-muted">›</span>
                    </strong>
                    <small className="text-sm text-muted">{t.conversations.lines(situation.lines.length)}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
