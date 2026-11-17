-- What a learner has done in the Learn lessons: the topics they've read, and each round of a
-- lesson's exercises. The lessons themselves are files in content/lessons, so both tables name
-- them by their path, such as "be/pronunciation/consonants/r" for a topic and
-- "be/pronunciation/consonants" for a lesson.

-- A topic counts as read once its page is opened. Opening it again moves read_at, so the latest
-- one tells where the learner left off.
create table public.rule_reads (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path text not null check (path ~ '^[a-z0-9-]+(/[a-z0-9-]+){3}$'),
  read_at timestamptz not null default now(),
  primary key (user_id, path)
);

create index rule_reads_user_read_at_idx on public.rule_reads (user_id, read_at desc);

-- One row per round of a lesson's exercises, with how many were right the first time. No
-- schedule: the Practice tab suggests a lesson from its latest round.
create table public.lesson_rounds (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path text not null check (path ~ '^[a-z0-9-]+(/[a-z0-9-]+){2}$'),
  correct smallint not null check (correct >= 0),
  total smallint not null check (total > 0 and correct <= total),
  practised_at timestamptz not null default now()
);

create index lesson_rounds_user_path_idx on public.lesson_rounds (user_id, path, practised_at desc);

alter table public.rule_reads enable row level security;
alter table public.lesson_rounds enable row level security;

create policy "Users read their own reads" on public.rule_reads
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add their own reads" on public.rule_reads
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users update their own reads" on public.rule_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users read their own rounds" on public.lesson_rounds
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add their own rounds" on public.lesson_rounds
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select, insert, update on public.rule_reads to authenticated;
grant select, insert on public.lesson_rounds to authenticated;
