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
    // Bärndütsch said in a conversation, as speech bubbles.
    bubbles: ["Grüessech!", "Wie geits?", "Merci viumau!", "Hoi zäme!"],
    headline: "Soon you'll join in.",
    intro: "Swiss German for everyday life.",
    start: "Create account",
    haveAccount: "I already have an account",
  },

  login: {
    title: "Log in",
    heading: "Log in to Hoi",
    signUpHeading: "Create your account",
    newHere: "New to Hoi? Create an account",
    haveAccount: "Already have an account? Log in",
    email: "Email",
    password: "Password",
    logIn: "Log in",
    createAccount: "Create account",
    confirmEmail: "Check your email to confirm your account.",
  },

  learn: {
    // The English track starts from nothing, rather than from Standard German.
    intro: "Swiss German, step by step.",
    // Above the card to continue: whether the learner has read anything yet, then the module.
    continue: "Continue",
    startHere: "Start here",
    topicsRead: (read: number, count: number) => `${read} of ${many(count, "topic", "topics")} read`,
    allModules: "All modules",
    // In place of a module's size, on the one the learner read in last.
    allRead: "All read",
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
    // The track, which also sets Hoi's language. It's named by its language (languageName).
    track: "Learning path",
    progressKept: "Your progress stays saved.",
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
    expect: "What you'll learn",
    topicsHeading: "Lessons",
    back: (page: string) => `Back to ${page}`,
    topics: (count: number) => many(count, "topic", "topics"),
    // A module's lessons (sections in the code), such as "Consonants" and "Vowels".
    sections: (count: number) => many(count, "lesson", "lessons"),
    start: "Let’s go",
    // Beside "Next: R" on a module the learner has been in before.
    fromStart: "Start over",
    next: "Next",
    previous: "Back",
    done: "Done",
    // Where a topic is in its section, such as "Consonants · 2 / 6".
    position: (section: string, position: number, count: number) => `${section} · ${position} / ${count}`,
    remember: "Remember",
    tip: "Tip",
    // A play button beside a phrase.
    listen: "Listen",
    // Marks a word that sounds the same in Standard German and the dialect.
    same: "same",
    // For screen readers, in place of the Standard German side of a dialect-only word.
    onlyIn: (variety: string) => `only in ${variety}`,
    becomes: "becomes",
    // The same as in Germany for the examples, so "Swiss" is only in brackets.
    standardGerman: "(Swiss) Standard German",
    // By dialect id. A dialect without a name here shows its id.
    dialects: { be: "Bernese German", zh: "Zürich German" } as Record<string, string>,
    // The accent of each dialect, for pronouncing Standard German with it.
    accents: { be: "Bernese", zh: "Zürich" } as Record<string, string>,
    // A rule's examples said with the accent, named above their buttons.
    accentName: (accent: string) => `${accent} accent`,
    playAccent: (accent: string) => `Listen with a ${accent} accent`,
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
    // After practising the mistakes, for the whole round.
    scoreNow: (correct: number, total: number) => `Now ${correct} of ${total} right.`,
    score: (correct: number, total: number) => `${correct} of ${total} right the first time.`,
    // After a round with under 60 % right.
    weak: "Still a bit shaky. Read the lesson again and it'll stick better.",
    readAgain: (section: string) => `Read ${section} again`,
    finish: "Done",
    // Going on without answering an exercise.
    skip: "Skip",
    again: "Practise again",
    // Only the exercises that were wrong.
    againMistakes: (count: number) => `Practise ${many(count, "mistake", "mistakes")}`,
    review: "Your answers",
    notSaved: (error: string) => `Your result wasn't saved: ${error}`,
    // The Practice tab's two views: flashcards, and the lessons' exercises.
    views: { label: "What to practise", words: "Vocabulary", lessons: "Lessons" },
    allExercises: "All exercises",
    exercises: "Exercises",
    sectionsPractised: (practised: number, count: number) =>
      `${practised} of ${many(count, "lesson", "lessons")} practised`,
    ago: (days: number) => (days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`),
    practised: (ago: string) => `Practised ${ago}`,
    practisedScore: (ago: string, correct: number, total: number) => `Practised ${ago} · ${correct} of ${total} right`,
    // Under the button that starts a round practised before.
    lastResult: (ago: string, correct: number, total: number) => `Last practised ${ago} · ${correct} of ${total} right`,
    mixedAfter: "Best after all the lessons",
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
    intro: "Real everyday dialogues to listen to.",
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

  // The pronunciation exercises: spotting letters, and saying words and sentences oneself.
  pronunciation: {
    // What the pronunciation exercises are: Standard German words, said with the dialect's accent.
    frame: (accent: string) => `Standard German with a ${accent} accent`,
    // Once, on the round's first exercise.
    why: "The words stay Standard German, so you practise only the sounds first, without new words.",
    letters: (accent: string) => `Which letters sound different with a ${accent} accent?`,
    accent: (accent: string) => `${accent} accent`,
    right: "Right",
    // letters joined with "and", such as "K and ST".
    and: " and ",
    wrongChanged: (count: number, letters: string) => `Not quite: ${letters} ${count > 1 ? "sound" : "sounds"} different`,
    say: (accent: string) => `Read the word with a ${accent} accent. Then listen to it.`,
    repeat: (accent: string) => `Listen, then say the sentence after with a ${accent} accent.`,
    tip: "Tip: what to listen for?",
    record: "Record",
    stop: "Done",
    recording: "Recording",
    listen: "Listen",
    you: "You",
    model: "How it sounds",
    noRecording: "Recording to come",
    sameQuestion: "Did it sound the same?",
    yes: "Yes, it sounded the same",
    notYet: "Not yet, again",
    skip: "Go on anyway",
    soundedSame: "Sounded the same",
    notSameYet: "Didn't sound the same yet",
    changed: (count: number, letters: string) => `${letters} ${count > 1 ? "sound" : "sounds"} different`,
    noMicrophone: "Without a microphone: say it out loud, then listen.",
    said: "Said it, listen",
  },

  flashcards: {
    title: "Practice",
    intro: "A few words every day, and exercises on the lessons.",
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
    // Shown once, above the rating buttons on the first card a learner turns over.
    ratingTip: {
      title: "How well did you know it?",
      text: "Be honest: «Again» shows the card again right away, «Easy» only in a few days. Below each, you see when it comes back.",
    },
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
    // The first question, which sets the learner's track and the app's language. It's shown in
    // German and English together, and each answer in its own language.
    track: {
      question: "Do you understand German well?",
      intro: "Hoi has two learning paths. Your answer picks the right one.",
      // The answer for each track, in this language, and what that track teaches. The German
      // track's note, only in onboarding, says German needn't be the learner's first language.
      answers: {
        de: { answer: "Yes, I understand German well", what: "You learn Swiss German, building on your German." },
        en: { answer: "No, I'll learn in English", what: "You learn Swiss German from the very start." },
      },
      germanNote: "Native or not.",
      path: "Your path",
      modules: (count: number) => many(count, "module", "modules"),
      recommended: "Recommended",
      notSure: "Not sure?",
      switchLater: "You can switch later",
      // A sentence of Standard German to read, for the unsure.
      test: {
        heading: "Quick test",
        sentence: "Gestern habe ich mit meinen Nachbarn über das Wetter gesprochen.",
        question: "Do you understand this sentence?",
        yes: "Yes, easily",
        no: "Not really",
      },
    },
    // The second question. Dialect names stay in dialect, so they aren't here.
    dialect: {
      question: "Which dialect would you like to learn?",
      regions: { zh: "Zürich and around", be: "Bern and around", bs: "Basel and around" } as Record<string, string>,
      soon: { beforeLaunch: "Coming before launch", later: "Coming later" },
      notSure: "Not sure?",
      switchLater: "You can switch later",
      help: {
        title: "Which dialect?",
        points: [
          "Swiss German isn't one language but many dialects. They sound different, but their speakers understand each other well.",
          "Learn the dialect of the region where you live, work or know people. It's the one you'll hear every day.",
          "Once you know one dialect, you'll soon understand the others too.",
        ],
        understood: "Got it",
      },
    },
    // The last screen: how Hoi works, then the pace.
    pace: {
      heading: "How Hoi works",
      // The three main tabs, named as in the tab bar.
      tabs: [
        { id: "learn", text: (dialect: string) => `Short lessons: how ${dialect} sounds and works.` },
        { id: "practice", text: () => "A few words every day, and exercises on the lessons." },
        { id: "talk", text: () => "Real everyday dialogues to listen to." },
      ] as { id: "learn" | "practice" | "talk"; text: (dialect: string) => string }[],
      remember: {
        title: "Words that stick",
        text: "Hoi shows you each word again just before you'd forget it.",
        // When one word comes back, as an example.
        reviews: ["Today", "Tomorrow", "3 days", "1 week", "1 month"],
      },
      choose: "How many new words a day?",
      chooseNote: "Choose your pace. More new words also means more reviews.",
      // Under each pace's name.
      newWordsPerDay: "new words a day",
      recommended: "Recommended",
      changeLater: "You can change this in your profile at any time",
      finish: "Let's go",
      saving: "Saving…",
      notSaved: (error: string) => `Not saved: ${error}`,
    },
  },

  // Units for how long until a card comes back, such as "10 min" or "3 d".
  intervals: { minutes: "min", hours: "h", days: "d", months: "mo", years: "y" },
};

export type Dictionary = typeof en;
