-- Flashcards are scheduled per card instead of per word, so that other kinds of cards, such as
-- grammar rules, can share decks, the review queue and FSRS with words. A card holds no content
-- of its own: it says what kind it is and points to its content. Every word has exactly one
-- card, which both directions of the word share. Existing progress moves to the word's card.

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('vocabulary')),
  vocabulary_id uuid unique references public.vocabulary_items (id) on delete cascade,
  check ((kind = 'vocabulary') = (vocabulary_id is not null))
);

alter table public.cards enable row level security;

create policy "Cards are public" on public.cards
  for select to anon, authenticated using (true);

grant select on public.cards to anon, authenticated;

insert into public.cards (kind, vocabulary_id)
select 'vocabulary', id from public.vocabulary_items;

-- Words are added by the seed files and the content build, which then find the card by its word.
create function public.create_vocabulary_card()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.cards (kind, vocabulary_id) values ('vocabulary', new.id);
  return new;
end;
$$;

revoke execute on function public.create_vocabulary_card() from public, anon, authenticated;

create trigger on_vocabulary_item_created
  after insert on public.vocabulary_items
  for each row execute function public.create_vocabulary_card();

-- The functions below return card_id instead of vocabulary_id, or take it, so they're replaced.
drop function public.due_flashcards(integer, text);
drop function public.new_flashcards(text, integer);
drop function public.deck_words(text);
drop function public.save_review(uuid, uuid, integer, text, jsonb, jsonb);

alter table public.deck_items add column card_id uuid references public.cards (id) on delete cascade;
update public.deck_items i set card_id = c.id from public.cards c where c.vocabulary_id = i.vocabulary_id;
alter table public.deck_items drop constraint deck_items_pkey;
alter table public.deck_items drop column vocabulary_id;
alter table public.deck_items alter column card_id set not null;
alter table public.deck_items add primary key (deck_id, card_id);
create index deck_items_card_id_idx on public.deck_items (card_id);

alter table public.review_items add column card_id uuid references public.cards (id) on delete cascade;
update public.review_items r set card_id = c.id from public.cards c where c.vocabulary_id = r.vocabulary_id;
alter table public.review_items drop constraint review_items_pkey;
alter table public.review_items drop column vocabulary_id;
alter table public.review_items alter column card_id set not null;
alter table public.review_items add primary key (user_id, card_id);
create index review_items_card_id_idx on public.review_items (card_id);

alter table public.review_log add column card_id uuid references public.cards (id) on delete cascade;
update public.review_log l set card_id = c.id from public.cards c where c.vocabulary_id = l.vocabulary_id;
alter table public.review_log drop column vocabulary_id;
alter table public.review_log alter column card_id set not null;
create index review_log_card_id_idx on public.review_log (card_id);

-- The cards the learner studies: those of their dialect, or of every dialect before they've
-- chosen one. Every flashcard function goes through this, so a new kind of card only needs
-- adding here to be counted, scheduled and shown.
create function public.learner_cards()
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
  join public.vocabulary_items v on v.id = c.vocabulary_id
  where (select l.dialect_id from learner l) is null
    or v.dialect_id = (select l.dialect_id from learner l);
$$;

