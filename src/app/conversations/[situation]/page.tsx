import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { TopBar } from "@/app/top-bar";
import { findSituation, situationParams, textIn } from "@/lib/conversations";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { DialoguePlayer } from "./dialogue-player";

export function generateStaticParams() {
  return situationParams();
}

// One situation: its dialogue to listen to, with the transcript and its translation once it's
// been heard. Full screen like a lesson, with the player at the bottom within thumb reach.
export default function SituationPage({ params }: PageProps<"/conversations/[situation]">) {
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

async function SituationView({ params }: Pick<PageProps<"/conversations/[situation]">, "params">) {
  const [{ situation: id }, locale] = await Promise.all([params, getLocale()]);
  const found = findSituation(id);
  if (!found) notFound();
  const { topic, situation } = found;
  const t = dictionary(locale);
  const title = textIn(situation.title, locale);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">
      <title>{t.title(title)}</title>
      <TopBar back={{ href: "/conversations", label: t.conversations.back }} />

      <div className="flex flex-col gap-1 pt-4 pb-6">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {textIn(topic.title, locale)}
        </p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <span aria-hidden>{situation.emoji}</span>
          {title}
        </h1>
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
