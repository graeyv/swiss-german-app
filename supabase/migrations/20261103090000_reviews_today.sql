-- The flashcards tab shows today's review progress, which counts every review except a new
-- word's first showing. reviewed_today keeps counting only words the learner already knew,
-- because that is what the daily review limit applies to.
drop function public.flashcard_summary();

create function public.flashcard_summary()
returns table (
  due_learning_count integer,
  due_review_count integer,
  introduced_today integer,
  reviewed_today integer,
  reviews_today integer
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
    (select count(*)::integer from today where not introduced and state = 2),
    (select count(*)::integer from today where not introduced);
$$;

revoke execute on function public.flashcard_summary() from public, anon;
grant execute on function public.flashcard_summary() to authenticated;
