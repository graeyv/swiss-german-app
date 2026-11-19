# Hoi

A Babbel-style web app for learning Swiss German, built with Next.js and Supabase.

## Setup

Docker isn't required: these steps use a hosted Supabase project.

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. In the dashboard, go to **Authentication > URL Configuration** and add
   `http://localhost:3000/auth/callback` to the redirect URLs.
4. Install, link the project, and create the tables:

   ```sh
   npm install
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:push
   ```

5. Run `npm run dev` and open <http://localhost:3000>.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/proxy.ts` | Refreshes the session and protects the pages that need an account |
| `src/app/(tabs)` | Learn, Practice, Conversations and Profile tabs: a bar along the bottom on phones, tabs under the header on wider screens |
| `src/app/onboarding` | First-run questions: language, Swiss German level, topics and pace |
| `src/app/flashcards` | Full-screen review sessions and saving reviews |
| `src/app/exercises` | Exercise components for the lessons' rounds: pick, build, spot the error, and the pronunciation ones |
| `src/lib/exercises` | The shape of each exercise and how its answer is checked |
| `src/lib/flashcards` | FSRS scheduling, sessions, daily limits, the deck tree, and loading it all (`data.ts`) |
| `src/lib/supabase/database.types.ts` | Database types, generated with `npm run db:types` |
| `src/lib/types.ts` | Flashcard types |
| `src/lib/i18n` | Every interface text in English (`en.ts`) and Swiss Standard German (`de.ts`) |
| `content` | Flashcard decks and cards, as tab-separated files, and Learn lessons as JSON |
| `src/lib/learn` | The shape of a Learn lesson, the list of lessons, what's read and what the Practice tab suggests |
| `supabase/migrations` | Database schema and access policies |
| `supabase/seed.sql` | The dialects |
| `supabase/seeds/flashcards.sql` | Generated from `content` |

## Adding content

Content belongs to a dialect, because Swiss German has no standard form. Clients can't write
content. Only migrations, the seed files and the service role can.

### Learn lessons

Each lesson is a JSON file in `content/lessons/<dialect>/`, in the shape of `Lesson` in
`src/lib/learn/lessons.ts`. Add a new file to `LESSONS` there. The type check flags a file that
doesn't fit the shape. A lesson has sections, each section has rules, and each rule has examples
that compare a word's Standard German and dialect pronunciation, with a recording of each.

#### Exercises

A rule can have `exercises`, and so can a section, for exercises on the section as a whole. They're
practised together at the end of their section, in a round of up to two per rule and then the
section's own, from the section's last topic or from Practice › Lektionen. A module can also have a
`mixed` round, `{"title", "exercises"}`, over all its sections: its round is
`/learn/<dialect>/<module>/mixed/practice`, listed last among the module's exercises, and suggested
once every section is read; the end of the module's last topic leads to it. Aussprache has only
this round, titled after the module, since its words mix consonants and vowels. Its
`"accent": true` names the examples' side "Berner Akzent": they're Standard German words said with
the accent. A module with a
single round opens it straight from the Practice tab. Learners practise whenever they like: there's no schedule, and each
round's result is saved (`lesson_rounds`) for the Practice tab to suggest what to refresh. Every
exercise counts towards it. Practising only the mistakes afterwards saves the whole round's new
result, so fixed mistakes count. A section without exercises has no round, and a module without any
doesn't lead to them.

Each exercise has an `id`, unique in its lesson file, a `type`, and the task's fields from
`src/lib/exercises/tasks.ts`:

- `pick`: `{"context"?, "prompt", "options", "answer"}`. `answer` is the position of the right
  option, counting from 0, and each `___` in the prompt shows as a gap.
- `build`: `{"prompt", "tiles", "answer"}`. `answer` lists the words in order, and the other tiles
  are distractors.
- `spot_error`: `{"context"?, "sentence", "wrong", "options", "answer"}`. `wrong` lists the
  positions of the wrong words in the sentence, counting from 0.

The pronunciation exercises, in `src/lib/exercises/pronunciation.ts`, write a High German word as
usual, with the letters that sound different in square brackets: `"[Ch]a[r]a[k]te[r]"`. Each
bracketed group needs a rule of the module whose title names it (`k` and `ck` belong to "K und CK",
`pp` to "T und P"), for the rule the exercise leads to. Recordings are paths in `public/`, or `null`
until they're recorded; until then their play buttons say "Aufnahme folgt".

