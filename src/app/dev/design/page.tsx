import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import atHome from "../../../../public/illustrations/topics/at-home.png";
import socialLife from "../../../../public/illustrations/topics/social-life.png";
import { ExampleList } from "@/app/learn/[dialect]/[lesson]/[section]/[rule]/example-list";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { Button } from "@/app/ui/button";
import { Icon, type IconName } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { ProgressBar } from "@/app/ui/progress-bar";
import { Card, Pill } from "@/app/ui/surface";
import { Takeaway } from "@/app/ui/takeaway";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { dictionary } from "@/lib/i18n";
import { findLesson, findRule } from "@/lib/learn/lessons";
import { devOnly } from "../exercises/data";
import { GradePreview } from "./grade-preview";
import { ComingSoonPreview } from "./coming-soon-preview";
import { LearnPathWithProgress } from "./learn-preview";
import { LogoPreview } from "./logo-preview";

// Developer tool: everything DESIGN.md defines, in one place, to check the look at phone width
// before it goes onto the screens. German, like the model screen.
export default function DevDesignPage() {
  devOnly();
  return (
    <main lang="de" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-12 px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <title>Design – dev</title>
      <div className="flex flex-col gap-1">
        <Eyebrow>Developer tool</Eyebrow>
        <h1 className="text-title font-bold">Design</h1>
        <p className="text-body text-teal-soft">Alles aus DESIGN.md, so wie es auf den Screens aussieht.</p>
      </div>

      <Part title="Logo">
        <LogoPreview />
      </Part>

      <Part title="Themen-Kachel: bald verfügbar (iPhone-Breite)">
        <ComingSoonPreview />
      </Part>

      <Part title="Farben">
        <ul className="grid grid-cols-2 gap-3">
          {COLOURS.map(([token, hex, role, swatch]) => (
            <li key={token} className="flex flex-col gap-2">
              <span className={`h-16 rounded-3xl ${swatch}`} />
              <span className="flex flex-col">
                <span className="text-body font-bold">{token}</span>
                <span className="text-caption text-teal-soft">
                  {hex} · {role}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Schrift">
        <div className="flex flex-col gap-3">
          <p className="text-title font-bold">Title 32</p>
          <p className="text-heading font-bold">Section header 22</p>
          <p className="text-subtitle font-semibold">Subtitle 20</p>
          <p className="text-body">Body 17: Entdecke die wichtigsten Unterschiede.</p>
          <p className="text-body font-bold">Row title 17</p>
          <p className="text-caption text-teal-soft">Caption 14</p>
          <Eyebrow>Eyebrow 14</Eyebrow>
        </div>
      </Part>

      <Part title="Modul (Vorlage)">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>Modul 1</Eyebrow>
              <h2 className="text-title font-bold">Aussprache</h2>
            </div>
            <p className="text-subtitle font-semibold">
              <Highlight>So klingt Berndeutsch</Highlight>
            </p>
            <p className="text-body">
              Entdecke die wichtigsten Unterschiede zwischen der Aussprache im Hochdeutschen und im
              Berndeutschen.
            </p>
          </div>

          <section className="flex flex-col gap-4">
            <h3 className="text-heading font-bold">Was dich erwartet</h3>
            <ul className="flex flex-col gap-4">
              <IconLine icon="headphones">Den Unterschied hören</IconLine>
              <IconLine icon="mic">Die Laute selbst sprechen</IconLine>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-heading font-bold">Themen</h3>
            <ListRows>
              <ListRow href="/dev/design" title="Konsonanten" caption="6 Themen" />
              <ListRow href="/dev/design" title="Vokale" caption="4 Themen" />
            </ListRows>
          </section>

          <Button>Los geht&apos;s</Button>
        </div>
      </Part>

      <Part title="Lernen-Tab später, mit gespeichertem Fortschritt">
        <LearnPathWithProgress />
      </Part>

      <Part title="Buttons">
        <div className="flex flex-col gap-3">
          <Button>Primär</Button>
          <Button variant="secondary">Sekundär</Button>
          <Button disabled>Nicht verfügbar</Button>
        </div>
      </Part>

      <Part title="Karten und Pills">
        <div className="flex flex-col gap-3">
          <Card>
            <p className="text-body font-bold">Mist</p>
            <p className="text-caption text-teal-soft">Alltägliche Karte</p>
          </Card>
          <Card tone="sage">
            <p className="text-body font-bold">Sage</p>
            <p className="text-caption">Hebt eine Gruppe hervor</p>
          </Card>
          <Card tone="yellow">
            <p className="text-body font-bold">🎯 Tagesziel erreicht</p>
            <p className="text-caption">Gelb nur für Erfolge, einmal pro Screen</p>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Pill tone="sage">= gleich</Pill>
            <Pill>Wiederholung</Pill>
            <Pill tone="teal">Neu</Pill>
          </div>
        </div>
      </Part>

      <Part title="Fortschritt">
        <ProgressBar value={3} max={10} label="3 von 10" />
      </Part>

      <Part title="Richtig und falsch">
        <div className="flex flex-col gap-3">
          <p className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl px-6 text-body font-semibold ${answerClass(true)}`}>
            Chuchichäschtli
            <AnswerMark correct label="Richtig" />
          </p>
          <p className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl px-6 text-body font-semibold ${answerClass(false)}`}>
            Kuchikästli
            <AnswerMark correct={false} label="Falsch" />
          </p>
          <p className="text-caption text-brick">Speichern hat nicht geklappt. Versuch es nochmal.</p>
        </div>
      </Part>

      <Part title="Beispiele einer Regel">
        <ExampleList examples={EXAMPLES} dialectName="Berndeutsch" t={dictionary("de").lesson} />
      </Part>

      <Part title="Merke">
        <Takeaway label="Merke">{CH.takeaway}</Takeaway>
      </Part>

      <Part title="Bewertung einer Karte">
        <GradePreview />
      </Part>

      <Part title="Icons">
        <ul className="flex flex-wrap gap-6">
          {ICONS.map((name) => (
            <li key={name} className="flex flex-col items-center gap-1">
              <Icon name={name} size={28} />
              <span className="text-caption text-teal-soft">{name}</span>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Themen mit Illustration (Test)">
        <ul className="grid grid-cols-2 gap-3">
          {ILLUSTRATIONS.map(({ image, title, caption }) => (
            <li key={title} className="flex flex-col gap-3 overflow-hidden rounded-3xl bg-mist pb-4">
              {/* Without its own background: sage-light behind it sets it off from the tile. */}
              <Image src={image} alt="" quality={90} sizes="(min-width: 36rem) 17rem, 50vw" className="aspect-[3/2] w-full bg-sage-light" />
              <span className="flex flex-col px-4">
                <span className="text-body font-bold">{title}</span>
                <span className="text-caption text-teal-soft">{caption}</span>
              </span>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Themenseite: Kopf mit Illustration">
        <TopicHeader />
      </Part>

    </main>
  );
}

// The top of a topic's page: its illustration as a 2:1 banner, whole and centred on sage-light,
// since cropping it cuts off heads and feet.
function TopicHeader() {
  return (
    <div className="flex flex-col gap-6">
      <Image
        src={atHome}
        alt=""
        quality={90}
        sizes="(min-width: 36rem) 33rem, 100vw"
        className="aspect-[2/1] w-full rounded-3xl bg-sage-light object-contain"
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-title font-bold">Zuhause</h2>
        <p className="text-body text-teal-soft">Wohnen & Haushalt</p>
      </div>
      <ListRows>
        <ListRow icon="sunrise" title="Morgenroutine" caption="Bald verfügbar" />
        <ListRow icon="pot" title="In der Küche" caption="Bald verfügbar" />
        <ListRow icon="washer" title="Putzen & Waschen" caption="Bald verfügbar" />
      </ListRows>
    </div>
  );
}

// Full class names, so Tailwind finds them in the source.
const COLOURS = [
  ["teal", "#0F4C4A", "Text, Icons, Aktionen", "bg-teal"],
  ["teal-soft", "#3F6F6D", "Nebentext", "bg-teal-soft"],
  ["sage", "#A7C4A0", "Gruppen, richtig", "bg-sage"],
  ["sage-light", "#D1DFCB", "Bewertung «Gut»", "bg-sage-light"],
  ["mist", "#E6EFE9", "Zeilen, Linien", "bg-mist"],
  ["yellow", "#FFE08A", "Erfolge, Auswahl", "bg-yellow"],
  ["ivory", "#FAF9F6", "Hintergrund", "bg-ivory ring-1 ring-mist ring-inset"],
  ["rose", "#F6DED8", "falsch", "bg-rose"],
  ["brick", "#A63D2F", "Fehler, löschen", "bg-brick"],
] as const;

// The CH rule, which has recordings and a sound that stays the same, plus "müed" from Ü, to show a
// word only Berndeutsch has.
const pronunciation = findLesson("be", "pronunciation")!.lesson;
const CH = findRule(pronunciation, "consonants", "ch")!.rule;
const EXAMPLES = [
  ...CH.examples,
  ...findRule(pronunciation, "vowels", "ue")!.rule.examples.filter(({ word }) => word === "müed"),
];

// The new overarching topics that have an illustration yet. The others follow once they're made.
const ILLUSTRATIONS: { image: StaticImageData; title: string; caption: string }[] = [
  { image: socialLife, title: "Freizeit", caption: "Treffen & Ausgehen" },
  { image: atHome, title: "Zuhause", caption: "Wohnen & Haushalt" },
];

const ICONS: IconName[] = [
  "back",
  "forward",
  "check",
  "cross",
  "headphones",
  "mic",
  "bulb",
  "again",
  "hard",
  "good",
  "easy",
  "clock",
  "link",
  "sparkles",
  "puzzle",
  "chat",
  "sunrise",
  "pot",
  "washer",
  "sofa",
  "building",
  "coffee",
  "user",
  "users",
  "wine",
  "bike",
  "sun",
  "phone",
  "clipboard",
  "cart",
  "pill",
  "mail",
  "banknote",
  "scissors",
  "shirt",
  "tram",
  "pin",
  "suitcase",
  "wave",
  "activity",
  "palette",
  "box",
  "question",
  "calendar",
  "cards",
  "learn",
  "practice",
  "talk",
  "profile",
  "shuffle",
  "swap",
  "restart",
  "skip",
  "signOut",
  "play",
  "pause",
  "speaker",
  "gear",
  "timer",
  "grid",
  "globe",
];

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{title}</h2>
      {children}
    </section>
  );
}

function IconLine({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="flex items-center gap-4">
      <Icon name={icon} size={28} className="text-teal-soft" />
      <span className="text-body">{children}</span>
    </li>
  );
}
