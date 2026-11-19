import { Suspense } from "react";
import { devOnly } from "../../dev-only";
import { IntroductionPreview } from "./introduction-preview";

// Developer tool: the English track's first lesson, Introduction, from the curriculum draft, shown
// as the app would show it, before it goes into content/lessons.
export default function DevIntroductionPage() {
  devOnly();
  return (
    <Suspense>
      <IntroductionPreview />
    </Suspense>
  );
}
