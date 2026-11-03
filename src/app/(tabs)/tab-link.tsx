"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";

type TabLinkProps = { href: string; children: ReactNode };

// Pages below a tab with a dynamic segment only know their URL at request time, so the tab
// renders unhighlighted until it does.
export function TabLink(props: TabLinkProps) {
  return (
    <Suspense fallback={<TabLinkView {...props} active={false} />}>
      <ActiveTabLink {...props} />
    </Suspense>
  );
}

function ActiveTabLink({ href, children }: TabLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <TabLinkView href={href} active={active}>
      {children}
    </TabLinkView>
  );
}

function TabLinkView({ href, children, active }: TabLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 pb-3 font-semibold transition-colors ${
        active ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
