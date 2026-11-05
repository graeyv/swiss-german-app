"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

type TabLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  // The bar floating at the bottom on phones, or the tabs under the header on wider screens.
  placement: "bottom" | "top";
};

// Pages below a tab with a dynamic segment only know their URL at request time, so the tab
// renders unhighlighted until it does.
export function TabLink(props: TabLinkProps) {
  return (
    <Suspense fallback={<TabLinkView {...props} active={false} />}>
      <ActiveTabLink {...props} />
    </Suspense>
  );
}

function ActiveTabLink(props: TabLinkProps) {
  const pathname = usePathname();
  const active = pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <TabLinkView {...props} active={active} />;
}

function TabLinkView({ href, label, icon, placement, active }: TabLinkProps & { active: boolean }) {
  if (placement === "bottom") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold transition-colors ${
          active ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
        }`}
      >
        <span aria-hidden className="size-6">
          {icon}
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-3 font-semibold transition-colors ${
        active ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      <span aria-hidden className="size-5">
        {icon}
      </span>
      {label}
    </Link>
  );
}
