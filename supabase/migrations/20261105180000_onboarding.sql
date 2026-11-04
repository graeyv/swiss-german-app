-- What learners tell us when they start: how well they know Swiss German, and which topics
-- interest them. onboarded_at is set once they finish or skip it, so it's only shown once.
alter table public.profiles
  add column swiss_german_level text
    check (swiss_german_level in ('new', 'few_words', 'understands', 'speaks')),
  -- Codes of top-level decks, shown first on the flashcards screen.
  add column interests text[] not null default '{}',
  add column onboarded_at timestamptz;
