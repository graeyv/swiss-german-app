import { Fragment, type ReactNode } from "react";

// The app's name in running text: "hoi", lowercase and in italics, as the logo writes it, so it
// reads as the name and not as the greeting. See DESIGN.md.
export function AppName() {
  return <i className="italic">hoi</i>;
}

// A text with the app's name in it, written "hoi" in lowercase, with the name set as AppName.
// The greeting keeps its capital ("Hoi zäme!"), so it's left as it is.
export function withAppName(text: string): ReactNode {
  const parts = text.split(/\bhoi\b/);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <AppName />}
      {part}
    </Fragment>
  ));
}
