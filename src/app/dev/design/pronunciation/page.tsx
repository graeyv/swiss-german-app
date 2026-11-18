import { findLesson } from "@/lib/learn/lessons";
import { devOnly } from "../../dev-only";
import { PronunciationRound } from "./pronunciation-round";

// Developer tool: a prototype of the pronunciation exercises, with placeholder words.
export default function DevPronunciationPage() {
  devOnly();
  const consonants = findLesson("be", "pronunciation")!.lesson.sections.find(({ id }) => id === "consonants")!;
  return <PronunciationRound rules={consonants.rules} />;
}
