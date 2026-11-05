-- Grammar cards. Each grammar rule (a grammar point) is one card with its own FSRS schedule, and
-- is practised through a pool of exercises of different types and levels. The app picks one of
-- them each time the card is due, and grades the review by whether the answer was right.

-- Decks hold either words or grammar rules. The content build checks that a deck's cards are of
-- its kind, and that a deck has its parent's kind.
alter table public.decks
  add column kind text not null default 'vocabulary' check (kind in ('vocabulary', 'grammar'));

create table public.grammar_points (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- Null for a rule of every dialect, which can still have exercises for each dialect.
  dialect_id text references public.dialects (id)
);

-- The rule's name and the explanation shown before practising and after a wrong answer.
create table public.grammar_point_translations (
  grammar_point_id uuid not null references public.grammar_points (id) on delete cascade,
  locale text not null references public.locales (code),
  -- Either can be missing in a language and falls back to English.
  title text,
  explanation text,
  primary key (grammar_point_id, locale),
  check (title is not null or explanation is not null)
);

-- Payload shapes are the tasks in src/lib/exercises/tasks.ts, without their type. Any text in a
-- payload may instead be an object of translations, such as {"en": "To a friend", "de": "Zu
-- einer Freundin"}, falling back to English. The content build checks each payload.
create table public.grammar_exercises (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  grammar_point_id uuid not null references public.grammar_points (id) on delete cascade,
  type text not null check (type in ('pick', 'build', 'spot_error')),
  -- 1 recognises the rule, 2 uses it with help, 3 uses it freely.
  level smallint not null check (level between 1 and 3),
  -- Null for an exercise that fits every dialect.
  dialect_id text references public.dialects (id),
  payload jsonb not null check (jsonb_typeof(payload) = 'object')
);

create index grammar_exercises_grammar_point_id_idx on public.grammar_exercises (grammar_point_id);

alter table public.grammar_points enable row level security;
alter table public.grammar_point_translations enable row level security;
alter table public.grammar_exercises enable row level security;

create policy "Grammar points are public" on public.grammar_points
  for select to anon, authenticated using (true);
create policy "Grammar point translations are public" on public.grammar_point_translations
  for select to anon, authenticated using (true);
create policy "Grammar exercises are public" on public.grammar_exercises
  for select to anon, authenticated using (true);

grant select on public.grammar_points, public.grammar_point_translations, public.grammar_exercises
  to anon, authenticated;

alter table public.cards
  add column grammar_point_id uuid unique references public.grammar_points (id) on delete cascade,
  drop constraint cards_kind_check,
  add constraint cards_kind_check check (kind in ('vocabulary', 'grammar')),
  add constraint cards_grammar_point_check check ((kind = 'grammar') = (grammar_point_id is not null));

-- Like words, grammar points get their card when they're added.
create function public.create_grammar_card()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.cards (kind, grammar_point_id) values ('grammar', new.id);
  return new;
end;
$$;

revoke execute on function public.create_grammar_card() from public, anon, authenticated;

create trigger on_grammar_point_created
  after insert on public.grammar_points
  for each row execute function public.create_grammar_card();

-- For grammar reviews: the exercise shown, and whether the answer was right. exercise_id turns
-- null if the exercise is later removed from the content, while the review stays in the log.
alter table public.review_log
  add column exercise_id uuid references public.grammar_exercises (id) on delete set null,
  add column correct boolean,
  add check (exercise_id is null or correct is not null);

create index review_log_exercise_id_idx on public.review_log (exercise_id);

-- A grammar point's title and explanation in the learner's language, each falling back to English.
create function public.grammar_text(p_grammar_point_id uuid)
returns table (title text, explanation text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(learner.title, english.title),
    coalesce(learner.explanation, english.explanation)
  from (select 1) as one
  left join public.grammar_point_translations learner
    on learner.grammar_point_id = p_grammar_point_id and learner.locale = public.learner_locale()
  left join public.grammar_point_translations english
    on english.grammar_point_id = p_grammar_point_id and english.locale = 'en';
$$;

-- The cards the learner studies: words of their dialect, and grammar points of their dialect
-- or of every dialect that have an exercise the learner can be shown. Before choosing a
-- dialect, a learner sees every dialect.
create or replace function public.learner_cards()
returns setof public.cards
language sql
stable
security invoker
set search_path = ''
as $$
  with learner as (
    select p.dialect_id from public.profiles p where p.id = (select auth.uid())
  )
  select c.*
  from public.cards c
  left join public.vocabulary_items v on v.id = c.vocabulary_id
  left join public.grammar_points g on g.id = c.grammar_point_id
  where (
      c.kind = 'vocabulary'
      and (
        (select l.dialect_id from learner l) is null
        or v.dialect_id = (select l.dialect_id from learner l)
      )
    )
    or (
      c.kind = 'grammar'
      and (
        (select l.dialect_id from learner l) is null
        or g.dialect_id is null
        or g.dialect_id = (select l.dialect_id from learner l)
      )
      and exists (
        select 1 from public.grammar_exercises e
        where e.grammar_point_id = g.id
          and (
            (select l.dialect_id from learner l) is null
            or e.dialect_id is null
            or e.dialect_id = (select l.dialect_id from learner l)
          )
      )
    );
$$;

-- These return new columns, or take new arguments, so they're replaced.
drop function public.flashcard_decks();
drop function public.due_flashcards(integer, text);
drop function public.new_flashcards(text, integer);
drop function public.save_review(uuid, uuid, integer, text, jsonb, jsonb);

-- Every deck with its kind and counts. Counts include all levels below a deck, and a card that
-- sits in two topics counts once.
create function public.flashcard_decks()
returns table (
  id uuid,
  parent_id uuid,
  code text,
  kind text,
  title text,
  emoji text,
  description text,
  color text,
  deck_position integer,
  card_count integer,
  due_count integer,
  due_review_count integer,
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
  deck_cards as (
    select distinct t.root_id, c.id as card_id, r.due_at, r.state, r.card_id is null as is_new
    from tree t
    join public.deck_items i on i.deck_id = t.deck_id
    join public.learner_cards() c on c.id = i.card_id
    left join public.review_items r on r.card_id = c.id
  ),
  counts as (
    select
      d.id,
      (count(w.card_id))::integer as card_count,
      (count(w.card_id) filter (where w.due_at <= now()))::integer as due_count,
      (count(w.card_id) filter (where w.due_at <= now() and w.state = 2))::integer
        as due_review_count,
      (count(w.card_id) filter (where w.is_new))::integer as new_count
    from public.decks d
    left join deck_cards w on w.root_id = d.id
    group by d.id
  )
  select
    d.id, d.parent_id, d.code, d.kind, text.title, d.emoji, text.description, d.color,
    d.position, c.card_count, c.due_count, c.due_review_count, c.new_count
  from public.decks d
  join counts c on c.id = d.id
  cross join lateral public.deck_text(d.id) text;
$$;

-- Due cards, most overdue first. With a deck code, only cards in that deck or below it. The
-- word columns are null for grammar cards, whose content comes from grammar_content.
-- last_exercise_id is the exercise a grammar card showed last, so the next one can differ.
create function public.due_flashcards(p_limit integer, p_deck_code text default null)
returns table (
  card_id uuid,
  kind text,
  swiss_german text,
  high_german text,
  meaning text,
  notes text,
  audio_path text,
  last_exercise_id uuid,
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
  with recursive tree as (
    select d.id from public.decks d where d.code = p_deck_code
    union all
    select c.id from tree t join public.decks c on c.parent_id = t.id
  )
  select
    c.id, c.kind, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path,
    (
      select l.exercise_id from public.review_log l
      where l.card_id = c.id and c.kind = 'grammar'
      order by l.reviewed_at desc
      limit 1
    ),
    r.state, r.schedule_status, r.stability, r.difficulty, r.due_at, r.last_review_at,
    r.reps, r.lapses, r.learning_step, r.scheduled_days
  from public.review_items r
  join public.learner_cards() c on c.id = r.card_id
  left join public.vocabulary_items v on v.id = c.vocabulary_id
  left join lateral public.vocabulary_text(v.id) text on true
  where r.due_at <= now()
    and (
      p_deck_code is null
      or exists (
        select 1 from public.deck_items i join tree t on t.id = i.deck_id
        where i.card_id = c.id
      )
    )
  order by r.due_at
  limit p_limit;
$$;

-- Cards the learner hasn't met, in deck order, from a deck and all levels below it. The word
-- columns are null for grammar cards, whose content comes from grammar_content.
create function public.new_flashcards(p_deck_code text, p_limit integer)
returns table (
  card_id uuid,
  kind text,
  swiss_german text,
  high_german text,
  meaning text,
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
  fresh as (
    select distinct on (c.id)
      c.id, c.kind, c.vocabulary_id, t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.learner_cards() c on c.id = i.card_id
    where not exists (select 1 from public.review_items r where r.card_id = c.id)
    order by c.id, t.path, i.position
  )
  select f.id, f.kind, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path
  from fresh f
  left join public.vocabulary_items v on v.id = f.vocabulary_id
  left join lateral public.vocabulary_text(v.id) text on true
  order by f.path, f.position
  limit p_limit;
$$;

-- What a session needs to show grammar cards: each rule's text, and the exercises the learner
-- can be shown, in content order. Payload text is still in every language.
create function public.grammar_content(p_card_ids uuid[])
returns table (
  card_id uuid,
  title text,
  explanation text,
  -- [{ id, type, level, payload }]
  exercises jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with learner as (
    select p.dialect_id from public.profiles p where p.id = (select auth.uid())
  )
  select
    c.id,
    text.title,
    text.explanation,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', e.id, 'type', e.type, 'level', e.level, 'payload', e.payload)
          order by e.code
        ),
        '[]'
      )
      from public.grammar_exercises e
      where e.grammar_point_id = c.grammar_point_id
        and (
          (select l.dialect_id from learner l) is null
          or e.dialect_id is null
          or e.dialect_id = (select l.dialect_id from learner l)
        )
    )
  from public.cards c
  cross join lateral public.grammar_text(c.grammar_point_id) text
  where c.id = any (p_card_ids) and c.kind = 'grammar';
$$;

-- The grammar points of a deck and everything below it, in deck order, with the learner's
-- progress on each. state and due_at are null for points the learner hasn't met.
create function public.deck_grammar_points(p_deck_code text)
returns table (
  card_id uuid,
  title text,
  explanation text,
  state smallint,
  due_at timestamptz
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
  points as (
    select distinct on (c.id)
      c.id, c.grammar_point_id, r.state, r.due_at, t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.learner_cards() c on c.id = i.card_id
    left join public.review_items r on r.card_id = c.id
    where c.kind = 'grammar'
    order by c.id, t.path, i.position
  )
  select p.id, text.title, text.explanation, p.state, p.due_at
  from points p
  cross join lateral public.grammar_text(p.grammar_point_id) text
  order by p.path, p.position;
$$;

-- Save one review: the card and its log entry together. The app calculates the schedule with
-- ts-fsrs, so this trusts the values within the table's checks, which only affects the caller's
-- own schedule. p_review_id makes retries safe, and p_expected_reps rejects a review based on a
-- card that another tab has already changed. A grammar review also names the exercise shown,
-- which must be one of the card's, and whether it was answered right: a wrong answer is Again.
create function public.save_review(
  p_review_id uuid,
  p_card_id uuid,
  p_expected_reps integer,
  p_model text,
  p_card jsonb,
  p_log jsonb,
  p_exercise_id uuid default null,
  p_correct boolean default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_introduced boolean;
  v_kind text;
  v_grammar_point_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from public.review_log where id = p_review_id) then
    return;
  end if;

  select c.kind, c.grammar_point_id into v_kind, v_grammar_point_id
  from public.cards c where c.id = p_card_id;
  if v_kind is null then
    raise exception 'Card not found' using errcode = 'P0002';
  end if;

  if v_kind = 'grammar' then
    if p_correct is null or not exists (
      select 1 from public.grammar_exercises e
      where e.id = p_exercise_id and e.grammar_point_id = v_grammar_point_id
    ) then
      raise exception 'A grammar review needs one of the card''s exercises and whether it was right'
        using errcode = '22023';
    end if;
    if p_correct <> ((p_log ->> 'rating')::smallint > 1) then
      raise exception 'A wrong answer is rated Again, and a right one higher' using errcode = '22023';
    end if;
  elsif p_exercise_id is not null or p_correct is not null then
    raise exception 'Only grammar reviews have an exercise' using errcode = '22023';
  end if;

  v_introduced := not exists (
    select 1 from public.review_items where card_id = p_card_id
  );

  insert into public.review_log (
    id, user_id, card_id, model, rating, reviewed_at, introduced, state, schedule_status,
    stability, difficulty, due_at, last_review_at, learning_step, scheduled_days, exercise_id,
    correct
  ) values (
    p_review_id, v_user_id, p_card_id, p_model,
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
    (p_log ->> 'scheduled_days')::integer,
    p_exercise_id,
    p_correct
  );

  insert into public.review_items (
    user_id, card_id, state, schedule_status, stability, difficulty, due_at,
    last_review_at, reps, lapses, learning_step, scheduled_days
  ) values (
    v_user_id, p_card_id,
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
  on conflict (user_id, card_id) do update
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

revoke execute on function public.grammar_text(uuid) from public;
revoke execute on function public.flashcard_decks() from public, anon;
revoke execute on function public.due_flashcards(integer, text) from public, anon;
revoke execute on function public.new_flashcards(text, integer) from public, anon;
revoke execute on function public.grammar_content(uuid[]) from public, anon;
revoke execute on function public.deck_grammar_points(text) from public, anon;
revoke execute on function
  public.save_review(uuid, uuid, integer, text, jsonb, jsonb, uuid, boolean) from public, anon;
grant execute on function public.grammar_text(uuid) to anon, authenticated;
grant execute on function public.flashcard_decks() to authenticated;
grant execute on function public.due_flashcards(integer, text) to authenticated;
grant execute on function public.new_flashcards(text, integer) to authenticated;
grant execute on function public.grammar_content(uuid[]) to authenticated;
grant execute on function public.deck_grammar_points(text) to authenticated;
grant execute on function
  public.save_review(uuid, uuid, integer, text, jsonb, jsonb, uuid, boolean) to authenticated;
