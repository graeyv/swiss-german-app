// The top of a tab: its name as the title, below it one line in subtitle size and weight, full
// teal, saying what the tab is for. See DESIGN.md.
export function TabHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-title font-bold">{title}</h1>
      <p className="text-subtitle font-semibold">{intro}</p>
    </div>
  );
}
