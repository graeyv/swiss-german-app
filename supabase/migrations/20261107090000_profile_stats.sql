-- The learner's progress for their profile: their streak, and how many words and grammar rules
-- they've learned.
create function public.profile_stats()
returns table (
  -- Days in a row with at least one review, up to today, or up to yesterday while today has
  -- none yet. Days run on Zürich time, like the daily goal.
  streak integer,
  -- Cards past their first learning steps, even if forgotten since and being relearned.
  words_learned integer,
  rules_learned integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select distinct (l.reviewed_at at time zone 'Europe/Zurich')::date as day
    from public.review_log l
    where l.user_id = (select auth.uid())
  ),
  latest as (
    select max(day) as day from days
  ),
  -- Counting back from the latest day, a day belongs to the streak while none is missing. The
  -- first gap ends it, because every day after it is further back than its place in the list.
  numbered as (
    select day, row_number() over (order by day desc) as place from days
  ),
  learned as (
    select c.kind, count(*)::integer as count
    from public.review_items r
    join public.cards c on c.id = r.card_id
    where r.state in (2, 3)
    group by c.kind
  )
  select
    (
      select count(*)::integer
      from numbered n, latest
      where latest.day >= (now() at time zone 'Europe/Zurich')::date - 1
        and n.day = latest.day - (n.place - 1)::integer
    ),
    coalesce((select count from learned where kind = 'vocabulary'), 0),
    coalesce((select count from learned where kind = 'grammar'), 0);
$$;

revoke execute on function public.profile_stats() from public, anon;
grant execute on function public.profile_stats() to authenticated;
