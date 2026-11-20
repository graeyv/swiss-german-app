// Developer tool: makes time pass for one account on the linked project, by moving everything it
// did into the past: reviews, the topics it read, its lesson rounds and the day it lifted its
// limit. Cards fall due, FSRS sees the longer gap since each review, today's goal starts over and
// the limit applies again, exactly as if the days had passed. Not part of the app.
//
//   npm run next-day                     your account, one day
//   npm run next-day -- 3                three days
//   npm run next-day -- 0.01             about 15 minutes, to skip a learning step
//   npm run next-day -- 1 lea@example.com    another account
//
// Your account is DEV_EMAIL in .env.local, which isn't committed.
import { readFileSync } from "node:fs";
import { requireAccount, runLinkedSql, userIdOf } from "./lib/run-linked-sql.mjs";

// DEV_EMAIL from .env.local, if it's there.
function devEmail() {
  try {
    const line = readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith("DEV_EMAIL="));
    return line?.slice("DEV_EMAIL=".length).trim().replace(/^"|"$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

const args = process.argv.slice(2);
const days = Number(args.find((arg) => !arg.includes("@")) ?? 1);
const email = args.find((arg) => arg.includes("@")) ?? devEmail();

if (!email || !Number.isFinite(days) || days <= 0) {
  console.error(
    email
      ? "Usage: npm run next-day -- [days] [email]"
      : "Add DEV_EMAIL=you@example.com to .env.local, or name the account: npm run next-day -- 1 you@example.com",
  );
  process.exit(1);
}

const user = userIdOf(email);
const shift = `make_interval(secs => ${days * 86_400})`;
// The lifted limit is a date, so it moves by whole days only, once a day or more has passed.
const wholeDays = Math.floor(days);
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

update public.rule_reads
set read_at = read_at - ${shift}
where user_id = ${user};

update public.lesson_rounds
set practised_at = practised_at - ${shift}
where user_id = ${user};

update public.profiles
set limit_lifted_on = limit_lifted_on - ${wholeDays}
where id = ${user} and limit_lifted_on is not null;
`);

console.log(`Moved ${email} ${days} ${days === 1 ? "day" : "days"} into the future.`);
