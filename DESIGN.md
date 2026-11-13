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
| `yellow` | `#FFE08A` | Attention, positive moments | Selected tab, the subtitle highlight, achievements such as a reached daily goal |
| `ivory`  | `#FAF9F6` | Main background             | Screen background, the main neutral surface |

Order of weight: teal draws the eye, sage groups, mist separates, yellow marks the special
moment, ivory gives room.

Rules:

- Teal is the only colour for text and icons. Text on teal (the primary button) is ivory. The one
  exception is `brick`, for mistakes and errors (see below).
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
| Eyebrow        | 14 px, semibold, uppercase, letter-spaced, `teal-soft` | LEKTION 1 |
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
- Icons: line icons, about 2 px stroke, teal, 24–28 px, without a box around them.
- Tap targets at least 44 × 44 px, also for small icons such as the back arrow.

## Building blocks

These are the parts of the model screen. Every screen is built from them, and new ones are added
here first. They live in `src/app/ui/` (`Button`, `ButtonLink`, `ListRow`, `Card`, `Pill`,
`Eyebrow`, `Highlight`, `ProgressBar`, `Icon`, `AnswerMark`), the type sizes are the `text-title`,
`text-heading`, `text-subtitle`, `text-body` and `text-caption` classes, and all of it can be seen
at `/dev/design`.

- **Back button**: a teal arrow (←) at the top left, no text, no bar colour. It stays at the top
  while the page scrolls (`TopBar`).
- **Lesson header**: eyebrow, title, subtitle on a hand-drawn yellow highlight, body text.
  The highlight is the screen's one yellow element.
- **Icon list** ("Was dich erwartet"): a teal line icon, then one line of text. No boxes, no
  second line.
- **List row** ("Konsonanten"): a rounded row on mist, bold title, caption below, teal arrow (→)
  on the right. The whole row is the tap target.
- **Primary button** ("Los geht's"): teal pill, ivory text, at the bottom within thumb reach,
  above the home indicator. One per screen.
- **Secondary button**: mist pill, teal text.
- **Selected tab** in the tab bar: yellow behind the icon, teal icon and label. Other tabs teal
  without background.
- **Progress bar**: track in mist, fill in teal.
- **Inactive or disabled**: mist background, `teal-soft` text. Never grey.

## Not decided yet

- **Emojis**: topics, situations and decks use multicoloured emojis, which clash with "teal is the
  only icon colour". They stay as they are for now; this guide will say how to replace them.

## Don'ts

- No grey, black or extra colours: every colour comes from the tokens above.
- No colour with opacity for text.
- No borders and shadows on cards to set them off: use mist or sage.
- No lines between sections: use space.
- No second yellow element on a screen, no yellow just for decoration.
- No new radius, size or spacing for one screen: add it here first, or use an existing one.
