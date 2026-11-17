-- Grammar is no longer a kind of flashcard. Rules are practised in the Learn lessons instead,
-- whose exercises live in content/lessons, so the grammar cards, their decks and exercises go,
-- with every learner's progress on them. Flashcards are words only from here on.

-- The grammar decks and cards, and with the cards their reviews and deck places.
delete from public.decks where kind = 'grammar';
delete from public.cards where kind = 'grammar';

drop trigger on_grammar_point_created on public.grammar_points;
drop function public.create_grammar_card();
drop function public.grammar_content(uuid[]);
drop function public.deck_grammar_points(text);
drop function public.grammar_text(uuid);

-- Saving a review no longer takes an exercise.
drop function public.save_review(uuid, uuid, integer, text, jsonb, jsonb, uuid, boolean);

alter table public.review_log
  drop column exercise_id,
  drop column correct;

create function public.save_review(
  p_review_id uuid,
  p_card_id uuid,
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

  if not exists (select 1 from public.cards c where c.id = p_card_id) then
    raise exception 'Card not found' using errcode = 'P0002';
  end if;

  v_introduced := not exists (
    select 1 from public.review_items where card_id = p_card_id
  );

  insert into public.review_log (
    id, user_id, card_id, model, rating, reviewed_at, introduced, state, schedule_status,
    stability, difficulty, due_at, last_review_at, learning_step, scheduled_days
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
    (p_log ->> 'scheduled_days')::integer
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

-- The cards a learner sees: words with a form in their dialect, or any form before they've chosen
-- one.
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
  where c.kind = 'vocabulary'
    and exists (
      select 1 from public.vocabulary_forms f
      where f.vocabulary_id = c.vocabulary_id
        and (
          (select l.dialect_id from learner l) is null
          or f.dialect_id = (select l.dialect_id from learner l)
        )
    );
$$;

-- Due cards no longer name the exercise a grammar card showed last.
drop function public.due_flashcards(integer, text, text[]);

create function public.due_flashcards(
  p_limit integer,
  p_deck_code text default null,
  p_types text[] default null
)
returns table (
  card_id uuid,
  kind text,
  swiss_german text,
  variants text[],
  high_german text,
  meaning text,
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
  with recursive tree as (
    select d.id from public.decks d where d.code = p_deck_code
    union all
    select c.id from tree t join public.decks c on c.parent_id = t.id
  )
  select
    c.id, c.kind, form.swiss_german, form.variants, v.high_german, text.meaning, text.notes,
    form.audio_path,
    r.state, r.schedule_status, r.stability, r.difficulty, r.due_at, r.last_review_at,
    r.reps, r.lapses, r.learning_step, r.scheduled_days
  from public.review_items r
  join public.learner_cards() c on c.id = r.card_id
  join public.vocabulary_items v on v.id = c.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
  cross join lateral public.vocabulary_form(v.id) form
  where r.due_at <= now()
    and (p_types is null or v.type = any (p_types))
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

-- The profile counts words only.
drop function public.profile_stats();

create function public.profile_stats()
returns table (
  -- Days in a row with at least one review, up to today, or up to yesterday while today has
  -- none yet. Days run on Zürich time, like the daily goal.
  streak integer,
  -- Cards past their first learning steps, even if forgotten since and being relearned.
  words_learned integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select distinct (l.reviewed_at at time zone 'Europe/Zurich')::date as day
    from public.review_log l
    where l.user_id = (select auth.uid())
  ),
  latest as (
    select max(day) as day from days
  ),
  -- Counting back from the latest day, a day belongs to the streak while none is missing. The
  -- first gap ends it, because every day after it is further back than its place in the list.
  numbered as (
    select day, row_number() over (order by day desc) as place from days
  )
  select
    (
      select count(*)::integer
      from numbered n, latest
      where latest.day >= (now() at time zone 'Europe/Zurich')::date - 1
        and n.day = latest.day - (n.place - 1)::integer
    ),
    (
      select count(*)::integer
      from public.review_items r
      where r.user_id = (select auth.uid()) and r.state in (2, 3)
    );
$$;

-- Cards and decks hold words only.
alter table public.cards
  drop constraint cards_grammar_point_check,
  drop column grammar_point_id,
  drop constraint cards_kind_check,
  add constraint cards_kind_check check (kind = 'vocabulary');

alter table public.decks
  drop constraint decks_kind_check,
  add constraint decks_kind_check check (kind = 'vocabulary');

drop table public.grammar_exercises;
drop table public.grammar_point_translations;
drop table public.grammar_points;

revoke execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb) from public, anon;
revoke execute on function public.due_flashcards(integer, text, text[]) from public, anon;
revoke execute on function public.profile_stats() from public, anon;
grant execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb) to authenticated;
grant execute on function public.due_flashcards(integer, text, text[]) to authenticated;
grant execute on function public.profile_stats() to authenticated;
