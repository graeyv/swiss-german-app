import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { lessonsFor } from "@/lib/learn/lessons";
import { OnboardingFlow } from "./onboarding-flow";

// A track's modules, for the first question.
function modulesOf(language: "de" | "en") {
  return lessonsFor(language).map(({ lesson }) => ({ title: lesson.title, icon: lesson.icon }));
}

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
  const locale = await getLocale();
  return (
    <>
      <title>{dictionary(locale).title(dictionary(locale).onboarding.title)}</title>
      <OnboardingFlow locale={locale} tracks={{ de: modulesOf("de"), en: modulesOf("en") }} />
    </>
  );
}
