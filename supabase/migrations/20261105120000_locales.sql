-- The app's languages, in one list. A new language is a new row here (plus its interface texts
-- in src/lib/i18n), instead of a change to every check that names the languages.
create table public.locales (
  code text primary key,
  -- The language's name in that language, as shown in the language picker.
  name text not null
);

insert into public.locales (code, name) values
  ('en', 'English'),
  ('de', 'Deutsch');

alter table public.locales enable row level security;

create policy "Languages are public" on public.locales
  for select to anon, authenticated using (true);

grant select on public.locales to anon, authenticated;

alter table public.profiles
  drop constraint profiles_locale_check,
  add constraint profiles_locale_fkey foreign key (locale) references public.locales (code);

-- New accounts take the language they signed up in, if the app has it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    case
      when exists (select 1 from public.locales where code = v_locale) then v_locale
      else 'en'
    end
  );
  return new;
end;
$$;
