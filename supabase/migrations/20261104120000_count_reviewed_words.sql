-- Today's review progress counts words, not answers. A review is a word learned before today,
-- counted once however often it comes back. Repeats of today's new words in their learning
-- steps are part of learning them, so they count toward neither the reviews done nor the total.
drop function public.flashcard_summary();

create function public.flashcard_summary()
returns table (
  due_learning_count integer,
  -- The part of due_learning_count that are words learned before today.
  due_learning_known_count integer,
  due_review_count integer,
  introduced_today integer,
  -- Answers on words the learner already knew, which the daily review limit counts.
  reviewed_today integer,
  -- Words learned before today that were reviewed today, each counted once.
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
  today as (
    select l.vocabulary_id, l.introduced, l.state
    from public.review_log l
    where l.reviewed_at >= date_trunc('day', now() at time zone 'Europe/Zurich')
      at time zone 'Europe/Zurich'
  ),
  introduced_today as (
    select distinct vocabulary_id from today where introduced
  ),
  due as (
    select r.state, r.vocabulary_id in (select vocabulary_id from introduced_today) as new_today
    from public.review_items r
    join public.vocabulary_items v on v.id = r.vocabulary_id
    where r.due_at <= now()
      and (
        (select l.dialect_id from learner l) is null
        or v.dialect_id = (select l.dialect_id from learner l)
      )
  )
  select
    (select count(*)::integer from due where state <> 2),
    (select count(*)::integer from due where state <> 2 and not new_today),
    (select count(*)::integer from due where state = 2),
    (select count(*)::integer from introduced_today),
    (select count(*)::integer from today where not introduced and state = 2),
    (
      select count(distinct vocabulary_id)::integer
      from today
      where not introduced
        and vocabulary_id not in (select vocabulary_id from introduced_today)
    );
$$;

revoke execute on function public.flashcard_summary() from public, anon;
grant execute on function public.flashcard_summary() to authenticated;
