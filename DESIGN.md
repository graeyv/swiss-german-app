# Hoi design guide

How Hoi looks, so every screen feels like the same app. Read this before changing any screen, and
add to it before inventing something new. Reference images are in `design/`:
`lektion1_aussprache_example.png` is the model screen (lesson overview), `color_palette.png` the
palette. Phone width first, as `AGENTS.md` says. Light mode only.

## Character

Calm, warm and clear. One strong colour (deep teal) on a lot of ivory, soft green to group things,
and a touch of yellow when something deserves attention. Generous space, large rounded shapes,
no decoration for its own sake.

## Colours

| Token    | Hex       | Role                        | Used for |
| -------- | --------- | --------------------------- | -------- |
| `teal`   | `#0F4C4A` | Brand and interaction       | All text, icons, arrows, primary buttons, anything interactive |
| `sage`   | `#A7C4A0` | Grouping content            | Content that should stand out as a group: the card being learned, category tiles, a correct answer |
| `mist`   | `#E6EFE9` | Separating structure        | List rows, everyday cards, secondary surfaces, inactive states, borders, progress tracks |
| `yellow` | `#FFE08A` | Attention, positive moments | Selected tab, the lesson subtitle's highlight, a rule's takeaway, achievements such as a reached daily goal |
| `ivory`  | `#FAF9F6` | Main background             | Screen background, the main neutral surface |

Order of weight: teal draws the eye, sage groups, mist separates, yellow marks the special
moment, ivory gives room.

Rules:

- Teal is the only colour for text and icons. Text on teal (the primary button) is ivory. The
  exceptions are `brick`, for mistakes and errors (see below), and `teal-soft` for an icon that
  leads a row or a list, so it doesn't compete with the bold title next to it.
- Sage and mist support. They never compete with teal as accents.
- Yellow stays rare: at most one yellow element per screen, besides the selected tab.
- No extra colours for single categories: decks, topics and lessons don't get their own colour.
  They are told apart by name, icon and position.
- Ivory dominates every screen.
- No dark mode.

Derived shades, defined once as tokens so nobody mixes their own:

| Token          | Hex       | Used for |
| -------------- | --------- | -------- |
| `teal-soft`    | `#3F6F6D` | Secondary text: eyebrows, captions such as "6 Themen", hints. Readable on ivory and mist. |
| `teal-pressed` | `#0B3B39` | Primary button while pressed |
| `sage-light`   | `#D1DFCB` | Half sage, half ivory: the "Gut" rating, between mist and sage |
| `rose`         | `#F6DED8` | Background of a wrong answer |
| `brick`        | `#A63D2F` | The cross on a wrong answer, error messages, destructive actions such as deleting the account |

Use solid tokens, never teal or another colour with opacity: opacity looks different on sage than
on ivory.

### Right and wrong

Learners should see at a glance whether they were right, without the screen turning loud.

- **Correct**: sage background, teal text, a teal check mark.
- **Wrong**: rose background, a brick cross, the learner's answer in teal. The right answer is
  shown next to it, marked as correct.
- **Errors** (a save that failed) and **destructive actions**: brick text. Never rose or brick for
  anything else.
- Yellow is for achievements, not single right answers: the daily goal, a finished session.

## Type

DM Sans (free, Open Font License), loaded with `next/font/google`. No other font.

| Style          | Size / weight      | Example in the model screen |
| -------------- | ------------------ | --------------------------- |
| Title          | 32 px, bold        | Aussprache |
| Eyebrow        | 14 px, semibold, uppercase, letter-spaced, `teal-soft` | MODUL 1 |
| Subtitle       | 20 px, semibold    | So klingt Berndeutsch, on a yellow highlight |
| Section header | 22 px, bold        | Was dich erwartet, Themen |
| Body           | 17 px, regular     | Entdecke die wichtigsten Unterschiede … |
| Row title      | 17 px, bold        | Konsonanten |
| Caption        | 14 px, regular, `teal-soft` | 6 Themen |
| Button         | 17 px, semibold    | Los geht's |

