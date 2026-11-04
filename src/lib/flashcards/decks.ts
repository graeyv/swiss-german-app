// Matches the check on public.decks.color.
export const DECK_COLORS = ["pink", "blue", "green", "yellow", "purple", "orange"] as const;
export type DeckColor = (typeof DECK_COLORS)[number];

// Matches the check on public.decks.kind: decks of words, or of grammar rules.
export type DeckKind = "vocabulary" | "grammar";

// A row of the flashcard_decks database function.
export type DeckRow = {
  id: string;
  parent_id: string | null;
  code: string;
  kind: DeckKind;
  title: string;
  emoji: string | null;
  description: string | null;
  color: DeckColor | null;
  deck_position: number;
  card_count: number;
  due_count: number;
  // The part of due_count that are words the learner already knows, which the daily limit caps.
  due_review_count: number;
  new_count: number;
};

// color is never null here: a deck without its own takes its parent's.
export type DeckNode = Omit<DeckRow, "color"> & { color: DeckColor; children: DeckNode[] };

// Decks without cards stay hidden, so the tree can be filled in topic by topic.
export function buildDeckTree(rows: readonly DeckRow[]): DeckNode[] {
  const build = (parentId: string | null, parentColor: DeckColor): DeckNode[] =>
    rows
      .filter((row) => row.parent_id === parentId && row.card_count > 0)
      .sort((a, b) => a.deck_position - b.deck_position)
      .map((row) => {
        const color = row.color ?? parentColor;
        return { ...row, color, children: build(row.id, color) };
      });

  return build(null, "yellow");
}

// The decks a learner chose as interests come first, in their usual order, then the rest.
export function sortByInterests<Deck extends { code: string }>(
  decks: readonly Deck[],
  interests: readonly string[],
): Deck[] {
  return [
    ...decks.filter((deck) => interests.includes(deck.code)),
    ...decks.filter((deck) => !interests.includes(deck.code)),
  ];
}

// The deck with this code, and the decks above it from the top level down.
export function findDeck(
  tree: readonly DeckNode[],
  code: string,
): { deck: DeckNode; ancestors: DeckNode[] } | null {
  for (const deck of tree) {
    if (deck.code === code) return { deck, ancestors: [] };
    const found = findDeck(deck.children, code);
    if (found) return { deck: found.deck, ancestors: [deck, ...found.ancestors] };
  }
  return null;
}

// The flashcards overview, showing decks of this kind.
export function overviewHref(kind: DeckKind) {
  return kind === "grammar" ? "/flashcards?kind=grammar" : "/flashcards";
}
