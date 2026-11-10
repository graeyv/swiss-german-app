// Every text in the app's interface, in Swiss Standard German: "ss" instead of "ß", and «»
// quotation marks. Needs the same entries as en.ts, which the type check enforces.
import type { Dictionary } from "./en";
import { plural } from "./plural";

const many = (count: number, one: string, other: string) => plural("de", count, { one, other });

export const de: Dictionary = {
  title: (page) => `${page} – Hoi`,
  languageName: "Deutsch",
  language: "Sprache",
  // The translation already is Standard German, so there's no second one.
  translationIsStandardGerman: true,
  standardGerman: "Hochdeutsch:",

  home: {
    headline: "Versteh deine Schweizer Nachbarn, nicht nur ihre Schilder.",
    intro:
      "Kurze Lektionen in echtem Schweizerdeutsch, angefangen mit Zürichdeutsch. Lerne, was die Leute wirklich sagen: in der Bäckerei, bei der Arbeit und im Tram.",
    start: "Jetzt lernen",
  },

  login: {
    title: "Anmelden",
    heading: "Bei Hoi anmelden",
    email: "E-Mail",
    password: "Passwort",
    logIn: "Anmelden",
    createAccount: "Konto erstellen",
    confirmEmail: "Bestätige dein Konto über den Link in deiner E-Mail.",
  },

  nav: {
    label: "Hauptmenü",
    learn: "Lernen",
    practice: "Üben",
    immerse: "Alltag",
    profile: "Profil",
  },

  profile: {
    title: "Profil",
    learningSince: (date) => `Dabei seit ${date}`,
    progress: "Fortschritt",
    streak: (count) => many(count, "Tag in Folge", "Tage in Folge"),
    wordsLearned: (count) => many(count, "Wort gelernt", "Wörter gelernt"),
    rulesLearned: (count) => many(count, "Regel gelernt", "Regeln gelernt"),
    languages: "Sprachen",
    iSpeak: "Ich spreche",
    iSpeakNote: "Hoi verwendet diese Sprache für alles, auch für die Übersetzungen.",
    dialect: "Dialekt",
    dialectNote: "Wörter und Grammatik kommen in diesem Dialekt. Bis du einen wählst, siehst du alle Dialekte.",
    dialectNotChosen: "Nicht gewählt",
    learning: "Lernen",
    account: "Konto",
    dailyPace: "Lerntempo",
    cardDirection: "Kartenrichtung",
    cardDirectionNote:
      "Welche Seite einer Wortkarte du zuerst siehst. Du kannst sie auch während einer Sitzung wechseln.",
    directions: { swiss_german: "Schweizerdeutsch zuerst", translation: "Hochdeutsch zuerst" },
    topics: "Themen",
    topicsNote: "Deine Themen erscheinen beim Üben zuerst.",
    topicsChosen: (count) => (count === 0 ? "Keine" : `${count} gewählt`),
    save: "Speichern",
    saving: "Wird gespeichert…",
    close: "Schliessen",
    notSaved: (error) => `Nicht gespeichert: ${error}`,
    logOut: "Abmelden",
  },

  learn: {
    title: "Deine Lektionen",
    noCourses: "Noch keine Kurse. Füge die Startinhalte hinzu mit",
  },

  lesson: {
    complete: "Lektion abgeschlossen",
    score: (percent) => `${percent} % richtig`,
    finished: (title) => `Du hast «${title}» abgeschlossen.`,
    notSaved: (error) => `Dein Fortschritt wurde nicht gespeichert: ${error}`,
    tryAgain: "Nochmals versuchen",
    saving: "Wird gespeichert…",
    backToLessons: "Zurück zu den Lektionen",
    noExercises: "Diese Lektion hat noch keine Übungen.",
    leave: "Lektion verlassen",
    progress: "Fortschritt der Lektion",
    correct: "Richtig!",
    incorrect: (answer) => `Nicht ganz. Die Antwort ist: ${answer}`,
    continue: "Weiter",
  },

  exercises: {
    putInOrder: "Bring die Wörter in die richtige Reihenfolge:",
    check: "Prüfen",
    findMistake: "Tippe auf den Fehler:",
    replaceWith: (word) => `Ersetze «${word}» durch:`,
    gap: "Lücke",
  },

  flashcards: {
    title: "Üben",
    noDecks: "Noch keine Themen. Füge die Karteikarten hinzu mit",
    topics: "Themen",
    subcategories: "Unterkategorien",
    words: (count) => many(count, "Wort", "Wörter"),
    newCount: (count) => `${count} neu`,
    reviewCount: (count) => many(count, "Wiederholung", "Wiederholungen"),
    doneForToday: "Für heute erledigt",
    nothingLeft: "Für heute nichts mehr übrig",
    startFlashcards: "Karteikarten starten",
    seeWordList: "Wortliste ansehen",
    shuffle: "Diese Kategorie gemischt lernen",
    allDone: "Für heute alles erledigt",
    comeBackTomorrow: (deck) => `Komm morgen wieder, dann geht es mit ${deck} weiter.`,
    wordListTitle: (deck) => `${deck}: Wörter`,
    kindLabel: "Was du üben möchtest",
    vocabulary: "Wortschatz",
    grammar: "Grammatik",
    rules: (count) => many(count, "Regel", "Regeln"),
    startPractice: "Üben starten",
    seeRules: "Regeln ansehen",
    ruleListTitle: (deck) => `${deck}: Regeln`,
    newRule: "Neu",
    swissGerman: "Schweizerdeutsch",
    translation: "Hochdeutsch",
  },

  goal: {
    heading: "Tagesziel",
    reached: "Erreicht",
    edit: "Bearbeiten",
    editLabel: "Tagesziel bearbeiten",
    newWords: "Neue Wörter",
    cardsReviewed: "Wiederholte Karten",
    nothingToReview: "Nichts zu wiederholen",
    sheetTitle: "Wähle dein tägliches Lerntempo",
    close: "Schliessen",
    paceLabel: "Tägliches Lerntempo",
    presets: { relaxed: "Locker", steady: "Stetig", intensive: "Intensiv" },
    newCards: (count) => `${count} neue Karten`,
    upToReviews: (count) => `bis zu ${count} Wiederholungen`,
    note: "Dein Wiederholungsplan wird automatisch aus der Anzahl neuer Karten berechnet. Wie viele Wiederholungen du bekommst, hängt von deinem Fortschritt ab: Es ist ein tägliches Maximum, kein Pensum, das du erfüllen musst.",
    notSaved: (error) => `Nicht gespeichert: ${error}`,
    saving: "Wird gespeichert…",
    save: "Änderungen speichern",
  },

  session: {
    empty:
      "Für heute nichts mehr übrig: Du hast dein Tagesziel erreicht, oder es gibt noch nichts zu wiederholen.",
    backTo: (place) => `Zurück zu ${place}`,
    leave: "Sitzung verlassen",
    progress: "Fortschritt der Sitzung",
    swap: "Kartenrichtung wechseln",
    showingSwissGermanFirst: "Zeigt zuerst Schweizerdeutsch. Stattdessen zuerst Hochdeutsch zeigen",
    showingTranslationFirst: "Zeigt zuerst Hochdeutsch. Stattdessen zuerst Schweizerdeutsch zeigen",
    tapToReveal: "Tippe auf die Karte, um sie umzudrehen",
    notSaved: (error) =>
      `Deine Antwort wurde nicht gespeichert: ${error}. Wähle nochmals, um es erneut zu versuchen.`,
    grades: { again: "Nochmals", hard: "Schwer", good: "Gut", easy: "Einfach" },
    statuses: { new: "Neu", learning: "Am Lernen", review: "Wiederholung" },
    newWordsLearned: (count) => many(count, "neues Wort gelernt", "neue Wörter gelernt"),
    wordsReviewed: (count) => many(count, "Wort wiederholt", "Wörter wiederholt"),
    newRulesLearned: (count) => many(count, "neue Regel gelernt", "neue Regeln gelernt"),
    rulesPractised: (count) => many(count, "Regel geübt", "Regeln geübt"),
    correct: "Richtig!",
    notQuite: "Nicht ganz",
    yourAnswer: "Deine Antwort",
    correctAnswer: "Richtige Antwort",
    continue: "Weiter",
    saving: "Wird gespeichert…",
    tryAgain: "Nochmals versuchen",
    answerNotSaved: (error) => `Deine Antwort wurde nicht gespeichert: ${error}`,
    goalReached: "Tagesziel erreicht!",
    goalReachedNote: "Das war’s für heute. Bis morgen!",
    playPronunciation: "Aussprache abspielen",
    noRecording: "Noch keine Aufnahme",
  },

  onboarding: {
    title: "Willkommen",
    step: (current, total) => `Schritt ${current} von ${total}`,
    back: "Zurück",
    next: "Weiter",
    skip: "Überspringen",
    language: {
      heading: "Welche Sprache bevorzugst du?",
      intro: "Hoi verwendet sie überall. Du kannst sie jederzeit ändern.",
    },
    level: {
      heading: "Wie gut kennst du Schweizerdeutsch?",
      options: {
        new: { label: "Ich fange gerade an", hint: "Schweizerdeutsch ist neu für mich" },
        few_words: { label: "Ich kenne ein paar Wörter", hint: "Wie Grüezi und Merci" },
        understands: { label: "Ich verstehe schon einiges", hint: "Aber ich spreche es noch nicht" },
        speaks: { label: "Ich kann ein einfaches Gespräch führen", hint: "Und möchte besser werden" },
      },
    },
    topics: {
      heading: "Welche Themen interessieren dich?",
      intro: "Wähle so viele, wie du möchtest. Wir zeigen sie dir zuerst.",
    },
    pace: {
      heading: "So funktioniert Hoi",
      points: [
        { icon: "📚", text: "Du lernst jeden Tag ein paar neue Wörter." },
        { icon: "🔁", text: "Hoi zeigt dir jedes Wort wieder, kurz bevor du es vergessen würdest." },
        { icon: "⏱️", text: "Ein paar Minuten am Tag reichen." },
      ],
      choose: "Wähle dein Tempo",
      recommended: "Empfohlen",
      finish: "Los geht’s",
      saving: "Wird gespeichert…",
      notSaved: (error) => `Nicht gespeichert: ${error}`,
    },
  },

  intervals: { minutes: "Min.", hours: "Std.", days: "T.", months: "Mt.", years: "J." },
};
