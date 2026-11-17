// Every text in the app's interface, in English. Every other language must provide the same
// entries, which the type check enforces. Card content (words, decks) comes from the database.
import { plural, pluralForm } from "./plural";

const many = (count: number, one: string, other: string) => plural("en", count, { one, other });

export const en = {
  title: (page: string) => `${page} – Hoi`,
  // The language's own name, as listed in the language picker.
  languageName: "English",
  language: "Language",
  // Whether the translation on cards is the card's Standard German. When it isn't, the Standard
  // German is shown as a second translation.
  translationIsStandardGerman: false,
  standardGerman: "Standard German:",

  home: {
    headline: "Understand your Swiss neighbours, not just their signs.",
    intro:
      "Short modules in real Swiss German, starting with Zürich dialect. Learn what people actually say at the bakery, at work and on the tram.",
    start: "Start learning",
  },

  login: {
    title: "Log in",
    heading: "Log in to Hoi",
    email: "Email",
    password: "Password",
    logIn: "Log in",
    createAccount: "Create account",
    confirmEmail: "Check your email to confirm your account.",
  },

  learn: {
    intro: "How Swiss German differs from Standard German.",
    // Above the card to continue: whether the learner has read anything yet, then the module.
    continue: "Continue",
    startHere: "Start here",
    topicsRead: (read: number, count: number) => `${read} of ${many(count, "topic", "topics")} read`,
    allModules: "All modules",
    // In place of a module's size, on the one the learner read in last.
    lastRead: "Read last",
  },

  nav: {
    label: "Main",
    learn: "Learn",
    practice: "Practice",
    conversations: "Conversations",
    profile: "Profile",
  },

  profile: {
    title: "Profile",
    learningSince: (date: string) => `Learning since ${date}`,
    progress: "Progress",
    streak: (count: number) => many(count, "day in a row", "days in a row"),
    // Words and sentences, beside the grammar rules learned.
    wordsLearned: (count: number) => many(count, "card learned", "cards learned"),
    languages: "Languages",
    iSpeak: "I speak",
    iSpeakNote: "Hoi uses this language for everything, including translations.",
    dialect: "Dialect",
    dialectNote: "Words and grammar are in this dialect. Until you choose one, you see every dialect.",
    dialectNotChosen: "Not chosen",
    learning: "Learning",
    account: "Account",
    dailyPace: "Daily pace",
    cardDirection: "Card direction",
    cardDirectionNote: "Which side of a word card you see first. You can also swap it during a session.",
    directions: { swiss_german: "Swiss German first", translation: "English first" },
    audio: "Pronunciation",
    audioNote:
      "Whether a word card plays the word by itself as soon as you see the Swiss German. You can also switch it at the top of a session.",
    audioModes: { auto: "Play automatically", tap: "Only when tapped" },
    topics: "Topics",
    topicsNote: "Your topics come first in Practice.",
    topicsChosen: (count: number) => (count === 0 ? "None" : `${count} chosen`),
    save: "Save",
    saving: "Saving…",
    close: "Close",
    notSaved: (error: string) => `Not saved: ${error}`,
    logOut: "Log out",
  },

  lesson: {
    leave: "Leave module",
    number: (number: number) => `Module ${number}`,
    expect: "What to expect",
    topicsHeading: "Lessons",
    back: (page: string) => `Back to ${page}`,
    topics: (count: number) => many(count, "topic", "topics"),
    // A module's lessons (sections in the code), such as "Consonants" and "Vowels".
    sections: (count: number) => many(count, "lesson", "lessons"),
    start: "Let’s go",
    // Beside "Next: R" on a module the learner has been in before.
    fromStart: "Start over",
    next: "Next",
    done: "Done",
    // Where a topic is in its section, such as "Consonants · 2 / 6".
    position: (section: string, position: number, count: number) => `${section} · ${position} / ${count}`,
    remember: "Remember",
    // Marks a word that sounds the same in Standard German and the dialect.
    same: "same",
    // For screen readers, in place of the Standard German side of a dialect-only word.
    onlyIn: (variety: string) => `only in ${variety}`,
    becomes: "becomes",
    standardGerman: "Standard German",
    // By dialect id. A dialect without a name here shows its id.
    dialects: { be: "Bernese German", zh: "Zürich German" } as Record<string, string>,
    play: (variety: string) => `Listen in ${variety}`,
    noRecording: "No recording yet",
    comingSoon: "Coming soon",
    // On the overview of a lesson that's still being written.
    inTheMaking: "This module is still being written. Here's what it will cover.",
  },

  // A lesson's exercises, done at the end of a section such as the consonants.
  practice: {
    practise: (section: string, count: number) => `Practise ${section} · ${many(count, "exercise", "exercises")}`,
    later: "Later",
    // On a module's page, as the second choice after reading on.
    toExercises: "Go to the exercises",
    leave: "Leave exercises",
    progress: (position: number, count: number) => `Exercise ${position} of ${count}`,
    // Opens the rule an exercise is about, after a wrong answer.
    readRule: (rule: string) => `Read the rule: ${rule}`,
    rule: (section: string) => `Rule · ${section}`,
    backToExercise: "Back to the exercise",
    done: (section: string) => `${section} practised`,
    score: (correct: number, total: number) => `${correct} of ${total} right the first time.`,
    // After a round with under 60 % right.
    weak: "Still a bit shaky. Read the lesson again and it'll stick better.",
    readAgain: (section: string) => `Read ${section} again`,
    finish: "Done",
    notSaved: (error: string) => `Your result wasn't saved: ${error}`,
    // The Practice tab's two views: flashcards, and the lessons' exercises.
    views: { label: "What to practise", words: "Vocabulary", lessons: "Lessons" },
    allExercises: "All exercises",
    exercises: "Exercises",
    sectionsPractised: (practised: number, count: number) =>
      `${practised} of ${many(count, "lesson", "lessons")} practised`,
    ago: (days: number) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`),
    practised: (ago: string) => `Practised ${ago}`,
    readNotPractised: "Read, not practised yet",
    notRead: (count: number) => `${many(count, "topic", "topics")}, not read yet`,
    // The card with the one thing suggested, such as "Next · Pronunciation".
    next: (module: string) => `Next · ${module}`,
    practiseSection: (section: string) => `Practise ${section}`,
    allRead: (count: number) => `You've read all ${many(count, "topic", "topics")}.`,
    refresh: (section: string) => `Brush up on ${section}`,
    lastRound: (ago: string, correct: number, total: number) => `Last practised ${ago}, ${correct} of ${total} right.`,
    start: "Practise",
    allPractised: "All practised",
    readFirst: "Read first",
    readOn: (section: string) => `Go on with ${section}`,
    left: (count: number) => `${many(count, "topic", "topics")} left to read.`,
    allDone: "All read and practised",
  },

  conversations: {
    // How many scenes a topic has, such as "5 scenes".
    scenes: (count: number) => many(count, "scene", "scenes"),
    // On a scene that is still to be written.
    comingSoon: "Coming soon",
    play: "Play",
    pause: "Pause",
    back5: "Back 5 seconds",
    forward5: "Forward 5 seconds",
    restart: "From the start",
    // Scrolls the transcript back to the line being spoken, after the learner scrolled away.
    followAgain: "Back to current line",
    // The playback speed, such as "Speed: 0.75×", switched with each tap.
    speed: (rate: string) => `Speed: ${rate}`,
    progress: "Position in the conversation",
    noRecording: "No recording yet",
    // The transcript stays hidden until the conversation has been heard once: listening is the
    // skill being trained.
    listenFirst: "Listen once without reading along. The transcript unlocks afterwards.",
    showAnyway: "Show it anyway",
    transcript: "Transcript",
    showTranscript: "Show transcript",
    hideTranscript: "Hide transcript",
    showTranslation: "Show translation",
    hideTranslation: "Hide translation",
    playLine: (speaker: string) => `Play ${speaker}’s line`,
  },

  exercises: {
    putInOrder: "Put the words in order:",
    check: "Check",
    findMistake: "Tap the mistake:",
    replaceWith: (word: string) => `Replace “${word}” with:`,
    gap: "gap",
  },

  flashcards: {
    title: "Practice",
    noDecks: "No decks yet. Add the flashcards with",
    topics: "Topics",
    subcategories: "Subcategories",
    words: (count: number) => many(count, "word", "words"),
    // Sentences include expressions, such as "Hoi zäme": learners don't need the difference.
    phrases: (count: number) => many(count, "sentence", "sentences"),
    // Practising or listing a topic's words and its sentences together or apart.
    filterLabel: "Which cards",
    filters: { all: "All", words: "Words", phrases: "Sentences" },
    newCount: (count: number) => `${count} new`,
    reviewCount: (count: number) => many(count, "review", "reviews"),
    doneForToday: "Done for today",
    // On a topic that has no cards yet.
    comingSoon: "Coming soon",
    nothingLeft: "Nothing left for today",
    // Starts a topic's session, of words and sentences or of grammar.
    practise: "Practise",
    // The list of a topic's words and sentences.
    seeList: "See list",
    // The button's label, and what screen readers hear, naming the category.
    shuffleAll: "Shuffle all",
    shuffle: (deck: string) => `Shuffle all of ${deck}`,
    allDone: "All done for today",
    listTitle: (deck: string) => `${deck} list`,
    swissGerman: "Swiss German",
    translation: "English",
  },

  goal: {
    heading: "Today’s goal",
    reached: "Reached",
    edit: "Edit",
    editLabel: "Edit daily goal",
    // Words and sentences alike: they share the daily goal.
    newWords: "New cards",
    cardsReviewed: "Cards reviewed",
    nothingToReview: "Nothing to review",
    sheetTitle: "Choose your daily learning pace",
    close: "Close",
    paceLabel: "Daily learning pace",
    presets: { relaxed: "Relaxed", steady: "Steady", intensive: "Intensive" },
    newCards: (count: number) => `${count} new cards`,
    upToReviews: (count: number) => `up to ${count} reviews`,
    note: "Your review schedule is calculated automatically from the number of new cards you choose. How many reviews you get varies with your progress: it’s a daily maximum, not an amount you have to complete.",
    notSaved: (error: string) => `Not saved: ${error}`,
    saving: "Saving…",
    save: "Save changes",
    // Lifting today's limit of new cards, until midnight.
    keepLearning: "Keep learning today",
    liftLimit: "Keep learning without a limit",
    noLimit: "no limit",
    liftedUntilMidnight: "No limit until midnight",
    liftNote: "More new cards today means more reviews in the next few days.",
  },

  session: {
    empty:
      "Nothing left here for today: you’ve reached your daily goal, or nothing to review yet.",
    backTo: (place: string) => `Back to ${place}`,
    leave: "Leave session",
    progress: "Session progress",
    swap: "Swap card direction",
    showingSwissGermanFirst: "Showing Swiss German first. Show English first instead",
    showingTranslationFirst: "Showing English first. Show Swiss German first instead",
    tapToReveal: "Tap card to reveal",
    // The speaker in a session's top bar, switching whether words play by themselves.
    autoplay: "Play pronunciation automatically",
    autoplayOn: "Plays the pronunciation automatically",
    autoplayOff: "Plays the pronunciation only when tapped",
    // Before a word's other forms, such as "also: Salü · Hallo".
    also: "also",
    notSaved: (error: string) => `Your answer wasn’t saved: ${error}. Choose again to retry.`,
    grades: { again: "Again", hard: "Hard", good: "Good", easy: "Easy" },
    statuses: { new: "New", learning: "Learning", review: "Review" },
    // Under the number at the end of a session, which shows large above it.
    newWordsLearned: (count: number) => pluralForm("en", count, { one: "new card learned", other: "new cards learned" }),
    wordsReviewed: (count: number) => pluralForm("en", count, { one: "card reviewed", other: "cards reviewed" }),
    correct: "Correct!",
    notQuite: "Not quite",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    continue: "Continue",
    saving: "Saving…",
    tryAgain: "Try again",
    answerNotSaved: (error: string) => `Your answer wasn’t saved: ${error}`,
    goalReached: "Today’s goal reached",
    // This week's days, Monday first, as initials under the streak.
    weekdays: ["M", "T", "W", "T", "F", "S", "S"],
    playPronunciation: "Play pronunciation",
    noRecording: "No recording yet",
  },

  onboarding: {
    title: "Welcome",
    step: (current: number, total: number) => `Step ${current} of ${total}`,
    back: "Back",
    next: "Next",
    skip: "Skip",
    language: {
      heading: "Which language do you prefer?",
      intro: "Hoi will use it for everything. You can change it at any time.",
    },
    level: {
      heading: "How familiar are you with Swiss German?",
      options: {
        new: { label: "I’m just starting", hint: "Swiss German is new to me" },
        few_words: { label: "I know a few words", hint: "Like Grüezi and Merci" },
        understands: { label: "I understand a fair amount", hint: "But I don’t speak it yet" },
        speaks: { label: "I can hold a simple conversation", hint: "And want to get better" },
      },
    },
    topics: {
      heading: "Which topics interest you?",
      intro: "Pick as many as you like. We’ll show them first.",
    },
    pace: {
      heading: "How Hoi works",
      points: [
        { icon: "📚", text: "You learn a few new words every day." },
        { icon: "🔁", text: "Hoi brings each word back just before you’d forget it." },
        { icon: "⏱️", text: "A few minutes a day is enough." },
      ],
      choose: "Choose your pace",
      recommended: "Recommended",
      finish: "Start learning",
      saving: "Saving…",
      notSaved: (error: string) => `Not saved: ${error}`,
    },
  },

  // Units for how long until a card comes back, such as "10 min" or "3 d".
  intervals: { minutes: "min", hours: "h", days: "d", months: "mo", years: "y" },
};

export type Dictionary = typeof en;
