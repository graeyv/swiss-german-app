// Developer tool: makes time pass for one account on the linked project, by moving all of its
// review timestamps into the past. Cards fall due, FSRS sees the longer gap since each review,
// and today's goal starts over, exactly as if the days had passed. Not part of the app.
//
//   npm run dev:time-travel -- you@example.com [--days 1]
//
// --days may be a fraction, such as 0.01 (about 15 minutes) to skip a learning step.
import { requireAccount, runLinkedSql, userIdOf } from "./lib/run-linked-sql.mjs";

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"));
const daysIndex = args.indexOf("--days");
const days = daysIndex === -1 ? 1 : Number(args[daysIndex + 1]);

if (!email || !Number.isFinite(days) || days <= 0) {
  console.error("Usage: npm run dev:time-travel -- you@example.com [--days 1]");
  process.exit(1);
}

const user = userIdOf(email);
const shift = `make_interval(secs => ${days * 86_400})`;
runLinkedSql(`
${requireAccount(email)}
update public.review_items
set due_at = due_at - ${shift},
    last_review_at = last_review_at - ${shift}
where user_id = ${user};

update public.review_log
set reviewed_at = reviewed_at - ${shift},
    due_at = due_at - ${shift},
    last_review_at = last_review_at - ${shift}
where user_id = ${user};

update public.lesson_progress
set completed_at = completed_at - ${shift}
where user_id = ${user};
`);

console.log(`Moved ${email} ${days} ${days === 1 ? "day" : "days"} into the future.`);
