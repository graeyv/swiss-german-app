-- Flashcards: preorganised decks of vocabulary, scheduled per word with FSRS.

-- Words get a stable code, so correcting a spelling keeps learners' review history.
-- It also allows two different words that happen to be spelled the same.
alter table public.vocabulary_items add column code text;

update public.vocabulary_items v
set code = c.code
from (values
  ('Hoi', 'FC0001'),
  ('Grüezi', 'FC0004'),
  ('Wie gaht''s?', 'L0001'),
  ('Mir gaht''s guet', 'L0002'),
  ('Merci vilmal', 'L0003'),
  ('Uf Widerluege', 'L0004'),
  ('Tschüss', 'L0005'),
  ('en Kafi', 'L0006'),
  ('es Gipfeli', 'L0007'),
  ('Ich hett gern ...', 'L0008'),
  ('Zale, bitte!', 'L0009'),
  ('En Guete!', 'L0010')
) as c (swiss_german, code)
where v.swiss_german = c.swiss_german and v.dialect_id = 'zh';

update public.vocabulary_items set code = 'V-' || id where code is null;

alter table public.vocabulary_items
  alter column code set not null,
  add constraint vocabulary_items_code_key unique (code),
  drop constraint vocabulary_items_dialect_id_swiss_german_key;

-- A tree of any depth, for example Verbs > Past tense. Only the lowest level holds cards, which
-- the content build checks. The tree is shared by all dialects: each learner sees the cards of
-- their own dialect. Written only through content/ and scripts/build-flashcard-seed.mjs.
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.decks (id) on delete cascade,
  code text not null unique,
  title text not null,
  position integer not null,
  published boolean not null default false
);

create index decks_parent_id_idx on public.decks (parent_id);