Form inputs stay at least 16 px (iOS zooms in otherwise).

## Shape and space

- Screen margin: 24 px left and right.
- Rows and cards: corner radius 24 px, padding about 16 px vertically and 24 px horizontally,
  12 px between rows. No border, no shadow: the background colour sets them off.
- Buttons: fully rounded (pill), at least 56 px high for the main action, full width.
- Space between sections: about 32 px. Space alone separates them: no divider lines.
- Icons: Phosphor Icons (MIT licence), in `src/app/ui/icons.tsx`, without a box around them.
  Symbols (a topic, a lesson, the tabs, the ratings, Merke) are Phosphor's **fill** style; signs
  (arrows, check mark, cross, clock) its **regular** line. 24–28 px, 16 px only beside a caption,
  such as the clock before a review time. An icon that leads a row or a list is `teal-soft`; on
  sage it stays teal, where `teal-soft` is too faint. Add new ones from the same set.
- Tap targets at least 44 × 44 px, also for small icons such as the back arrow.

## Building blocks

These are the parts of the model screen. Every screen is built from them, and new ones are added
here first. They live in `src/app/ui/` (`Button`, `ButtonLink`, `ListRow`, `Card`, `Pill`,
`Eyebrow`, `Highlight`, `Takeaway`, `ProgressBar`, `Icon`, `AnswerMark`, `Logo`, `TopicTile`, `TopicBanner`, `BottomSheet`), the type sizes are the `text-title`,
`text-heading`, `text-subtitle`, `text-body` and `text-caption` classes, and all of it can be seen
at `/dev/design`. In the app, the levels are Modul → Lektion → Thema (module → lesson →
topic in English); in the code and this guide they are lesson → section → rule.

- **Logo** (`Logo`): "hoi" in lowercase, bold and teal, in a sage-light speech bubble with its
  tail at the bottom left. At the top left of the tabs and on the welcome page. Never in another
  colour or without the bubble. The app icon and favicon are the same bubble on teal
  (`src/app/icon.png`, `apple-icon.png`, `public/icons/`).
- **Back button**: a teal arrow (←) at the top left, no text, no bar colour. It stays at the top
  while the page scrolls (`TopBar`).
- **Tab header** (Learn tab): the tab's name as title, below it one line in subtitle size and
  weight, full teal, saying what the tab is for. No marker.
- **Suggestion card**: a tab's one suggestion, at the top: a sage card with an eyebrow in teal (the
  softer teal is too faint on sage) saying why, such as "WEITERMACHEN · AUSSPRACHE", the title in
  heading size, one short line, and the primary button. It's an action, not one of the items
  below, so nothing in the list behaves differently. In Learn it continues with the next topic not
  read yet ("Konsonanten", "3 von 6 Themen gelesen", "Weiter: R"), or says "HIER BEGINNEN" and
  "Los geht's" before anything is read. It follows the topic read last, not the module looked at
  last.
- **Module list** (Learn tab): under "ALLE MODULE", every module in order as an equal list row with
  its icon, "MODUL N", title and "N Lektionen · N Themen". The module read in last says "Zuletzt
  gelesen" instead of its size. Modules still being written look the same. Every module has its
  own icon, never a colour.
- **Topic tile** (`TopicTile`, Flashcards and Conversations): the topics in a two-column grid, each
  a tile on mist with the topic's illustration across the top on `sage-light` (3:2), its title and
  caption below, and, in Flashcards, today's counts at the bottom. Conversations uses the
  flashcard topics without Building Blocks, so both show the same illustrations and titles. Titles
  are short enough for one line at iPhone width (about 133 px), such as "Freizeit". A topic with
  nothing in it yet is inactive: its picture on mist instead of `sage-light`, its title in
  `teal-soft`, and under the title, instead of its size, a small ivory pill with a clock and
  "Bald verfügbar" (12 px, on one line), so testers see it's not ready rather than broken. The pill
  is `ComingSoonPill`, and an empty subtopic or scene row shows it the same way: title in
  `teal-soft`, the pill in place of its caption, and no arrow.
