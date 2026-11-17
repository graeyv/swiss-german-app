-- Other ways of saying the same word in a dialect, such as Salü and Hallo beside Tschou. A card
-- shows them in a line under its main form; learners recognise them rather than learn them apart.

alter table public.vocabulary_forms
  add column variants text[] not null default '{}';

-- The functions below return the variants too, so they're replaced.
drop function public.due_flashcards(integer, text, text[]);
drop function public.new_flashcards(text, integer, text[]);
drop function public.deck_words(text);
drop function public.vocabulary_form(uuid);

-- The form a learner sees: in their dialect, or before they've chosen one, the first by dialect.
create function public.vocabulary_form(p_vocabulary_id uuid)
returns table (swiss_german text, variants text[], audio_path text)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.swiss_german, f.variants, f.audio_path
  from public.vocabulary_forms f
  left join public.profiles p on p.id = (select auth.uid())
  where f.vocabulary_id = p_vocabulary_id
  order by (f.dialect_id = p.dialect_id) desc nulls last, f.dialect_id
  limit 1;
$$;

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
    c.id, c.kind, form.swiss_german, form.variants, v.high_german, text.meaning, text.notes,
    form.audio_path,
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
  left join lateral public.vocabulary_form(v.id) form on true
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

create function public.new_flashcards(
  p_deck_code text,
  p_limit integer,
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
  select
    f.id, f.kind, form.swiss_german, form.variants, v.high_german, text.meaning, text.notes,
    form.audio_path
  from fresh f
  left join public.vocabulary_items v on v.id = f.vocabulary_id
  left join lateral public.vocabulary_text(v.id) text on true
  left join lateral public.vocabulary_form(v.id) form on true
  order by f.path, f.position
  limit p_limit;
$$;

create function public.deck_words(p_deck_code text)
returns table (
  card_id uuid,
  type text,
  swiss_german text,
  variants text[],
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
  select
    w.id, v.type, form.swiss_german, form.variants, v.high_german, text.meaning, text.notes,
    w.state, w.due_at
  from words w
  join public.vocabulary_items v on v.id = w.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
  cross join lateral public.vocabulary_form(v.id) form
  order by w.path, w.position;
$$;

revoke execute on function public.vocabulary_form(uuid) from public, anon;
revoke execute on function public.due_flashcards(integer, text, text[]) from public, anon;
revoke execute on function public.new_flashcards(text, integer, text[]) from public, anon;
revoke execute on function public.deck_words(text) from public, anon;
grant execute on function public.vocabulary_form(uuid) to authenticated;
grant execute on function public.due_flashcards(integer, text, text[]) to authenticated;
grant execute on function public.new_flashcards(text, integer, text[]) to authenticated;
grant execute on function public.deck_words(text) to authenticated;
