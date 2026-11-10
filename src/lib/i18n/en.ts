// Every text in the app's interface, in English. Every other language must provide the same
// entries, which the type check enforces. Card content (words, decks) comes from the database.
import { plural } from "./plural";

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
      "Short lessons in real Swiss German, starting with Zürich dialect. Learn what people actually say at the bakery, at work and on the tram.",
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

  nav: {
    label: "Main",
    learn: "Learn",
    practice: "Practice",
    immerse: "Immerse",
    profile: "Profile",
  },

  profile: {
    title: "Profile",
    learningSince: (date: string) => `Learning since ${date}`,
    progress: "Progress",
    streak: (count: number) => many(count, "day in a row", "days in a row"),
    wordsLearned: (count: number) => many(count, "word learned", "words learned"),
    rulesLearned: (count: number) => many(count, "rule learned", "rules learned"),
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
    leave: "Leave lesson",
    expect: "What to expect",
    topicsHeading: "Topics",
    back: (page: string) => `Back to ${page}`,
    topics: (count: number) => many(count, "topic", "topics"),
    next: "Next",
    overview: "Back to the overview",
    remember: "Remember",
    standardGerman: "Standard German",
    // By dialect id. A dialect without a name here shows its id.
    dialects: { be: "Bernese German", zh: "Zürich German" } as Record<string, string>,
    play: (variety: string) => `Listen in ${variety}`,
    noRecording: "No recording yet",
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
    newCount: (count: number) => `${count} new`,
    reviewCount: (count: number) => many(count, "review", "reviews"),
    doneForToday: "Done for today",
    nothingLeft: "Nothing left for today",
    startFlashcards: "Start flashcards",
    seeWordList: "See word list",
    shuffle: "Shuffle learning in this category",
    allDone: "All done for today",
    comeBackTomorrow: (deck: string) => `Come back tomorrow for more ${deck}.`,
    wordListTitle: (deck: string) => `${deck} words`,
    kindLabel: "What to practise",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    rules: (count: number) => many(count, "rule", "rules"),
    startPractice: "Start practising",
    seeRules: "See rules",
    ruleListTitle: (deck: string) => `${deck} rules`,
    newRule: "New",
    swissGerman: "Swiss German",
    translation: "English",
  },

  goal: {
    heading: "Today’s goal",
    reached: "Reached",
    edit: "Edit",
    editLabel: "Edit daily goal",
    newWords: "New words",
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
    notSaved: (error: string) => `Your answer wasn’t saved: ${error}. Choose again to retry.`,
    grades: { again: "Again", hard: "Hard", good: "Good", easy: "Easy" },
    statuses: { new: "New", learning: "Learning", review: "Review" },
    newWordsLearned: (count: number) => many(count, "new word learned", "new words learned"),
    wordsReviewed: (count: number) => many(count, "word reviewed", "words reviewed"),
    newRulesLearned: (count: number) => many(count, "new rule learned", "new rules learned"),
    rulesPractised: (count: number) => many(count, "rule practised", "rules practised"),
    correct: "Correct!",
    notQuite: "Not quite",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    continue: "Continue",
    saving: "Saving…",
    tryAgain: "Try again",
    answerNotSaved: (error: string) => `Your answer wasn’t saved: ${error}`,
    goalReached: "Today’s goal reached!",
    goalReachedNote: "That’s it for today. See you tomorrow.",
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