create table public.deck_items (
  deck_id uuid not null references public.decks (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary_items (id) on delete cascade,
  position integer not null,
  primary key (deck_id, vocabulary_id)
);

create index deck_items_vocabulary_id_idx on public.deck_items (vocabulary_id);

-- The queue moves from Leitner boxes to FSRS. Columns mirror the ts-fsrs card. Boxes can't be
-- converted to memory state, so any existing row starts over as a new card, due now.
alter table public.review_items
  drop column stage,
  add column state smallint not null default 0 check (state between 0 and 3),
  add column schedule_status text not null default 'new'
    check (schedule_status in ('new', 'learning', 'review')),
  add column stability double precision not null default 0 check (stability >= 0),
  add column difficulty double precision not null default 0 check (difficulty between 0 and 10),
  add column last_review_at timestamptz,
  add column reps integer not null default 0 check (reps >= 0),
  add column lapses integer not null default 0 check (lapses >= 0),
  add column learning_step integer not null default 0 check (learning_step >= 0),
  add column scheduled_days integer not null default 0 check (scheduled_days >= 0),
  alter column due_at set default now();

update public.review_items set due_at = now();

-- Append-only history. Holds what FSRS needs to rebuild a card: the rating, its time and the
-- state before it, so the schedule can be replayed under another model later.
create table public.review_log (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary_items (id) on delete cascade,
  model text not null,
  rating smallint not null check (rating between 1 and 4),
  reviewed_at timestamptz not null,
  -- True when the word came from a deck's new cards, which the daily limit counts.
  introduced boolean not null,
  state smallint not null check (state between 0 and 3),
  schedule_status text not null check (schedule_status in ('new', 'learning', 'review')),
  stability double precision not null,
  difficulty double precision not null,
  due_at timestamptz not null,
  last_review_at timestamptz,
  learning_step integer not null,
  scheduled_days integer not null
);

create index review_log_user_reviewed_at_idx on public.review_log (user_id, reviewed_at);
create index review_log_vocabulary_id_idx on public.review_log (vocabulary_id);

alter table public.decks enable row level security;
alter table public.deck_items enable row level security;
alter table public.review_log enable row level security;

create policy "Published decks are public" on public.decks
  for select to anon, authenticated using (published);

-- The decks policy above also applies inside this subquery.
create policy "Items of published decks are public" on public.deck_items
  for select to anon, authenticated using (
    exists (select 1 from public.decks d where d.id = deck_id)
  );

create policy "Users read their own review log" on public.review_log
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add to their own review log" on public.review_log
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select on public.decks, public.deck_items to anon, authenticated;
grant select, insert on public.review_log to authenticated;

-- Every deck with its counts. Counts include all levels below a deck, and a word that sits in
-- two topics counts once. Without a chosen dialect, the learner sees every dialect.
create function public.flashcard_decks()
returns table (
  id uuid,
  parent_id uuid,
  code text,
  title text,
  deck_position integer,
  card_count integer,
  due_count integer,
  new_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive tree as (
    select d.id as root_id, d.id as deck_id from public.decks d
    union all
    select t.root_id, c.id from tree t join public.decks c on c.parent_id = t.deck_id
  ),
  learner as (
    select p.dialect_id from public.profiles p where p.id = (select auth.uid())
  ),
  words as (
    select distinct t.root_id, v.id as vocabulary_id, r.due_at, r.vocabulary_id is null as is_new
    from tree t
    join public.deck_items i on i.deck_id = t.deck_id
    join public.vocabulary_items v on v.id = i.vocabulary_id
    left join public.review_items r on r.vocabulary_id = v.id
    where (select l.dialect_id from learner l) is null
      or v.dialect_id = (select l.dialect_id from learner l)
  )
  select
    d.id,
    d.parent_id,
    d.code,
    d.title,
    d.position,
    (count(w.vocabulary_id))::integer,
    (count(w.vocabulary_id) filter (where w.due_at <= now()))::integer,
    (count(w.vocabulary_id) filter (where w.is_new))::integer
  from public.decks d
  left join words w on w.root_id = d.id
  group by d.id;
$$;

-- Today runs on Zürich time for now, because learners can't set a time zone yet.
create function public.flashcard_summary()
returns table (due_count integer, introduced_today integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (
      select count(*)::integer
      from public.review_items r
      join public.vocabulary_items v on v.id = r.vocabulary_id
      where r.due_at <= now()
        and (
          (select p.dialect_id from public.profiles p where p.id = (select auth.uid())) is null
          or v.dialect_id = (select p.dialect_id from public.profiles p where p.id = (select auth.uid()))
        )
    ),
    (
      select count(*)::integer
      from public.review_log l
      where l.introduced
        and l.reviewed_at >= date_trunc('day', now() at time zone 'Europe/Zurich')
          at time zone 'Europe/Zurich'
    );
$$;

create function public.due_flashcards(p_limit integer)
returns table (
  vocabulary_id uuid,
  swiss_german text,
  high_german text,
  english text,
  notes text,
  audio_path text,
  state smallint,
  schedule_status text,
  stability double precision,
  difficulty double precision,
  due_at timestamptz,
  last_review_at timestamptz,
  reps integer,
  lapses integer,
  learning_step integer,
  scheduled_days integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    v.id, v.swiss_german, v.high_german, v.english, v.notes, v.audio_path,
    r.state, r.schedule_status, r.stability, r.difficulty, r.due_at, r.last_review_at,
    r.reps, r.lapses, r.learning_step, r.scheduled_days
  from public.review_items r
  join public.vocabulary_items v on v.id = r.vocabulary_id
  where r.due_at <= now()
    and (
      (select p.dialect_id from public.profiles p where p.id = (select auth.uid())) is null
      or v.dialect_id = (select p.dialect_id from public.profiles p where p.id = (select auth.uid()))
    )
  order by r.due_at
  limit p_limit;
$$;

-- Words the learner hasn't met, in deck order, from a deck and all levels below it.
create function public.new_flashcards(p_deck_code text, p_limit integer)
returns table (
  vocabulary_id uuid,
  swiss_german text,
  high_german text,
  english text,
  notes text,
  audio_path text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive tree as (
    select d.id, array[]::integer[] as path from public.decks d where d.code = p_deck_code
    union all
    select c.id, t.path || c.position from tree t join public.decks c on c.parent_id = t.id
  ),
  words as (
    select distinct on (v.id)
      v.id, v.swiss_german, v.high_german, v.english, v.notes, v.audio_path,
      t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.vocabulary_items v on v.id = i.vocabulary_id
    where not exists (select 1 from public.review_items r where r.vocabulary_id = v.id)
      and (
        (select p.dialect_id from public.profiles p where p.id = (select auth.uid())) is null
        or v.dialect_id = (select p.dialect_id from public.profiles p where p.id = (select auth.uid()))
      )
    order by v.id, t.path, i.position
  )
  select w.id, w.swiss_german, w.high_german, w.english, w.notes, w.audio_path
  from words w
  order by w.path, w.position
  limit p_limit;
$$;

-- Save one review: the card and its log entry together. The app calculates the schedule with
-- ts-fsrs, so this trusts the values within the table's checks, which only affects the caller's
-- own schedule. p_review_id makes retries safe, and p_expected_reps rejects a review based on a
-- card that another tab has already changed.
create function public.save_review(
  p_review_id uuid,
  p_vocabulary_id uuid,
  p_expected_reps integer,
  p_model text,
  p_card jsonb,
  p_log jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_introduced boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from public.review_log where id = p_review_id) then
    return;
  end if;

  v_introduced := not exists (
    select 1 from public.review_items where vocabulary_id = p_vocabulary_id
  );

  insert into public.review_log (
    id, user_id, vocabulary_id, model, rating, reviewed_at, introduced, state, schedule_status,
    stability, difficulty, due_at, last_review_at, learning_step, scheduled_days
  ) values (
    p_review_id, v_user_id, p_vocabulary_id, p_model,
    (p_log ->> 'rating')::smallint,
    (p_log ->> 'reviewed_at')::timestamptz,
    v_introduced,
    (p_log ->> 'state')::smallint,
    p_log ->> 'schedule_status',
    (p_log ->> 'stability')::double precision,
    (p_log ->> 'difficulty')::double precision,
    (p_log ->> 'due_at')::timestamptz,
    (p_log ->> 'last_review_at')::timestamptz,
    (p_log ->> 'learning_step')::integer,
    (p_log ->> 'scheduled_days')::integer
  );

  insert into public.review_items (
    user_id, vocabulary_id, state, schedule_status, stability, difficulty, due_at,
    last_review_at, reps, lapses, learning_step, scheduled_days
  ) values (
    v_user_id, p_vocabulary_id,
    (p_card ->> 'state')::smallint,
    p_card ->> 'schedule_status',
    (p_card ->> 'stability')::double precision,
    (p_card ->> 'difficulty')::double precision,
    (p_card ->> 'due_at')::timestamptz,
    (p_card ->> 'last_review_at')::timestamptz,
    (p_card ->> 'reps')::integer,
    (p_card ->> 'lapses')::integer,
    (p_card ->> 'learning_step')::integer,
    (p_card ->> 'scheduled_days')::integer
  )
  on conflict (user_id, vocabulary_id) do update
    set state = excluded.state,
        schedule_status = excluded.schedule_status,
        stability = excluded.stability,
        difficulty = excluded.difficulty,
        due_at = excluded.due_at,
        last_review_at = excluded.last_review_at,
        reps = excluded.reps,
        lapses = excluded.lapses,
        learning_step = excluded.learning_step,
        scheduled_days = excluded.scheduled_days
    where public.review_items.reps = p_expected_reps;

  if not found then
    raise exception 'Card was reviewed elsewhere' using errcode = '40001';
  end if;
end;
$$;

revoke execute on function public.flashcard_decks() from public, anon;
revoke execute on function public.flashcard_summary() from public, anon;
revoke execute on function public.due_flashcards(integer) from public, anon;
revoke execute on function public.new_flashcards(text, integer) from public, anon;
revoke execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.flashcard_decks() to authenticated;
grant execute on function public.flashcard_summary() to authenticated;
grant execute on function public.due_flashcards(integer) to authenticated;
grant execute on function public.new_flashcards(text, integer) to authenticated;
grant execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb)
  to authenticated;
