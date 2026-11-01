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
| `src/proxy.ts` | Refreshes the session and protects `/learn` and `/lessons` |
| `src/app/learn` | Course and lesson overview |
| `src/app/lessons/[slug]` | Lesson player |
| `src/lib/types.ts` | Exercise payload types |
| `supabase/migrations` | Database schema and access policies |
| `supabase/seed.sql` | Starter course in Zürich German |

## Adding content

Content belongs to a dialect, because Swiss German has no standard form. Add lessons in
`supabase/seed.sql`, or in a new migration, then run `npm run db:push`. Exercises come in three
types: `vocab_card`, `multiple_choice` and `word_order`. Their payloads are described in
`src/lib/types.ts`.

Clients can't write course content. Only migrations, the seed file and the service role can.

## Database changes

```sh
npx supabase migration new <name>   # then edit the new file
npm run db:push
```
