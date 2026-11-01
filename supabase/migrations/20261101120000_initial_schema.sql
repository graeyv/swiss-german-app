-- Course content: readable by everyone once published, written only through
-- migrations or the service role (no write policies or grants exist for clients).

-- Swiss German has no standard form, so all content belongs to a dialect.
create table public.dialects (
  id text primary key,
  name text not null
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  dialect_id text not null references public.dialects (id),
  slug text not null unique,
  title text not null,
  description text not null default '',
  level text not null default 'A1',
  position integer not null,
  published boolean not null default false,
  unique (dialect_id, position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  position integer not null,
  published boolean not null default false,
  unique (course_id, position)
);

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  dialect_id text not null references public.dialects (id),
  swiss_german text not null,
  high_german text not null,
  english text not null,
  notes text,
  -- Object path in the lesson-audio storage bucket.
  audio_path text,
  unique (dialect_id, swiss_german)
);

create type public.exercise_type as enum ('vocab_card', 'multiple_choice', 'word_order');

-- Payload shapes are defined by the Exercise type in src/lib/types.ts.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position integer not null,
  type public.exercise_type not null,
  vocabulary_id uuid references public.vocabulary_items (id),
  payload jsonb not null default '{}',
  unique (lesson_id, position),
  check (jsonb_typeof(payload) = 'object'),
  check (type <> 'vocab_card' or vocabulary_id is not null)
);

create index exercises_vocabulary_id_idx on public.exercises (vocabulary_id);

-- Learner data: each row is private to its owner.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  dialect_id text references public.dialects (id),
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  best_score integer not null check (best_score between 0 and 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

-- Spaced repetition queue. A stage is a box in a Leitner system: 1 is new, 6 is mastered.
create table public.review_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary_items (id) on delete cascade,
  stage smallint not null default 1 check (stage between 1 and 6),
  due_at timestamptz not null default now() + interval '1 day',
  primary key (user_id, vocabulary_id)
);

create index review_items_user_due_idx on public.review_items (user_id, due_at);
create index review_items_vocabulary_id_idx on public.review_items (vocabulary_id);

-- Row level security

alter table public.dialects enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.exercises enable row level security;
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.review_items enable row level security;

create policy "Dialects are public" on public.dialects
  for select to anon, authenticated using (true);

create policy "Published courses are public" on public.courses
  for select to anon, authenticated using (published);

create policy "Published lessons are public" on public.lessons
  for select to anon, authenticated using (
    published and exists (
      select 1 from public.courses c where c.id = course_id and c.published
    )
  );

create policy "Vocabulary is public" on public.vocabulary_items
  for select to anon, authenticated using (true);

-- The lessons policy above also applies inside this subquery.
create policy "Exercises of published lessons are public" on public.exercises
  for select to anon, authenticated using (
    exists (select 1 from public.lessons l where l.id = lesson_id)
  );

create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users read their own progress" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add their own progress" on public.lesson_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users update their own progress" on public.lesson_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users read their own reviews" on public.review_items
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add their own reviews" on public.review_items
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users update their own reviews" on public.review_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Explicit grants, so access does not depend on the project's default privileges.
grant select on
  public.dialects, public.courses, public.lessons, public.vocabulary_items, public.exercises
  to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.lesson_progress, public.review_items to authenticated;

-- Create a profile for every new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Record a finished lesson, keeping the best score, and queue its vocabulary for review.
-- Runs as the caller, so the policies above still apply.
create function public.complete_lesson(p_lesson_id uuid, p_score integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.lessons where id = p_lesson_id) then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;

  insert into public.lesson_progress (user_id, lesson_id, best_score)
  values (v_user_id, p_lesson_id, p_score)
  on conflict (user_id, lesson_id) do update
    set best_score = greatest(public.lesson_progress.best_score, excluded.best_score),
        completed_at = now();

  insert into public.review_items (user_id, vocabulary_id)
  select distinct v_user_id, e.vocabulary_id
  from public.exercises e
  where e.lesson_id = p_lesson_id and e.vocabulary_id is not null
  on conflict (user_id, vocabulary_id) do nothing;
end;
$$;

revoke execute on function public.complete_lesson(uuid, integer) from public, anon;
grant execute on function public.complete_lesson(uuid, integer) to authenticated;

-- Pronunciation audio. Public buckets serve files without a read policy.
insert into storage.buckets (id, name, public)
values ('lesson-audio', 'lesson-audio', true);
