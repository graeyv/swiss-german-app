import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
import { findTopic, isReady, sceneParams, textIn } from "@/lib/conversations";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { DialoguePlayer } from "./dialogue-player";

export function generateStaticParams() {
  return sceneParams();
}

// One scene: its dialogue to listen to, with the transcript and its translation once it's been
// heard. Full screen like a lesson, with the player at the bottom within thumb reach. A scene
// still to be written has no page.
export default function ScenePage({ params }: PageProps<"/conversations/[topic]/[scene]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl px-6 py-6">
          <LoadingPlaceholder />
        </div>
      }
    >
      <SituationView params={params} />
    </Suspense>
  );
}

async function SituationView({ params }: Pick<PageProps<"/conversations/[topic]/[scene]">, "params">) {
  const [{ topic: topicId, scene: sceneId }, locale] = await Promise.all([params, getLocale()]);
  const topic = findTopic(topicId);
  const situation = topic?.situations.find((candidate) => candidate.id === sceneId);
  if (!topic || !situation || !isReady(situation)) notFound();
  const t = dictionary(locale);
  const title = textIn(situation.title, locale);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <title>{t.title(title)}</title>
      <TopBar back={{ href: `/conversations/${topic.id}` }} backText={textIn(topic.title, locale)} />

      <div className="flex flex-col gap-1 pt-4 pb-6">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {textIn(topic.title, locale)}
        </p>
        <h1 className="text-title font-bold">{title}</h1>
        <p className="text-muted">{textIn(situation.scene, locale)}</p>
      </div>

      <DialoguePlayer
        // A new situation starts unheard, with a fresh player.
        key={situation.id}
        audio={situation.audio}
        lines={situation.lines}
        locale={locale}
      />
    </main>
  );
}
