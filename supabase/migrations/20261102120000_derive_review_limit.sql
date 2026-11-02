-- The review limit is no longer a setting. The app derives it from new cards per day.
alter table public.profiles drop column max_reviews_per_day;
