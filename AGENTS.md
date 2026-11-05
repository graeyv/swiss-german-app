<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mobile first

Most learners use Hoi on their phone. Design and check every screen at phone width first.

- Tap targets are at least 44×44 px, and the main actions of a session sit within thumb reach at
  the bottom of the screen.
- Form inputs use at least 16 px text, or iOS zooms in when they get focus.
- Don't rely on hover: anything shown on hover must also work on tap.
- Keep pages light and expect slow mobile connections: show progress while saving, and don't make
  learners wait on the network between cards when it can be avoided.
- Account for the browser's changing toolbar height (`dvh` rather than `vh`) and the iPhone home
  indicator (`env(safe-area-inset-bottom)`) on full-screen views.
