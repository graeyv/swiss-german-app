-- Vocabulary holds sentences and expressions as well as single words, so learners can practise
-- them apart: words only, sentences and expressions only, or everything mixed. Every existing
-- item is a word until the content says otherwise.
--
-- The app before this change keeps working with it: the functions only gain columns it ignores,
-- and arguments it can leave out.

alter table public.vocabulary_items
  add column type text not null default 'word'
  check (type in ('word', 'sentence', 'expression'));

-- These return new columns, or take new arguments, so they're replaced.
drop function public.flashcard_decks();
drop function public.due_flashcards(integer, text);
drop function public.new_flashcards(text, integer);
drop function public.deck_words(text);

-- Every deck with its kind and counts. Counts include all levels below a deck, and a card that
-- sits in two topics counts once. phrase_count is the part of card_count that are sentences or
-- expressions, so a topic only offers to practise them apart when it has both.
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
  phrase_count integer,
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
    select distinct
      t.root_id, c.id as card_id, v.type, r.due_at, r.state, r.card_id is null as is_new
    from tree t
    join public.deck_items i on i.deck_id = t.deck_id
    join public.learner_cards() c on c.id = i.card_id
    left join public.vocabulary_items v on v.id = c.vocabulary_id
    left join public.review_items r on r.card_id = c.id
  ),
  counts as (
    select
      d.id,
      (count(w.card_id))::integer as card_count,
      (count(w.card_id) filter (where w.type in ('sentence', 'expression')))::integer
        as phrase_count,
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
    d.position, c.card_count, c.phrase_count, c.due_count, c.due_review_count, c.new_count
  from public.decks d
  join counts c on c.id = d.id
  cross join lateral public.deck_text(d.id) text;
$$;

-- Due cards, most overdue first. With a deck code, only cards in that deck or below it, and with
-- types, only vocabulary of those types. The word columns are null for grammar cards, whose
-- content comes from grammar_content. last_exercise_id is the exercise a grammar card showed
-- last, so the next one can differ.
create function public.due_flashcards(
  p_limit integer,
  p_deck_code text default null,
  p_types text[] default null
)
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

-- Cards the learner hasn't met, in deck order, from a deck and all levels below it, and with
-- types, only vocabulary of those types. The word columns are null for grammar cards, whose
-- content comes from grammar_content.
create function public.new_flashcards(
  p_deck_code text,
  p_limit integer,
  p_types text[] default null
)
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
    left join public.vocabulary_items v on v.id = c.vocabulary_id
    where not exists (select 1 from public.review_items r where r.card_id = c.id)
      and (p_types is null or v.type = any (p_types))
    order by c.id, t.path, i.position
  )
  select f.id, f.kind, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path
  from fresh f
  left join public.vocabulary_items v on v.id = f.vocabulary_id
  left join lateral public.vocabulary_text(v.id) text on true
  order by f.path, f.position
  limit p_limit;
$$;

-- The words, sentences and expressions of a deck and all levels below it, in deck order, with
-- the learner's progress on each.
create function public.deck_words(p_deck_code text)
returns table (
  card_id uuid,
  type text,
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
  select w.id, v.type, v.swiss_german, v.high_german, text.meaning, text.notes, w.state, w.due_at
  from words w
  join public.vocabulary_items v on v.id = w.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
  order by w.path, w.position;
$$;

revoke execute on function public.flashcard_decks() from public, anon;
revoke execute on function public.due_flashcards(integer, text, text[]) from public, anon;
revoke execute on function public.new_flashcards(text, integer, text[]) from public, anon;
revoke execute on function public.deck_words(text) from public, anon;
grant execute on function public.flashcard_decks() to authenticated;
grant execute on function public.due_flashcards(integer, text, text[]) to authenticated;
grant execute on function public.new_flashcards(text, integer, text[]) to authenticated;
grant execute on function public.deck_words(text) to authenticated;
