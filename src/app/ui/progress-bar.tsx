// A progress bar from DESIGN.md: track in mist, fill in teal. label names it for screen readers.
type ProgressBarProps = { value: number; max: number; label: string; className?: string };

export function ProgressBar({ value, max, label, className = "" }: ProgressBarProps) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-2 overflow-hidden rounded-full bg-mist ${className}`}
    >
      <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${share * 100}%` }} />
    </div>
  );
}
