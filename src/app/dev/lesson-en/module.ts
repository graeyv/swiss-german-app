import { findLesson, type Rule, type Section } from "@/lib/learn/lessons";

// The module /dev/lesson-en shows: the English track's Pronunciation, from its lesson file
// content/lessons/be/en/sounds.json.
export const MODULE = findLesson("be", "sounds")!;

export const BASE = "/dev/lesson-en";

export function topicHref(section: Section, rule: Rule) {
  return `${BASE}/${section.id}/${rule.id}`;
}
