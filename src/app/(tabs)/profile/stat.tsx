import { Icon, type IconName } from "@/app/ui/icons";

// A number to be proud of, on its own mist card: its icon in teal-soft, the number large and its
// words below, like the numbers at the end of a session. No emoji, no border. See DESIGN.md.
export function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-mist p-5">
      <Icon name={icon} size={28} className="text-teal-soft" />
      <span className="flex flex-col">
        <span className="text-title leading-none font-bold tabular-nums">{value}</span>
        <span className="text-caption text-teal-soft">{label}</span>
      </span>
    </div>
  );
}
