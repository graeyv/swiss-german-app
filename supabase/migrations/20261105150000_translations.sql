-- Content in any language: deck titles and descriptions, and the meaning and notes of each word,
-- move into translation tables with one row per language. A missing translation falls back to
-- English, so a new language can go live while its content is still being written.
--
-- Swiss German and the Standard German of each word stay on the word itself: they are the
-- content, not a translation. German learners see that Standard German as the meaning, so they
-- need no German meanings here (see translationIsStandardGerman in src/lib/i18n).

create table public.deck_translations (
  deck_id uuid not null references public.decks (id) on delete cascade,
  locale text not null references public.locales (code),
  title text not null,
  description text,
  primary key (deck_id, locale)
);

create table public.vocabulary_translations (
  vocabulary_id uuid not null references public.vocabulary_items (id) on delete cascade,
  locale text not null references public.locales (code),
  -- Either can be missing in a language and falls back to English.
  meaning text,
  notes text,
  primary key (vocabulary_id, locale),
  check (meaning is not null or notes is not null)
);

insert into public.deck_translations (deck_id, locale, title, description)
select id, 'en', title, description from public.decks;

insert into public.vocabulary_translations (vocabulary_id, locale, meaning, notes)
select id, 'en', english, notes from public.vocabulary_items;

alter table public.deck_translations enable row level security;
alter table public.vocabulary_translations enable row level security;

create policy "Deck translations are public" on public.deck_translations
  for select to anon, authenticated using (true);
create policy "Vocabulary translations are public" on public.vocabulary_translations
  for select to anon, authenticated using (true);

grant select on public.deck_translations, public.vocabulary_translations to anon, authenticated;

-- The functions below return these columns under new names, so they're replaced.
drop function public.flashcard_decks();
drop function public.due_flashcards(integer, text);
drop function public.new_flashcards(text, integer);
drop function public.deck_words(text);

alter table public.decks drop column title, drop column description;
alter table public.vocabulary_items drop column english, drop column notes;

-- The learner's language, or English before they have a profile.
create function public.learner_locale()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select p.locale from public.profiles p where p.id = (select auth.uid())),
    'en'
  );
$$;

-- A deck's title and description in the learner's language, each falling back to English.
create function public.deck_text(p_deck_id uuid)
returns table (title text, description text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(learner.title, english.title),
    coalesce(learner.description, english.description)
  from (select 1) as one
  left join public.deck_translations learner
    on learner.deck_id = p_deck_id and learner.locale = public.learner_locale()
  left join public.deck_translations english
    on english.deck_id = p_deck_id and english.locale = 'en';
$$;

-- A word's meaning and notes in the learner's language, each falling back to English.
create function public.vocabulary_text(p_vocabulary_id uuid)
returns table (meaning text, notes text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(learner.meaning, english.meaning),
    coalesce(learner.notes, english.notes)
  from (select 1) as one
  left join public.vocabulary_translations learner
    on learner.vocabulary_id = p_vocabulary_id and learner.locale = public.learner_locale()
  left join public.vocabulary_translations english
    on english.vocabulary_id = p_vocabulary_id and english.locale = 'en';
$$;

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
  ),
  counts as (
    select
      d.id,
      (count(w.vocabulary_id))::integer as card_count,
      (count(w.vocabulary_id) filter (where w.due_at <= now()))::integer as due_count,
      (count(w.vocabulary_id) filter (where w.due_at <= now() and w.state = 2))::integer
        as due_review_count,
      (count(w.vocabulary_id) filter (where w.is_new))::integer as new_count
    from public.decks d
    left join words w on w.root_id = d.id
    group by d.id
  )
  select
    d.id, d.parent_id, d.code, text.title, d.emoji, text.description, d.color, d.position,
    c.card_count, c.due_count, c.due_review_count, c.new_count
  from public.decks d
  join counts c on c.id = d.id
  cross join lateral public.deck_text(d.id) text;
$$;

-- Due cards, most overdue first. With a deck code, only words in that deck or below it.
create function public.due_flashcards(p_limit integer, p_deck_code text default null)
returns table (
  vocabulary_id uuid,
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
    v.id, v.swiss_german, v.high_german, text.meaning, text.notes, v.audio_path,
    r.state, r.schedule_status, r.stability, r.difficulty, r.due_at, r.last_review_at,
    r.reps, r.lapses, r.learning_step, r.scheduled_days
  from public.review_items r
  join public.vocabulary_items v on v.id = r.vocabulary_id
  cross join lateral public.vocabulary_text(v.id) text
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

-- Words the learner hasn't met, in deck order, from a deck and all levels below it.
create function public.new_flashcards(p_deck_code text, p_limit integer)
returns table (
  vocabulary_id uuid,
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
  words as (
    select distinct on (v.id)
      v.id, v.swiss_german, v.high_german, v.audio_path, t.path, i.position
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
  select w.id, w.swiss_german, w.high_german, text.meaning, text.notes, w.audio_path
  from words w
  cross join lateral public.vocabulary_text(w.id) text
  order by w.path, w.position
  limit p_limit;
$$;

-- The words of a deck and everything below it, in deck order, with the learner's progress on
-- each. state and due_at are null for words the learner hasn't met.
create function public.deck_words(p_deck_code text)
returns table (
  vocabulary_id uuid,
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
    select distinct on (v.id)
      v.id, v.swiss_german, v.high_german, r.state, r.due_at, t.path, i.position
    from tree t
    join public.deck_items i on i.deck_id = t.id
    join public.vocabulary_items v on v.id = i.vocabulary_id
    left join public.review_items r on r.vocabulary_id = v.id
    where (select p.dialect_id from public.profiles p where p.id = (select auth.uid())) is null
      or v.dialect_id = (select p.dialect_id from public.profiles p where p.id = (select auth.uid()))
    order by v.id, t.path, i.position
  )
  select w.id, w.swiss_german, w.high_german, text.meaning, text.notes, w.state, w.due_at
  from words w
  cross join lateral public.vocabulary_text(w.id) text
  order by w.path, w.position;
$$;

revoke execute on function public.learner_locale() from public;
revoke execute on function public.deck_text(uuid) from public;
revoke execute on function public.vocabulary_text(uuid) from public;
revoke execute on function public.flashcard_decks() from public, anon;
revoke execute on function public.due_flashcards(integer, text) from public, anon;
revoke execute on function public.new_flashcards(text, integer) from public, anon;
revoke execute on function public.deck_words(text) from public, anon;
grant execute on function public.learner_locale() to anon, authenticated;
grant execute on function public.deck_text(uuid) to anon, authenticated;
grant execute on function public.vocabulary_text(uuid) to anon, authenticated;
grant execute on function public.flashcard_decks() to authenticated;
grant execute on function public.due_flashcards(integer, text) to authenticated;
grant execute on function public.new_flashcards(text, integer) to authenticated;
grant execute on function public.deck_words(text) to authenticated;
