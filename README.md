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
| `src/app/exercises` | Exercise components for grammar flashcards: pick, build, spot the error |
| `src/lib/exercises` | The shape of each exercise and how its answer is checked |
| `src/lib/flashcards` | FSRS scheduling, sessions, daily limits, the deck tree, and loading it all (`data.ts`) |
| `src/lib/supabase/database.types.ts` | Database types, generated with `npm run db:types` |
| `src/lib/types.ts` | Flashcard types |
| `src/lib/i18n` | Every interface text in English (`en.ts`) and Swiss Standard German (`de.ts`) |
| `content` | Flashcard decks and cards, as tab-separated files, and Learn lessons as JSON |
| `src/lib/learn` | The shape of a Learn lesson, and the list of lessons |
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
  by column (`title_de`, `notes_fr`, …), and fall back to English where they're empty. German
  learners see each card's `high_german` as its meaning, so cards need no `meaning_de`.
- **Cards** can sit in several decks: separate `deck_codes` with commas. Learners' progress belongs
  to the word, so a shared word is only learned once.
- **Codes are permanent.** A card's `code` is what keeps learners' history, so fix a spelling by
  editing the row, not by adding a new code.
- `audio_path` is an object path in the `lesson-audio` bucket.
- **Type**: a card is a `word` (the default when empty), a `sentence` or an `expression`. A topic
  with words as well as sentences or expressions lets learners practise and list them apart.
- **Kind**: a deck holds words (`vocabulary`, the default) or grammar rules (`grammar`). Set `kind`
  on a top-level deck, and the decks below it take it.
- **Drafts**: `draft` set to `yes` keeps a deck and everything below it hidden from learners.

Scheduling uses FSRS-6 through `ts-fsrs`, which needs Node 24 or later.

#### Grammar

Each grammar rule is one card, with its own schedule. Every time it's due, the learner gets one of
its exercises, and the answer decides the rating. Learners find grammar decks under Flashcards ›
Grammar. A new rule counts toward the day's new cards, like a word. Rules go in `content/grammar_points.tsv` and their
exercises in `content/grammar_exercises.tsv`, and `npm run db:content` loads them too.

- **Grammar points** have a `code`, `deck_codes` (grammar decks only), `title_en` and
  `explanation_en`, translated like other columns. Keep each rule to one decision the learner has to
  make. Leave `dialect` empty for a rule of every dialect.
- **Exercises** belong to a `point` and have a `type`, a `level` and a `payload` in JSON. Level 1
  recognises the rule, 2 uses it with help, 3 uses it freely. Every rule needs a level 1 exercise,
  and about 6–10 exercises in all, so learners rarely see the same one twice. `dialect` says who
  sees the exercise. Leave it empty for every dialect.
- **Payloads** follow the tasks in `src/lib/exercises/tasks.ts`:
  - `pick`: `{"context"?, "prompt", "options", "answer"}`. `answer` is the position of the right
    option, counting from 0, and each `___` in the prompt shows as a gap.
  - `build`: `{"prompt", "tiles", "answer"}`. `answer` lists the words in order, and the other tiles
    are distractors.
  - `spot_error`: `{"context"?, "sentence", "wrong", "options", "answer"}`. `wrong` lists the
    positions of the wrong words in the sentence, counting from 0.
- **Text in the learner's language**, such as a context, a prompt to translate or an option that's a
  meaning, can be translations instead: `{"en": "To a friend", "de": "Zu einem Freund"}`.
- The build checks every payload, and an exercise removed from the file is deleted. A rule removed
  from the file stays in the database, so learners keep their history.

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
