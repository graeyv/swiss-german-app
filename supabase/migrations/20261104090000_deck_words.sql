-- The words of a deck and everything below it, in deck order, with the learner's progress on
-- each. state and due_at are null for words the learner hasn't met.
create function public.deck_words(p_deck_code text)
returns table (
  vocabulary_id uuid,
  swiss_german text,
  high_german text,
  english text,
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
    select distinct on (v.id)
      v.id, v.swiss_german, v.high_german, v.english, v.notes, r.state, r.due_at,
      t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.vocabulary_items v on v.id = i.vocabulary_id
    left join public.review_items r on r.vocabulary_id = v.id
    where (select p.dialect_id from public.profiles p where p.id = (select auth.uid())) is null
      or v.dialect_id = (select p.dialect_id from public.profiles p where p.id = (select auth.uid()))
    order by v.id, t.path, i.position
  )
  select w.id, w.swiss_german, w.high_german, w.english, w.notes, w.state, w.due_at
  from words w
  order by w.path, w.position;
$$;

revoke execute on function public.deck_words(text) from public, anon;
grant execute on function public.deck_words(text) to authenticated;
