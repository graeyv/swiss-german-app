-- Whether the learner has seen the one-time tip on the rating buttons (Nochmals, Schwer, Gut,
-- Einfach). It shows on the first card they turn over and counts as seen once they rate it.
alter table public.profiles
  add column rating_tip_seen boolean not null default false;
