import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";

export type PracticeView = "words" | "lessons";

const VIEWS: { view: PracticeView; href: string }[] = [
  { view: "words", href: "/flashcards" },
  { view: "lessons", href: "/flashcards/lessons" },
];

// Switches the Practice tab between the flashcards ("Wortschatz") and the lessons' exercises
// ("Lektionen"). Each is its own address, so the back button and links return to the same one.
export function PracticeSwitch({ view, locale }: { view: PracticeView; locale: Locale }) {
  const t = dictionary(locale).practice.views;

  return (
    <nav aria-label={t.label} className="grid grid-cols-2 gap-1 rounded-full bg-mist p-1">
      {VIEWS.map((option) => (
        <Link
          key={option.view}
          href={option.href}
          aria-current={option.view === view ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-full font-semibold transition-colors ${
            option.view === view ? "bg-ivory text-teal" : "text-teal-soft"
          }`}
        >
          {t[option.view]}
        </Link>
      ))}
    </nav>
  );
}
