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
  while the page scrolls (`TopBar`). Where it skips a level, it names where it leads instead, in
  small semibold text: "‹ Aussprache" on a topic, which goes up to its module, and "‹ Lektionen"
  in the practice tab.
- **Tab header** (Learn tab): the tab's name as title, below it one line in subtitle size and
  weight, full teal, saying what the tab is for. No marker.
- **Suggestion card**: a tab's one suggestion, at the top: a sage card with an eyebrow in teal (the
  softer teal is too faint on sage) saying why, such as "WEITERMACHEN · AUSSPRACHE", the title in
  heading size, one short line, and the primary button. It's an action, not one of the items
  below, so nothing in the list behaves differently. In Learn it continues with the next topic not
  read yet ("Konsonanten", "3 von 6 Themen gelesen", "Weiter: R"), or says "HIER BEGINNEN" and
  "Los geht's" before anything is read. It follows the topic read last, not the module looked at
  last. In Üben → Lektionen it suggests one thing to practise: a lesson read through but not
  practised ("Konsonanten üben"), else the one most worth refreshing ("Konsonanten auffrischen ·
  Zuletzt geübt vor 12 Tagen, 6 von 10 richtig"), else reading on. With everything read and
  practised, it's a quiet card on mist with a check and no button. There's no schedule and no
  "fällig": learners practise what they choose.
- **Practice switch** (Üben tab): "Wortschatz | Lektionen" at the top, a pill on mist with the open
  view in ivory. Each view is its own address. Below "Lektionen", the suggestion card and "ALLE
  ÜBUNGEN": every module as a list row ("1 von 2 Lektionen geübt"), opening its lessons to practise.
- **Module list** (Learn tab): under "ALLE MODULE", every module in order as an equal list row with
  its icon, "MODUL N", title and "N Lektionen · N Themen". The module read in last says "Zuletzt
  gelesen" instead of its size. A module still being written has the "Bald verfügbar" pill
  (see Topic tile) in place of its size, but keeps its arrow and still opens, so learners see what
  it will cover. Every module has its
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
  "Bald verfügbar" pill and no arrow. So is a lesson still being written, in its module's list in
  Learn, and a module or lesson without exercises in Üben → Lektionen.
- **Lesson header**: eyebrow, title, subtitle on a hand-drawn yellow highlight, body text.
  The highlight is the screen's one yellow element, and it's only used here.
- **Icon list** ("Was dich erwartet"): a filled icon in `teal-soft`, then one line of text. No boxes, no
  second line.
- **List row** ("Konsonanten"): a rounded row on mist, optionally led by a filled icon in
  `teal-soft`, bold title, caption below, teal arrow (→) on the right. The whole row is the tap
  target. Flashcard subtopics are list rows too, each with its own icon (`deck-icons.ts`).
- **Module page** (Learn): the lesson header, then under "Lektionen" each lesson as a card on
  mist with its title, "2 von 6 Themen gelesen" and an arrow pointing right (`down`, turned).
  Tapping it unfolds its topics inside the same card and turns the arrow down; several can be
  open. The topics are numbered in order, each a circle before its title: teal with a check once
  read, sage for the next one, ivory for the rest, and an arrow on the right. The lesson read in
  last is open when the page opens, so coming back from a topic shows where the learner is. No
  page per lesson. A lesson still being written is a card with the "Bald verfügbar" pill.
- **Reading a topic**: "‹ Aussprache" at the top left, the lesson's progress beside it. At the
  bottom, "Zurück" to the topic before as a secondary button, a third of the width, beside
  "Weiter: S". Both replace the page rather than adding one, so the phone's back gesture leads out
  of the reading instead of through every topic. The first topic has no "Zurück".
- **Example list** (a rule's words): no cards, no colour. Each word in subtitle size, below it one
  caption line on what happens to the sound ("Ich-Laut → **Ach-Laut**", "Ach-Laut → gleich"), with
  only a changed sound bold. On the right, a round play button per side, on mist, teal while it
  plays; the sides are named once above the buttons: "Hochdeutsch" and, in the pronunciation,
  "Berner Akzent", since its words are Standard German said with the accent (a word only
  Berndeutsch has, such as "müed", says "nur Berndeutsch"). Space between the words.
- **Points** (a topic's lists, after its theory): an optional heading in body size, bold, then
  each point on its own line with a small `teal-soft` dot, 12 px apart. A point with a term (such
  as "CH" or "Vowels") is a row on mist instead, the term bold and what it is below as a caption,
  so terms stand apart from the heading.
- **Phrases** (a topic's example phrases): like the example list, without columns. Each phrase in
  the dialect in subtitle size, below it its meaning as a caption and, if given, "Standard German:
  Wie geht es dir?", and on the right a play button once it has a recording to come.
- A topic's "Merke" is optional: a topic that only leads on, such as "What you will learn next",
  ends on its points.
- **Playing a recording** (`SoundBars`): every round play or speaker button is on mist, gives
  under the finger when tapped (scale 90–95 %), and while the recording plays turns teal with three
  bars bouncing in turn in place of its icon. Still with reduced motion.
- **Pronunciation on a word card**: the speaker at the card's top right, as above. It plays by
  itself the first time the Swiss German shows, unless the learner switched that off: a speaker in
  the session's top bar, crossed out while words only play on tap, and "Aussprache" in Profil.
- **Takeaway** ("Merke"): a yellow card, a lightbulb and "MERKE" on top, the sentence below in
  semibold. The rule screen's one yellow element.
- **Lesson round** (a section's exercises, such as the consonants): a full screen with a cross at
  the top left to leave, and one segment per exercise. After an answer, a row on sage or rose says
  whether it was right, with the right answer after a wrong one, and below it a mist pill
  "Regel nachlesen: CH". "Weiter" stays at the bottom. It ends on a yellow card: "Konsonanten
  geübt" and how many were right the first time. Under 60 %, a line suggests reading the section
  again, and "Konsonanten nochmals lesen" is the primary button. Below, "DEINE ANTWORTEN": every
  exercise as a row on mist with a check or a brick cross, the solution in bold (a word with its
  letters that sound different underlined), and one caption line, such as "CH, R und K klingen
  anders" or "Klang noch nicht gleich". At the bottom, "3 Fehler üben" starts again with only the
  exercises that were wrong, or "Nochmals üben" with the whole round when all were right, as a
  secondary button beside "Fertig", or below it when "Fertig" is the main action. A round of
  mistakes ends on the whole round's new score, "Jetzt 9 von 10 richtig.", which is saved, and
  can be repeated until nothing is wrong. Leaving
  the round's page always starts it afresh next time. Where a practised round starts, its last
  result shows, so practice doesn't look lost: "Geübt heute · 9 von 10 richtig" in its row in
  Üben, and "Zuletzt geübt heute · 9 von 10 richtig" in `teal-soft` under its button at the end
  of the module's last topic. A tap still starts the round straight away.
- **Pronunciation exercises** (`src/app/exercises/pronunciation`), in a lesson round. They're
  Standard German words said with the dialect's accent, not Berndeutsch words, and say so: each
  starts with the eyebrow "HOCHDEUTSCH MIT BERNER AKZENT" and one line saying what to do ("Lies
  das Wort mit Berner Akzent."). The round's first exercise adds, once, in `teal-soft`: "Die
  Wörter bleiben hochdeutsch. So übst du zuerst nur die Laute, ohne neue Wörter." The play
  buttons are "Hochdeutsch" and "Berner Akzent". Each has its own buttons at the bottom:
  - **Spotting letters**: the word in title size, one tile per letter on mist (bracketed letters
    such as "Ch" one tile), narrow enough for "Tätowieren" on one line. A tapped tile turns teal.
    "Prüfen" stays inactive until a tile is tapped: every word has letters that sound different.
    Checked, the right
    tiles turn sage, missed ones rose, wrongly tapped ones rose and struck through, and a row on
    sage or rose says "Nicht ganz: T, Ä und R klingen anders". Below, the word in Standard German
    and the dialect, played one after the other, and a "Regel nachlesen" pill per rule.
  - **Saying a word**: the word in title size, and a mist pill "Tipp: worauf achten?" that
    underlines the letters to watch in sage. "Aufnehmen" at the bottom, then a bar filling up and
    "Fertig". Then the learner's recording ("Du", a microphone) and the dialect's ("So klingt's", a
    speaker) play one after the other, as round play buttons, the letters now underlined. At the
    bottom, together so they read as one: "Klang es gleich?" in subtitle size, "Ja, klang gleich"
    (primary, goes on), "Noch nicht, nochmals" (secondary, records again at once, as often as the
    learner likes), and a quiet text button "Trotzdem weiter", `teal-soft` and underlined, that
    goes on without it. One button per job, all there from the start. Without a microphone:
    "Gesagt, anhören".
  - **Repeating a sentence**: the sentence in heading size, its letters to watch underlined in
    sage with a thinner line behind the same tip, "Anhören" first, then as above.
  - A recording still to come is an inactive play button with "Aufnahme folgt".
  - Until an exercise is answered, "Überspringen" under its main button goes on without it, as
    not right. This holds for every exercise in a round.
- **Rule sheet** (`BottomSheet`): a rule opened from an exercise, sliding up over it, so the
  exercise keeps its place: "REGEL · KONSONANTEN", the title, the theory, the examples and Merke,
  then "Zurück zur Übung". No back arrow and no lesson progress, as it isn't a step of the lesson.
- **Variants on a flashcard** ("auch: Salü · Hallo"): other ways of saying a word in the
  learner's dialect, in one quiet line in `teal-soft` under the Swiss German wherever it shows:
  large under the main form, small under it at the top of the back, and in the word list. Never on
  a front that would give the answer away.
- **Today's goal** (Üben → Wortschatz): a card on mist every day, with a bar for new cards and
  one for reviews, on an ivory track. Once it's reached, a small yellow pill with a check says
  "Erreicht": the card's one yellow. No emoji.
- **End of a session**: calm, centred. A check on a mist circle draws itself, the cheer pops in,
  and the numbers count up on mist, each with its word below ("neue Karten gelernt"). A session
  that reaches today's goal gets a moment instead: a larger yellow circle springs in with a ring
  and two waves of dots in yellow, sage and teal, its check drawing itself; "Tagesziel erreicht"
  in a mist pill; then this week as seven circles with the weekday's initial, days with practice
  teal with a check and today yellow, popping in last, and the streak below ("3 Tage in Folge").
  About 1.5 s in all; the button works throughout. With reduced motion, everything shows as it
  ends up, without dots or ring.
- **Lifting today's limit** of new cards: once today's goal is reached, a quiet ivory pill
  "Heute weiterlernen" in the goal card, and "Ohne Limit weiterlernen" where a topic is done
  for today (its sheet, as the primary button, and the end of a session, as a secondary one), with
  "Mehr neue Karten heute heisst mehr Wiederholungen in den nächsten Tagen" below. Until midnight,
  the goal card shows "12 · ohne Limit" and a pill "Ohne Limit bis Mitternacht". Reviews of known
  words stay limited.
- **Choosing the track** (onboarding's first question): "Sprichst du Hochdeutsch?" in title size,
  with "Do you speak German?" below in subtitle size and `teal-soft`, as the learner may read
  either. Two answer cards on mist, each in its own language: an icon on an ivory circle, the
  answer in bold, one line on what it means, and a check circle on the right. The chosen card
  turns sage with a teal check, and unfolds its path on an ivory panel inside it ("DEIN LERNWEG ·
  5 Module", each module with its icon). Below, a mist pill "Nicht sicher? · Not sure?" opens a
  quick test in a sheet: one Standard German sentence, "Verstehst du diesen Satz?", and "Ja, gut"
  or "Not really", which choose the answer and put a small yellow "Empfohlen" tag on its edge,
  the screen's one yellow. Under it, always, "Du kannst später wechseln · You can switch later".
- **Choosing the dialect** (onboarding's second question): "Welchen Dialekt möchtest du lernen?"
  in title size, then a card on mist per dialect: its canton's flag (square, 48 px, rounded
  corners, no frame), the name in dialect ("Bärndütsch") in subtitle size, and "Bern und Umgebung" below, or
  for a dialect not ready yet the name in `teal-soft` with a "Kommt vor dem Launch" or "Kommt
  später" pill and no check. The chosen one is on sage with a teal check; while only one is
  ready, it's chosen from the start. Below, "Nicht sicher?" opens three points on which to pick,
  and "Du kannst später wechseln", as on the track question. The flags are in `public/flags/`;
  they're cantonal emblems, whose use Swiss law restricts.
- **Rating a flashcard** (Nochmals, Schwer, Gut, Einfach): four square cards in a row, each with
  an icon (circular arrow, sad, smiling, winking face) and the word. Below each, a clock and when
  the card comes back. The colour gets greener the better the card was known: rose with a brick
  icon (like a wrong answer), mist, `sage-light`, sage. No yellow.
- **Primary button** ("Los geht's"): teal pill, ivory text, at the bottom within thumb reach,
  above the home indicator. One per screen.
- **Secondary button**: mist pill, teal text.
- **Text button** (`TextButton`): a quiet way on beside the main buttons, such as "Überspringen"
  under an exercise's main button, or "Trotzdem weiter": caption size, semibold, `teal-soft`,
  underlined, centred, and 44 px high to tap. Never for the main action.
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
