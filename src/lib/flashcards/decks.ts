export type DeckColor = "pink" | "blue" | "green" | "yellow" | "purple" | "orange";

// A row of the flashcard_decks database function.
export type DeckRow = {
  id: string;
  parent_id: string | null;
  code: string;
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
