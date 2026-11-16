// Where the learner left off in Learn: the module they opened last, and the topic in it if they
// got that far. Kept in a cookie on the device, so the Learn tab can show that module large without
// a saved history. Saving progress per topic is still to come.
export const LAST_OPENED_COOKIE = "hoi-last-opened";

export type Place = { dialect: string; lesson: string; section?: string; rule?: string };

// The cookie holds a path such as "be/pronunciation" or "be/pronunciation/consonants/r".
export function parsePlace(value: string | undefined): Place | undefined {
  const parts = value?.split("/") ?? [];
  if (parts.length !== 2 && parts.length !== 4) return undefined;
  if (parts.some((part) => !/^[a-z0-9-]+$/.test(part))) return undefined;
  const [dialect, lesson, section, rule] = parts;
  return section ? { dialect, lesson, section, rule } : { dialect, lesson };
}

// The place to remember on opening a page. Opening a module's overview again keeps the topic the
// learner was at in that module.
export function nextPlace(previous: string | undefined, opened: string): string {
  const before = parsePlace(previous);
  const now = parsePlace(opened);
  if (!now) return previous ?? "";
  if (!now.section && before?.section && before.dialect === now.dialect && before.lesson === now.lesson) {
    return previous!;
  }
  return opened;
}
