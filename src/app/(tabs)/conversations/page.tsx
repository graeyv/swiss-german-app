import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getDictionary } from "@/lib/i18n/server";

// Swiss German conversations as they're heard in everyday situations. Empty for now.
export default function ConversationsPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Conversations />
    </Suspense>
  );
}

async function Conversations() {
  const t = await getDictionary();

  return (
    <>
      <title>{t.title(t.nav.conversations)}</title>
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.conversations}</h1>
    </>
  );
}
