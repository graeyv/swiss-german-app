import { Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";
import { lessonsFor } from "@/lib/learn/lessons";
import { OnboardingFlow } from "./onboarding-flow";

// A track's modules, for the first question, titled in the language it's asked in.
function modulesOf(language: Locale, locale: Locale) {
  return lessonsFor(language).map(({ lesson }) => ({
    title: lesson.titleIn?.[locale] ?? lesson.title,
    icon: lesson.icon,
  }));
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
      <OnboardingFlow locale={locale} tracks={{ de: modulesOf("de", locale), en: modulesOf("en", locale) }} />
    </>
  );
}
