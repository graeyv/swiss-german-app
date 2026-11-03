// Developer tool: deletes one account's flashcard progress on the linked project, so the app
// can be tested from a clean start. Not part of the app.
//
//   npm run dev:reset-progress -- you@example.com [--lessons]
//
// Keeps the account, its settings and all content. --lessons also resets lesson scores.
import { requireAccount, runLinkedSql, userIdOf } from "./lib/run-linked-sql.mjs";

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"));
const lessons = args.includes("--lessons");

if (!email) {
  console.error("Usage: npm run dev:reset-progress -- you@example.com [--lessons]");
  process.exit(1);
}

const user = userIdOf(email);
runLinkedSql(`
${requireAccount(email)}
delete from public.review_log where user_id = ${user};
delete from public.review_items where user_id = ${user};
${lessons ? `delete from public.lesson_progress where user_id = ${user};` : ""}
`);

console.log(`Reset flashcard progress for ${email}${lessons ? ", including lessons" : ""}.`);