- **Topic banner** (`TopicBanner`): the top of a topic's page, its illustration at 2:1, whole and
  centred on `sage-light` rather than cropped. Its title below in title size, then its subtopics
  or scenes as list rows. A subtopic or scene with nothing in it yet is an inactive row, with the
  "Bald verfügbar" pill and no arrow.
- **Lesson header**: eyebrow, title, subtitle on a hand-drawn yellow highlight, body text.
  The highlight is the screen's one yellow element, and it's only used here.
- **Icon list** ("Was dich erwartet"): a filled icon in `teal-soft`, then one line of text. No boxes, no
  second line.
- **List row** ("Konsonanten"): a rounded row on mist, optionally led by a filled icon in
  `teal-soft`, bold title, caption below, teal arrow (→) on the right. The whole row is the tap
  target. Flashcard subtopics are list rows too, each with its own icon (`deck-icons.ts`).
- **Example list** (a rule's words): no cards, no colour. Each word in subtitle size, below it one
  caption line on what happens to the sound ("Ich-Laut → **Ach-Laut**", "Ach-Laut → gleich"), with
  only a changed sound bold. On the right, a round play button per side, on mist, teal while it
  plays; the sides are named once above the buttons. Space between the words.
- **Takeaway** ("Merke"): a yellow card, a lightbulb and "MERKE" on top, the sentence below in
  semibold. The rule screen's one yellow element.
- **Lesson round** (a section's exercises, such as the consonants): a full screen with a cross at
  the top left to leave, and one segment per exercise. After an answer, a row on sage or rose says
  whether it was right, with the right answer after a wrong one, and below it a mist pill
  "Regel nachlesen: CH". "Weiter" stays at the bottom. It ends on a yellow card: "Konsonanten
  geübt" and how many were right the first time. Under 60 %, a line suggests reading the section
  again, and "Konsonanten nochmals lesen" is the primary button.
- **Rule sheet** (`BottomSheet`): a rule opened from an exercise, sliding up over it, so the
  exercise keeps its place: "REGEL · KONSONANTEN", the title, the theory, the examples and Merke,
  then "Zurück zur Übung". No back arrow and no lesson progress, as it isn't a step of the lesson.
- **Variants on a flashcard** ("auch: Salü · Hallo"): other ways of saying a word in the
  learner's dialect, in one quiet line in `teal-soft` under the Swiss German wherever it shows:
  large under the main form, small under it at the top of the back, and in the word list. Never on
  a front that would give the answer away.
- **Rating a flashcard** (Nochmals, Schwer, Gut, Einfach): four square cards in a row, each with
  an icon (circular arrow, sad, smiling, winking face) and the word. Below each, a clock and when
  the card comes back. The colour gets greener the better the card was known: rose with a brick
  icon (like a wrong answer), mist, `sage-light`, sage. No yellow.
- **Primary button** ("Los geht's"): teal pill, ivory text, at the bottom within thumb reach,
  above the home indicator. One per screen.
- **Secondary button**: mist pill, teal text.
- **Selected tab** in the tab bar: yellow behind the icon, teal icon and label. Other tabs teal
  without background.
- **Progress bar**: track in mist, fill in teal.
- **Pressed**: anything tappable shrinks a little (to 98 %) while pressed and keeps its colour. Only
  the primary button also darkens, to `teal-pressed`. No coloured flash, no phone tap highlight.
- **Inactive or disabled**: mist background, `teal-soft` text. Never grey.

## Not decided yet

- **Emojis**: multicoloured emojis clash with "teal is the only icon colour". Flashcard subtopics
  now use icons, and topics their illustration. Onboarding and settings still show the topics'
  emojis; this guide will say how to replace them.

## Don'ts

- No grey, black or extra colours: every colour comes from the tokens above.
- No colour with opacity for text.
- No borders and shadows on cards to set them off: use mist or sage.
- No lines between sections: use space.
- No second yellow element on a screen, no yellow just for decoration.
- No new radius, size or spacing for one screen: add it here first, or use an existing one.
