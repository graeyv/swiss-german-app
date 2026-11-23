import { ListRow, ListRows } from "@/app/ui/list-row";

// Developer preview only: Lernen's module list with how far each module is read, in its three
// states (read through, started, not started) and a module still being written. As wide as on an
// iPhone (390 px screen).
export function ModuleProgressPreview() {
  return (
    <div className="flex w-[342px] max-w-full flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">Alle Module</h3>
      <ListRows>
        <ListRow href="#" icon="wave" eyebrow="Modul 1" title="Bevor du startest" caption="Alles gelesen" done />
        <ListRow href="#" icon="speaking" eyebrow="Modul 2" title="Aussprache" caption="4 von 10 Themen gelesen" />
        <ListRow href="#" icon="puzzle" eyebrow="Modul 3" title="Grammatik" caption="4 Lektionen · 12 Themen" />
        <ListRow href="#" icon="chat" eyebrow="Modul 4" title="Alltag" comingSoon="Bald verfügbar" />
      </ListRows>
    </div>
  );
}
