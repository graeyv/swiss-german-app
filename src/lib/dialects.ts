// The dialects of Swiss German Hoi teaches or will teach, in the order the onboarding lists them,
// each with its canton's flag in public/flags. soon: not ready yet, and when it comes. Making one
// ready means removing its soon, once its content is in; its id must then be in the dialects
// table (supabase/seed.sql).
export type DialectOption = { id: string; name: string; flag: string; soon?: "beforeLaunch" | "later" };

export const DIALECT_OPTIONS: DialectOption[] = [
  { id: "zh", name: "Züritüütsch", flag: "/flags/zh.svg", soon: "beforeLaunch" },
  { id: "be", name: "Bärndütsch", flag: "/flags/be.svg" },
  { id: "bs", name: "Baaseldytsch", flag: "/flags/bs.svg", soon: "later" },
];

export function isReadyDialect(id: string) {
  return DIALECT_OPTIONS.some((dialect) => dialect.id === id && !dialect.soon);
}

// The dialect chosen to begin with: the only one ready, while there's just one.
export function defaultDialect(): string | null {
  const ready = DIALECT_OPTIONS.filter((dialect) => !dialect.soon);
  return ready.length === 1 ? ready[0].id : null;
}
