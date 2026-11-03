-- Which side of a flashcard learners see first, for all decks. Both directions share one FSRS
-- schedule per word.
alter table public.profiles
  add column card_front text not null default 'swiss_german'
    check (card_front in ('swiss_german', 'english'));
