import { Suspense } from "react";
import { devOnly } from "../../dev-only";
import { CurriculumPreview } from "./curriculum-preview";

// Developer tool: the English track as it would be with Pronunciation as a module of its own,
// right after an Introduction, and the first words in a module after it (proposal B2).
export default function DevCurriculumPage() {
  devOnly();
  return (
    <Suspense>
      <CurriculumPreview />
    </Suspense>
  );
}
