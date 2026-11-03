-- Each learner's daily plan: how many new words to take on, and how many reviews of words
-- they already know. A null review limit means no limit.
alter table public.profiles
  add column new_cards_per_day smallint not null default 10
    check (new_cards_per_day between 0 and 50),
  add column max_reviews_per_day smallint default 100
    check (max_reviews_per_day between 20 and 500);

-- The return type changes, so the function is replaced rather than altered.
drop function public.flashcard_summary();

-- Due cards are split in two: the daily review limit applies only to words the learner already
-- knows. Words still in their learning steps always stay due, so a session never stops halfway
-- through one. Today runs on Zürich time for now, because learners can't set a time zone yet.
create function public.flashcard_summary()
returns table (
  due_learning_count integer,
  due_review_count integer,
  introduced_today integer,
  reviewed_today integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with learner as (
    select p.dialect_id from public.profiles p where p.id = (select auth.uid())
  ),
  due as (
    select r.state
    from public.review_items r
    join public.vocabulary_items v on v.id = r.vocabulary_id
    where r.due_at <= now()
      and (
        (select l.dialect_id from learner l) is null
        or v.dialect_id = (select l.dialect_id from learner l)
      )
  ),
  today as (
    select l.introduced, l.state
    from public.review_log l
    where l.reviewed_at >= date_trunc('day', now() at time zone 'Europe/Zurich')
      at time zone 'Europe/Zurich'
  )
  select
    (select count(*)::integer from due where state <> 2),
    (select count(*)::integer from due where state = 2),
    (select count(*)::integer from today where introduced),
    (select count(*)::integer from today where not introduced and state = 2);
$$;

revoke execute on function public.flashcard_summary() from public, anon;
grant execute on function public.flashcard_summary() to authenticated;
