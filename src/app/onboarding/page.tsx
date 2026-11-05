import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getToday } from "@/lib/flashcards/data";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { isLevel } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl px-6 py-6">
          <LoadingPlaceholder />
        </div>
      }
    >
      <Onboarding />
    </Suspense>
  );
}

async function Onboarding() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const [{ tree }, profile] = await Promise.all([
    getToday(supabase),
    supabase.from("profiles").select("swiss_german_level, interests").maybeSingle(),
  ]);
  if (profile.error) throw new Error(profile.error.message);

  return (
    <>
      <title>{dictionary(locale).title(dictionary(locale).onboarding.title)}</title>
      <OnboardingFlow
        locale={locale}
        topics={tree
          .filter((deck) => deck.kind === "vocabulary")
          .map(({ code, title, emoji, color }) => ({ code, title, emoji, color }))}
        initialLevel={isLevel(profile.data?.swiss_german_level) ? profile.data.swiss_german_level : null}
        initialInterests={profile.data?.interests ?? []}
      />
    </>
  );
}
