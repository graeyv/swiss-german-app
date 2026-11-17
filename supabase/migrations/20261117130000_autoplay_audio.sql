-- Whether a word card's recording plays by itself as soon as its Swiss German shows, or only when
-- the learner taps the speaker. On by default: hearing the word is what the recordings are for.
alter table public.profiles
  add column autoplay_audio boolean not null default true;
