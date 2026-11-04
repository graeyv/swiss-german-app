-- The app's language, English or (Swiss Standard) German, for each learner. It also decides
-- the translation flashcards show: English, or the High German on each card.
alter table public.profiles
  add column locale text not null default 'en' check (locale in ('en', 'de'));

-- The card side that isn't Swiss German is now the translation in the learner's language.
alter table public.profiles drop constraint profiles_card_front_check;
update public.profiles set card_front = 'translation' where card_front = 'english';
alter table public.profiles
  add constraint profiles_card_front_check check (card_front in ('swiss_german', 'translation'));

-- New accounts take the language they signed up in, passed as user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    case when new.raw_user_meta_data ->> 'locale' = 'de' then 'de' else 'en' end
  );
  return new;
end;
$$;
