-- Decks are shown as cards with an emoji, a short description and a colour. A topic without a
-- colour takes its parent's.
alter table public.decks
  add column emoji text,
  add column description text,
  add column color text check (color in ('pink', 'blue', 'green', 'yellow', 'purple', 'orange'));

-- The return type changes, so the function is replaced rather than altered.
drop function public.flashcard_decks();

-- Every deck with its counts. Counts include all levels below a deck, and a word that sits in
-- two topics counts once. Without a chosen dialect, the learner sees every dialect.
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
    d.emoji,
    d.description,
    d.color,
    d.position,
    (count(w.vocabulary_id))::integer,
    (count(w.vocabulary_id) filter (where w.due_at <= now()))::integer,
    (count(w.vocabulary_id) filter (where w.is_new))::integer
  from public.decks d
  left join words w on w.root_id = d.id
  group by d.id;
$$;

revoke execute on function public.flashcard_decks() from public, anon;
grant execute on function public.flashcard_decks() to authenticated;
