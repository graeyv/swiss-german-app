"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

// The topics shown first in Practice: top-level vocabulary decks, as chosen in onboarding.
export async function updateInterests(codes: string[]): Promise<Result> {
  if (!Array.isArray(codes)) return { error: "Unknown topics" };

  const supabase = await createClient();
  // Only topics that exist count, so a stale or tampered list can't pile up.
  const { data: topics, error } = await supabase
    .from("decks")
    .select("code")
    .is("parent_id", null)
    .eq("kind", "vocabulary")
    .in("code", codes);
  if (error) return { error: error.message };

  const result = await updateProfile({ interests: topics.map((topic) => topic.code) });
  if (!result.error) revalidatePath("/flashcards");
  return result;
}

// The dialect whose words and grammar the learner practises.
export async function updateDialect(dialectId: string): Promise<Result> {
  if (typeof dialectId !== "string") return { error: "Unknown dialect" };

  const supabase = await createClient();
  const { data: dialect, error } = await supabase
    .from("dialects")
    .select("id")
    .eq("id", dialectId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!dialect) return { error: "Unknown dialect" };

  const result = await updateProfile({ dialect_id: dialect.id });
  // Every deck, count and session depends on the dialect.
  if (!result.error) revalidatePath("/flashcards", "layout");
  return result;
}

async function updateProfile(changes: { interests?: string[]; dialect_id?: string }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Not logged in" };

  // An update that matches no row isn't an error, so check that the profile was found.
  const { data, error } = await supabase
    .from("profiles")
    .update(changes)
    .eq("id", claims.claims.sub)
    .select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Your profile is missing" };

  revalidatePath("/profile");
  return {};
}
