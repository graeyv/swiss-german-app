"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function completeLesson(
  lessonId: string,
  score: number,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_lesson", {
    p_lesson_id: lessonId,
    p_score: score,
  });
  if (error) return { error: error.message };

  revalidatePath("/learn");
  return {};
}
