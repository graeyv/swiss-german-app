import type { ReactNode } from "react";
import { Icon } from "./icon";

// What to remember from a rule ("Merke"): a yellow card, a lightbulb and the label on top, the
// sentence below. The rule screen's one yellow element. See DESIGN.md.
export function Takeaway({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-yellow p-5">
      <p className="flex items-center gap-2 text-caption font-semibold tracking-[0.08em] uppercase">
        <Icon name="bulb" />
        {label}
      </p>
      <p className="text-body font-semibold">{children}</p>
    </div>
  );
}