-- Every deck with its counts. Counts include all levels below a deck, and a card that sits in
-- two topics counts once.
create or replace function public.flashcard_decks()
returns table (
  id uuid,
  parent_id uuid,
  code text,
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
    d.id, d.parent_id, d.code, text.title, d.emoji, text.description, d.color, d.position,
    c.card_count, c.due_count, c.due_review_count, c.new_count
  from public.decks d
  join counts c on c.id = d.id
  cross join lateral public.deck_text(d.id) text;
$$;

-- Today's review progress counts cards, not answers. A review is a card learned before today,
-- counted once however often it comes back. Repeats of today's new cards in their learning
-- steps are part of learning them, so they count toward neither the reviews done nor the total.
create or replace function public.flashcard_summary()
returns table (
  due_learning_count integer,
  -- The part of due_learning_count that are cards learned before today.
  due_learning_known_count integer,
  due_review_count integer,
  introduced_today integer,
  -- Answers on cards the learner already knew, which the daily review limit counts.
  reviewed_today integer,
  -- Cards learned before today that were reviewed today, each counted once.
  reviews_today integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with today as (
    select l.card_id, l.introduced, l.state
    from public.review_log l
    where l.reviewed_at >= date_trunc('day', now() at time zone 'Europe/Zurich')
      at time zone 'Europe/Zurich'
  ),
  introduced_today as (
    select distinct card_id from today where introduced
  ),
  due as (
    select r.state, r.card_id in (select card_id from introduced_today) as new_today
    from public.review_items r
    join public.learner_cards() c on c.id = r.card_id
    where r.due_at <= now()
  )
  select
    (select count(*)::integer from due where state <> 2),
    (select count(*)::integer from due where state <> 2 and not new_today),
    (select count(*)::integer from due where state = 2),
    (select count(*)::integer from introduced_today),
    (select count(*)::integer from today where not introduced and state = 2),
    (
      select count(distinct card_id)::integer
      from today
      where not introduced
        and card_id not in (select card_id from introduced_today)
    );
$$;

-- Due cards, most overdue first. With a deck code, only cards in that deck or below it.
create function public.due_flashcards(p_limit integer, p_deck_code text default null)
returns table (
  card_id uuid,
  swiss_german text,
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
    c.id, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path,
    r.state, r.schedule_status, r.stability, r.difficulty, r.due_at, r.last_review_at,
    r.reps, r.lapses, r.learning_step, r.scheduled_days
  from public.review_items r
  join public.learner_cards() c on c.id = r.card_id
  join public.vocabulary_items v on v.id = c.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
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

-- Cards the learner hasn't met, in deck order, from a deck and all levels below it.
create function public.new_flashcards(p_deck_code text, p_limit integer)
returns table (
  card_id uuid,
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
      c.id, c.vocabulary_id, t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.learner_cards() c on c.id = i.card_id
    where not exists (select 1 from public.review_items r where r.card_id = c.id)
    order by c.id, t.path, i.position
  )
  select f.id, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path
  from fresh f
  join public.vocabulary_items v on v.id = f.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
  order by f.path, f.position
  limit p_limit;
$$;

-- The words of a deck and everything below it, in deck order, with the learner's progress on
-- each. state and due_at are null for words the learner hasn't met.
create function public.deck_words(p_deck_code text)
returns table (
  card_id uuid,
  swiss_german text,
  high_german text,
  meaning text,
  notes text,
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
  words as (
    select distinct on (c.id)
      c.id, c.vocabulary_id, r.state, r.due_at, t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.learner_cards() c on c.id = i.card_id
    left join public.review_items r on r.card_id = c.id
    order by c.id, t.path, i.position
  )
  select w.id, v.swiss_german, v.high_german, text.meaning, text.notes, w.state, w.due_at
  from words w
  join public.vocabulary_items v on v.id = w.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
  order by w.path, w.position;
$$;

-- Save one review: the card and its log entry together. The app calculates the schedule with
-- ts-fsrs, so this trusts the values within the table's checks, which only affects the caller's
-- own schedule. p_review_id makes retries safe, and p_expected_reps rejects a review based on a
-- card that another tab has already changed.
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

-- Record a finished lesson, keeping the best score, and queue the cards of its words for review.
-- Runs as the caller, so the policies still apply.
create or replace function public.complete_lesson(p_lesson_id uuid, p_score integer)
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

  insert into public.review_items (user_id, card_id)
  select distinct v_user_id, c.id
  from public.exercises e
  join public.cards c on c.vocabulary_id = e.vocabulary_id
  where e.lesson_id = p_lesson_id
  on conflict (user_id, card_id) do nothing;
end;
$$;

revoke execute on function public.learner_cards() from public, anon;
revoke execute on function public.due_flashcards(integer, text) from public, anon;
revoke execute on function public.new_flashcards(text, integer) from public, anon;
revoke execute on function public.deck_words(text) from public, anon;
revoke execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.learner_cards() to authenticated;
grant execute on function public.due_flashcards(integer, text) to authenticated;
grant execute on function public.new_flashcards(text, integer) to authenticated;
grant execute on function public.deck_words(text) to authenticated;
grant execute on function public.save_review(uuid, uuid, integer, text, jsonb, jsonb)
  to authenticated;
