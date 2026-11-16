import type { ReactNode } from "react";
import { ButtonLink } from "@/app/ui/button";
import { Icon } from "@/app/ui/icons";
import { ListRow, ListRows } from "@/app/ui/list-row";

// Developer preview only: making clear why one module in the Learn tab is large, and offering the
// choice to continue or start over on the module's own page rather than in the list.

// The module opened last, as the Learn tab shows it, with a label saying why it's large.
function CurrentCard({ label }: { label?: ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-3xl bg-sage p-6">
      {label}
      <span className="flex flex-col gap-4">
        <Icon name="headphones" size={28} />
        <span className="flex flex-col gap-1">
          <span className="text-caption font-semibold tracking-[0.08em] uppercase">Modul 1</span>
          <span className="text-heading font-bold">Aussprache</span>
          <span className="text-body">So klingt Berndeutsch</span>
          <span className="text-caption">2 Lektionen · 10 Themen</span>
        </span>
      </span>
      <ButtonLink href="#">Weiter: R</ButtonLink>
    </li>
  );
}

function LearnList({ label, heading }: { label?: ReactNode; heading?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-ivory p-4 outline-2 outline-mist">
      {heading && (
        <span className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{heading}</span>
      )}
      <ol className="flex flex-col gap-3">
        <CurrentCard label={label} />
        <ListRow href="#" icon="link" eyebrow="Modul 2" title="Verwandte Wörter" caption="4 Lektionen · 14 Themen" />
        <ListRow href="#" icon="sparkles" eyebrow="Modul 3" title="Neue Wörter" caption="3 Lektionen" />
      </ol>
    </div>
  );
}

// The end of a module's page when the learner has been in it before.
function ModuleEnd() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-ivory p-4 outline-2 outline-mist">
      <span className="text-heading font-bold">Lektionen</span>
      <ListRows>
        <ListRow href="#" title="Konsonanten" caption="6 Themen" />
        <ListRow href="#" title="Vokale" caption="4 Themen" />
      </ListRows>
      <div className="flex flex-col gap-3">
        <ButtonLink href="#" className="min-h-14">
          Weiter: R
        </ButtonLink>
        <ButtonLink href="#" variant="secondary" className="min-h-14">
          Von vorne
        </ButtonLink>
      </div>
    </div>
  );
}

function Option({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex flex-col">
        <span className="text-body font-bold">{title}</span>
        <span className="text-caption text-teal-soft">{note}</span>
      </span>
      {children}
    </div>
  );
}

export function ContinuePreview() {
  return (
    <div className="flex flex-col gap-10">
      <Option title="Jetzt" note="Die grosse Karte ohne Erklärung.">
        <LearnList />
      </Option>
      <Option title="1a · Etikett in der Karte" note="Eine helle Pill oben in der Karte.">
        <LearnList
          label={
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-ivory px-2.5 py-0.5 text-caption font-semibold">
              <Icon name="clock" size={16} />
              Zuletzt geöffnet
            </span>
          }
        />
      </Option>
      <Option title="1b · Überschrift über der Liste" note="«Weitermachen» als kleine Überschrift über der Karte.">
        <LearnList heading="Weitermachen" />
      </Option>
      <Option
        title="2 · Weiter oder von vorne, auf der Modulseite"
        note="Nur wenn man schon in diesem Modul war. Sonst bleibt es bei «Los geht’s»."
      >
        <ModuleEnd />
      </Option>
    </div>
  );
}
