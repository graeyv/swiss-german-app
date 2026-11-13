import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icon";

// Rows to open one by one, such as a lesson's topics. See DESIGN.md.
export function ListRows({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-3">{children}</ul>;
}

type ListRowProps = {
  href: string;
  title: string;
  // The line below the title, such as "6 Themen".
  caption?: string;
};

// A row on mist: bold title, caption below, an arrow on the right. The whole row is the tap target.
export function ListRow({ href, title, caption }: ListRowProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-18 items-center gap-4 rounded-3xl bg-mist px-6 py-4 transition-transform active:scale-[0.98]"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-bold">{title}</span>
          {caption && <span className="text-caption text-teal-soft">{caption}</span>}
        </span>
        <Icon name="forward" />
      </Link>
    </li>
  );
}
