-- The dialects content belongs to. Flashcards are loaded from content/ with npm run db:content.
-- Safe to run more than once.

insert into public.dialects (id, name) values
  ('zh', 'Züritüütsch (Zürich)'),
  ('be', 'Bärndütsch (Bern)')
on conflict (id) do nothing;
