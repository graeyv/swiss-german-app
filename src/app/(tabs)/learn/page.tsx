import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getDictionary } from "@/lib/i18n/server";

// Lessons on how Swiss German differs from Standard German. Empty until the first one is added.
export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Learn />
    </Suspense>
  );
}

async function Learn() {
  const t = await getDictionary();

  return (
    <>
      <title>{t.title(t.nav.learn)}</title>
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.learn}</h1>
    </>
  );
}
