import type { IconName } from "@/app/ui/icon";

// The icon of each subtopic, and of a topic without an illustration, by deck code, instead of
// the emoji in content/decks.tsv: emojis bring colours and a style of their own. A new subtopic
// shows a stack of cards until it gets one.
const ICONS: Record<string, IconName> = {
  // At Home
  "C04-T01": "sunrise",
  "C04-T02": "pot",
  "C04-T03": "washer",
  "C04-T04": "sofa",
  "C04-T05": "building",
  // Social Life
  "C03-T01": "coffee",
  "C03-T02": "user",
  "C03-T03": "chat",
  "C03-T04": "wine",
  "C03-T05": "bike",
  "C03-T06": "sun",
  // At Work
  "C05-T01": "users",
  "C05-T02": "phone",
  "C05-T03": "clipboard",
  // Everyday Services
  "C06-T01": "cart",
  "C06-T02": "pill",
  "C06-T03": "mail",
  "C06-T04": "banknote",
  "C06-T05": "scissors",
  "C06-T06": "shirt",
  // Getting Around
  "C07-T01": "tram",
  "C07-T02": "pin",
  "C07-T03": "suitcase",
  // The Essentials
  "C08-T01": "wave",
  "C08-T02": "activity",
  "C08-T03": "palette",
  "C08-T04": "box",
  "C08-T05": "question",
  "C08-T06": "link",
  "C08-T07": "calendar",
  // Pronouns (grammar), which has no illustration, so its icon also heads its page.
  G01: "users",
  "G01-T01": "user",
};

export function deckIcon(code: string): IconName {
  return ICONS[code] ?? "cards";
}
