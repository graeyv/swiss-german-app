"use server";

import { revalidatePath } from "next/cache";
import { findLesson, findRule, findSection, roundExercises } from "@/lib/learn/lessons";
import { isRulePath } from "@/lib/learn/progress";
import { createClient } from "@/lib/supabase/server";

// Marks a topic as read, or moves when it was read, so the Learn tab knows where the learner left
// off. path is such as "be/pronunciation/consonants/r". Only topics that exist are saved.
export async function markRead(path: string): Promise<{ error?: string }> {
  if (!isRulePath(path)) return { error: "Unknown topic" };
  const [dialect, lessonId, sectionId, ruleId] = path.split("/");
  const found = findLesson(dialect, lessonId);
  if (!found || !findRule(found.lesson, sectionId, ruleId)) return { error: "Unknown topic" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("rule_reads")
    .upsert({ path, read_at: new Date().toISOString() }, { onConflict: "user_id,path" });
  if (error) return { error: error.message };

  // The Learn tab and the module's page show what's read.
  revalidatePath("/learn");
  revalidatePath("/learn/[dialect]/[lesson]", "page");
  return {};
}

// Saves a round of a section's exercises: how many of them were right the first time. path is
// such as "be/pronunciation/consonants".
export async function saveRound(path: string, correct: number, total: number): Promise<{ error?: string }> {
  const [dialect, lessonId, sectionId, ...rest] = path.split("/");
  const found = findLesson(dialect, lessonId);
  const section = found && findSection(found.lesson, sectionId);
  if (rest.length > 0 || !section || roundExercises(section).length === 0) return { error: "Unknown lesson" };
  if (!Number.isInteger(total) || !Number.isInteger(correct) || total < 1 || correct < 0 || correct > total) {
    return { error: "Unknown result" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_rounds").insert({ path, correct, total });
  if (error) return { error: error.message };
  return {};
}