- `letters`: `{"word", "audio"?: {"standardGerman", "dialect"}}`. The learner taps the bracketed
  letters. Every word needs at least one.
- `say`: `{"word", "audio"?}`. The learner records the word, then hears it and judges whether it
  sounded the same. A tip underlines the bracketed letters, and after recording they stay
  underlined.
- `repeat`: `{"sentence", "audio"?}`. The learner hears the sentence, records it and judges it.
  Its letters to watch can be bracketed too, and a tip underlines them, as for `say`.

Learners can record themselves as often as they like. Saying counts as right when they say it
sounded the same. Their recordings stay in the browser.

`npm test` checks every exercise (`src/lib/learn/lessons.test.ts`), so a typo fails there instead
of breaking a round.

### Conversations

Topics and their situations are in `content/conversations/topics.json`, in the shape of `Topic` in
`src/lib/conversations.ts`. Each situation is one dialogue with a single recording:

- Each line has a `start`: the second in the recording where it begins. A line ends where the
  next one starts. Lines with a start can be tapped to replay them and are highlighted while
  they're spoken. Until a situation has a recording, `audio` is `null` and the transcript shows
  straight away.
- To add a recording, set a label in Audacity at the start of each line, named after its speaker,
  and export them (*File › Export Other › Export Labels*). Then run
  `npm run conversations:times -- <situation> <labels.txt> <recording.mp3>`. It checks that the
  labels match the lines and their speakers, copies the recording to
  `public/audio/conversations/<dialect>/<situation>.mp3` and writes the times and `audio`.
- `title` and `scene` take a text per interface language, with English required. Each line has
  its Swiss German, Standard German and English.
- `color` is one of the deck colours: pink, blue, green, yellow, purple or orange.

### Flashcards

Edit `content/decks.tsv` and `content/cards.tsv`, then run `npm run db:content`. It checks the files,
regenerates `supabase/seeds/flashcards.sql` and applies it to the linked project.

- **Decks** form a tree through `parent_code`, to any depth. Only the lowest level holds cards.
  Decks without cards stay hidden.
- **Deck cards** show `emoji`, a description and `color` (pink, blue, green, yellow, purple or
  orange). A deck without a colour takes its parent's, and one without a description shows its
  word count instead.
- **Translated columns** end in a language code: `title_en` and `description_en` for decks,
  `meaning_en` and `notes_en` for cards. English is required. Other languages are optional, column
  by column (`title_de`, `notes_fr`, …), and fall back to English where they're empty, except a
  card's notes: a learner only sees notes in their own language, so a card without `notes_de`
  shows German learners none. German learners see each card's `high_german` as its meaning, so
  cards need no `meaning_de`.
- **Cards** can sit in several decks: separate `deck_codes` with commas. Learners' progress belongs
  to the word, so a shared word is only learned once.
- **Codes are permanent.** A card's `code` is what keeps learners' history, so fix a spelling by
  editing the row, not by adding a new code.
- `audio_path` is an object path in the `lesson-audio` bucket.
- **Type**: a card is a `word` (the default when empty), a `sentence` or an `expression`. A topic
  with words as well as sentences or expressions lets learners practise and list them apart.
- **Drafts**: `draft` set to `yes` keeps a deck and everything below it hidden from learners.

Scheduling uses FSRS-6 through `ts-fsrs`, which needs Node 24 or later.

## Testing your own progress

Put your account's email in `.env.local` as `DEV_EMAIL=you@example.com`. It isn't committed.

```sh
npm run next-day                         # your account, one day later
npm run next-day -- 3                    # three days later
npm run next-day -- 0.01                 # about 15 minutes, to skip a learning step
npm run next-day -- 1 someone@example.com  # another account
npm run dev:reset-progress -- you@example.com  # forget an account's flashcard progress
```

`next-day` moves everything the account did into the past: reviews, topics read, lesson rounds
and a lifted limit. Cards fall due and today's goal starts over, as if the time had passed.

## Database changes

```sh
npx supabase migration new <name>   # then edit the new file
npm run db:push
npm run db:types                    # regenerate the database types
```

The type check then flags code that uses a renamed table, column or function. It doesn't catch a
misspelled argument name in `supabase.rpc(...)` calls. The generated types also mark every column
a database function returns as never empty, so read function results into the row types in
`src/lib/flashcards`, which say which columns can be empty.
