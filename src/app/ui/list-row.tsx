import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

// Rows to open one by one, such as a lesson's topics. See DESIGN.md.
export function ListRows({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-3">{children}</ul>;
}

type ListRowProps = {
  // Without one, the row only shows what's there, such as a section still being written: no arrow,
  // nothing to tap.
  href?: string;
  title: string;
  // The line below the title, such as "6 Themen".
  caption?: string;
  // Leads the row, such as a lesson's icon.
  icon?: IconName;
};

// A row on mist: bold title, caption below, an arrow on the right. The whole row is the tap target.
export function ListRow({ href, title, caption, icon }: ListRowProps) {
  const text = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-body font-bold">{title}</span>
      {caption && <span className="text-caption text-teal-soft">{caption}</span>}
    </span>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4 transition-transform active:scale-[0.98]"
        >
          {icon && <Icon name={icon} size={28} />}
          {text}
          <Icon name="forward" />
        </Link>
      ) : (
        <div className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4">
          {icon && <Icon name={icon} size={28} />}
          {text}
        </div>
      )}
    </li>
  );
}
