// Runs SQL against the linked Supabase project, for the developer scripts in this folder.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

// Fails when no account has this email, so a typo can't silently do nothing.
export function requireAccount(email) {
  const quoted = quoteLiteral(email);
  return `
do $$
begin
  if not exists (select 1 from auth.users where email = ${quoted}) then
    raise exception 'No account with the email %', ${quoted};
  end if;
end;
$$;
`;
}

export function userIdOf(email) {
  return `(select id from auth.users where email = ${quoteLiteral(email)})`;
}

export function runLinkedSql(sql) {
  const dir = mkdtempSync(join(tmpdir(), "hoi-"));
  const file = join(dir, "script.sql");
  writeFileSync(file, sql);

  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "-f", `"${file}"`], {
    shell: true,
    encoding: "utf8",
  });
  rmSync(dir, { recursive: true, force: true });

  if (result.status !== 0 || /"_tag":"Error"/.test(result.stdout)) {
    console.error(result.stdout || result.stderr);
    process.exit(1);
  }
}
