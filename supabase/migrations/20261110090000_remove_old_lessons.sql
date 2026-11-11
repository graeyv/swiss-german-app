-- The first lessons were vocabulary drills with their own exercises. Learn now explains how Swiss
-- German differs from Standard German, with lessons kept as content files in the repository, so the
-- old lesson tables go. Their words that no deck uses go with them.
drop function public.complete_lesson(uuid, integer);

drop table public.lesson_progress;
drop table public.exercises;
drop table public.lessons;
drop table public.courses;

drop type public.exercise_type;

-- Words only the old lessons taught, coded L0001 and up. Deleting them also deletes their cards
-- and anyone's progress on them.
delete from public.vocabulary_items v
where v.code like 'L%'
  and not exists (
    select 1 from public.deck_items d join public.cards c on c.id = d.card_id
    where c.vocabulary_id = v.id
  );
