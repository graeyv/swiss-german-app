import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TOPIC_ILLUSTRATIONS } from "@/app/topic-illustrations";
import { TopicTile } from "@/app/ui/topic-tile";
import { isReady, textIn, TOPICS } from "@/lib/conversations";
import { getDictionary, getLocale } from "@/lib/i18n/server";

// Swiss German conversations as they're heard in everyday life: the flashcard topics, without The
// Essentials, each with its scenes. Every learner sees every conversation for now, whatever their
// dialect.
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
      <h1 className="text-title font-bold">{t.nav.conversations}</h1>

      <ul className="grid grid-cols-2 gap-3">
        {TOPICS.map((topic) => (
          <li key={topic.id} className="flex flex-col">
            <TopicTile
              href={`/conversations/${topic.id}`}
              title={textIn(topic.title, locale)}
              caption={t.conversations.scenes(topic.situations.length)}
              image={TOPIC_ILLUSTRATIONS[topic.deck]}
              // Like a flashcard topic without cards: there's nothing to listen to here yet.
              comingSoon={topic.situations.some(isReady) ? undefined : t.conversations.comingSoon}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
