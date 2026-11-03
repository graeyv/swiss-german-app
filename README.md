# Grüezi

A Babbel-style web app for learning Swiss German, built with Next.js and Supabase.

## Setup

Docker isn't required: these steps use a hosted Supabase project.

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. In the dashboard, go to **Authentication > URL Configuration** and add
   `http://localhost:3000/auth/callback` to the redirect URLs.
4. Install, link the project, and create the tables and starter lessons:

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
| `src/proxy.ts` | Refreshes the session and protects `/learn`, `/lessons` and `/flashcards` |
| `src/app/(tabs)` | Lessons and Flashcards tabs, with their shared header |
| `src/app/lessons/[slug]` | Lesson player |
| `src/app/flashcards` | Full-screen review sessions and saving reviews |
| `src/lib/flashcards` | FSRS scheduling, sessions, daily limits, the deck tree, and loading it all (`data.ts`) |
| `src/lib/supabase/database.types.ts` | Database types, generated with `npm run db:types` |
| `src/lib/types.ts` | Exercise payload and flashcard types |
| `src/lib/i18n` | Every interface text in English (`en.ts`) and Swiss Standard German (`de.ts`) |
| `content` | Flashcard decks and cards, as tab-separated files |
| `supabase/migrations` | Database schema and access policies |
| `supabase/seed.sql` | Starter course in Zürich German |
| `supabase/seeds/flashcards.sql` | Generated from `content` |

## Adding content

Content belongs to a dialect, because Swiss German has no standard form. Add lessons in
`supabase/seed.sql`, or in a new migration, then run `npm run db:push`. Exercises come in three
types: `vocab_card`, `multiple_choice` and `word_order`. Their payloads are described in
`src/lib/types.ts`.

Clients can't write course content. Only migrations, the seed files and the service role can.

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
- `audio_path` is an object path in the `lesson-audio` bucket. The `type` column isn't used by the
  app yet.

Scheduling uses FSRS-6 through `ts-fsrs`, which needs Node 24 or later.

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
