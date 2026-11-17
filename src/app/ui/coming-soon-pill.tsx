import { Icon } from "./icons";

// Marks a topic, subtopic or scene with nothing in it yet, under its title. See DESIGN.md. Small and
// on one line: a tile is only about 165 px wide on a phone.
export function ComingSoonPill({ label }: { label: string }) {
  return (
    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-ivory px-2 py-0.5 text-[0.75rem] leading-4 font-semibold whitespace-nowrap text-teal">
      <Icon name="clock" size={12} />
      {label}
    </span>
  );
}
