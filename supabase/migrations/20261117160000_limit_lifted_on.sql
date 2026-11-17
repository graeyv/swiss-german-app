-- The day the learner lifted the limit of new cards, on Zürich time like the daily goal. On that day
-- they can learn as many new cards as they like. The next day the limit applies again.
alter table public.profiles
  add column limit_lifted_on date;
