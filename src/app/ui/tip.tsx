import { Icon } from "./icons";

type TipProps = {
  title: string;
  text: string;
  // Seconds to wait before it rises in, such as until a card has finished turning over.
  delay?: number;
};

// A one-time tip: a yellow card with a lightbulb and a short title, one line below, and a tail at
// the bottom left pointing at what it explains, below it. It rises in once and stays until the
// learner does what it explains, so there's nothing to close. The screen's one yellow. With
// reduced motion, it's simply there. See DESIGN.md.
export function Tip({ title, text, delay = 0 }: TipProps) {
  return (
    <div
      role="note"
      className="relative flex flex-col gap-1 rounded-3xl bg-yellow p-5 motion-safe:animate-tip-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="flex items-center gap-2 text-body font-bold">
        <Icon name="bulb" size={20} />
        {title}
      </p>
      <p className="text-caption">{text}</p>
      <span aria-hidden className="absolute -bottom-1.5 left-8 size-4 rotate-45 rounded-[3px] bg-yellow" />
    </div>
  );
}
