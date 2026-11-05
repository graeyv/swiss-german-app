// Developer tool: every grammar exercise, to try them one by one on the real grammar card.
// Exists only while running `npm run dev`. Not part of the app.
import { notFound } from "next/navigation";
import type { Task } from "@/lib/exercises/tasks";
import type { Locale } from "@/lib/i18n";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function devOnly() {
  if (process.env.NODE_ENV === "production") notFound();
}

export type DevExercise = {
  id: string;
  code: string;
  type: Task["type"];
  level: number;
  dialect: string | null;
  payload: Record<string, unknown>;
  point: { code: string; title: string };
};

// All exercises in content order, each with its rule's title in the learner's language.
export async function getAllExercises(supabase: Supabase, locale: Locale): Promise<DevExercise[]> {
  const { data, error } = await supabase
    .from("grammar_exercises")
    .select(
      "id, code, type, level, dialect_id, payload, grammar_points(code, grammar_point_translations(locale, title))",
    )
    .order("code");
  if (error) throw new Error(error.message);

  return data.map((row) => {
    const translations = row.grammar_points?.grammar_point_translations ?? [];
    const title =
      translations.find((translation) => translation.locale === locale)?.title ??
      translations.find((translation) => translation.locale === "en")?.title ??
      "";
    return {
      id: row.id,
      code: row.code,
      type: row.type as Task["type"],
      level: row.level,
      dialect: row.dialect_id,
      payload: row.payload as Record<string, unknown>,
      point: { code: row.grammar_points?.code ?? "", title },
    };
  });
}
