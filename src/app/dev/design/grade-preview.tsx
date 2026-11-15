"use client";

import { GradeButtons } from "@/app/flashcards/grade-buttons";
import { dictionary } from "@/lib/i18n";

const INTERVALS = { 1: "1 Min.", 2: "6 Min.", 3: "10 Min.", 4: "3 T." };

// The rating buttons on /dev/design. They don't rate anything.
export function GradePreview() {
  return <GradeButtons intervals={INTERVALS} onGrade={() => {}} t={dictionary("de").session} />;
}
