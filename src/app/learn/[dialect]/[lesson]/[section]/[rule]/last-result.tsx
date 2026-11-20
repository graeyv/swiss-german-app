import { connection } from "next/server";
import type { Dictionary } from "@/lib/i18n";
import { getRounds } from "@/lib/learn/suggestion";
import { createClient } from "@/lib/supabase/server";

// The learner's last result of a round, under the button that starts it, so practising again
// doesn't look like starting from nothing. Nothing before the first round. path is the round's,
// such as "be/pronunciation/mixed".
export async function LastResult({ path, t }: { path: string; t: Dictionary["practice"] }) {
  await connection();
  const round = (await getRounds(await createClient(), new Date())).get(path);
  if (!round) return null;
  return (
    <p className="text-center text-caption text-teal-soft">
      {t.lastResult(t.ago(round.daysAgo), round.correct, round.total)}
    </p>
  );
}
