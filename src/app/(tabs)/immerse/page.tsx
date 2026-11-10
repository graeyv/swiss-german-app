import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getDictionary } from "@/lib/i18n/server";

// Swiss German as it's heard in everyday situations. Empty for now.
export default function ImmersePage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Immerse />
    </Suspense>
  );
}

async function Immerse() {
  const t = await getDictionary();

  return (
    <>
      <title>{t.title(t.nav.immerse)}</title>
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.immerse}</h1>
    </>
  );
}
