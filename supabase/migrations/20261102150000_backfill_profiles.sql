-- Users who signed up before the profile trigger existed have no profile, so their settings
-- could not be saved. Create the missing ones.
insert into public.profiles (id, display_name)
select u.id, u.raw_user_meta_data ->> 'display_name'
from auth.users u
on conflict (id) do nothing;
