-- Flashcard sessions are scoped to a deck. Deck counts split due words in two, because the
-- daily review limit only applies to words the learner already knows (state 2), and due cards
-- can be loaded for one deck and everything below it.
drop function public.flashcard_decks();

create function public.flashcard_decks()
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
  learner as (
    select p.dialect_id from public.profiles p where p.id = (select auth.uid())
  ),
  words as (
    select distinct
      t.root_id, v.id as vocabulary_id, r.due_at, r.state, r.vocabulary_id is null as is_new
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
    d.emoji,
    d.description,
    d.color,
    d.position,
    (count(w.vocabulary_id))::integer,
    (count(w.vocabulary_id) filter (where w.due_at <= now()))::integer,
    (count(w.vocabulary_id) filter (where w.due_at <= now() and w.state = 2))::integer,
    (count(w.vocabulary_id) filter (where w.is_new))::integer
  from public.decks d
  left join words w on w.root_id = d.id
  group by d.id;
$$;

drop function public.due_flashcards(integer);

-- Due cards, most overdue first. With a deck code, only words in that deck or below it.
create function public.due_flashcards(p_limit integer, p_deck_code text default null)
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
  with recursive tree as (
    select d.id from public.decks d where d.code = p_deck_code
    union all
    select c.id from tree t join public.decks c on c.parent_id = t.id
  )
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
    and (
      p_deck_code is null
      or exists (
        select 1 from public.deck_items i join tree t on t.id = i.deck_id
        where i.vocabulary_id = v.id
      )
    )
  order by r.due_at
  limit p_limit;
$$;

revoke execute on function public.flashcard_decks() from public, anon;
revoke execute on function public.due_flashcards(integer, text) from public, anon;
grant execute on function public.flashcard_decks() to authenticated;
grant execute on function public.due_flashcards(integer, text) to authenticated;
