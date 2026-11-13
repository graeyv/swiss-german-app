import type { ReactNode } from "react";
import { answerClass, AnswerMark } from "@/app/ui/answer";
import { Button } from "@/app/ui/button";
import { Icon, type IconName } from "@/app/ui/icon";
import { ListRow, ListRows } from "@/app/ui/list-row";
import { ProgressBar } from "@/app/ui/progress-bar";
import { Card, Pill } from "@/app/ui/surface";
import { Eyebrow, Highlight } from "@/app/ui/text";
import { devOnly } from "../exercises/data";

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

      <Part title="Lektion (Vorlage)">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>Lektion 1</Eyebrow>
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
    </main>
  );
}

// Full class names, so Tailwind finds them in the source.
const COLOURS = [
  ["teal", "#0F4C4A", "Text, Icons, Aktionen", "bg-teal"],
  ["teal-soft", "#3F6F6D", "Nebentext", "bg-teal-soft"],
  ["sage", "#A7C4A0", "Gruppen, richtig", "bg-sage"],
  ["mist", "#E6EFE9", "Zeilen, Linien", "bg-mist"],
  ["yellow", "#FFE08A", "Erfolge, Auswahl", "bg-yellow"],
  ["ivory", "#FAF9F6", "Hintergrund", "bg-ivory ring-1 ring-mist ring-inset"],
  ["rose", "#F6DED8", "falsch", "bg-rose"],
  ["brick", "#A63D2F", "Fehler, löschen", "bg-brick"],
] as const;

const ICONS: IconName[] = ["back", "forward", "check", "cross", "headphones", "mic"];

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
      <Icon name={icon} size={28} />
      <span className="text-body">{children}</span>
    </li>
  );
}
