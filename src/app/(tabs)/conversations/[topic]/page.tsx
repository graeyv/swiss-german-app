import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
import { TOPIC_ILLUSTRATIONS } from "@/app/topic-illustrations";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { TopicBanner } from "@/app/ui/topic-banner";
import { findTopic, isReady, textIn, topicParams } from "@/lib/conversations";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return topicParams();
}

// A topic's scenes, under its illustration like the flashcard topic. A scene still to be written
// is listed too, so learners see what's coming, but doesn't open.
export default function ConversationTopicPage({ params }: PageProps<"/conversations/[topic]">) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <ConversationTopic params={params} />
    </Suspense>
  );
}

async function ConversationTopic({ params }: Pick<PageProps<"/conversations/[topic]">, "params">) {
  const [{ topic: id }, t, locale] = await Promise.all([params, getDictionary(), getLocale()]);
  const topic = findTopic(id);
  if (!topic) notFound();
  const title = textIn(topic.title, locale);
  const illustration = TOPIC_ILLUSTRATIONS[topic.deck];

  return (
    <>
      <title>{t.title(title)}</title>
      {/* Directly in the page's column, so it stays at the top while the page scrolls. */}
      <TopBar back={{ href: "/conversations" }} backText={t.nav.conversations} className="-mt-6 -mb-4" />

      <div className="flex flex-col gap-6">
        {illustration && <TopicBanner image={illustration} />}
        <h1 className="text-title font-bold">{title}</h1>
      </div>

      <ListRows>
        {topic.situations.map((scene) => (
          <ListRow
            key={scene.id}
            href={isReady(scene) ? `/conversations/${topic.id}/${scene.id}` : undefined}
            title={textIn(scene.title, locale)}
            caption={isReady(scene) ? textIn(scene.scene, locale) : t.conversations.comingSoon}
          />
        ))}
      </ListRows>
    </>
  );
}
