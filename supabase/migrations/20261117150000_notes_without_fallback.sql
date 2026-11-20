-- A word's tip shows only in the learner's own language. An English tip on a German screen reads
-- as a mistake, so a word without a tip in the learner's language shows none. Its meaning still
-- falls back to English, as a card needs one.
create or replace function public.vocabulary_text(p_vocabulary_id uuid)
returns table (meaning text, notes text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(learner.meaning, english.meaning),
    learner.notes
  from (select 1) as one
  left join public.vocabulary_translations learner
    on learner.vocabulary_id = p_vocabulary_id and learner.locale = public.learner_locale()
  left join public.vocabulary_translations english
    on english.vocabulary_id = p_vocabulary_id and english.locale = 'en';
$$;
