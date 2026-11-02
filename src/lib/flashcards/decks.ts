// A row of the flashcard_decks database function.
export type DeckRow = {
  id: string;
  parent_id: string | null;
  code: string;
  title: string;
  deck_position: number;
  card_count: number;
  due_count: number;
  new_count: number;
};

export type DeckNode = DeckRow & { children: DeckNode[] };

// Decks without cards stay hidden, so the tree can be filled in topic by topic.
export function buildDeckTree(rows: readonly DeckRow[]): DeckNode[] {
  const build = (parentId: string | null): DeckNode[] =>
    rows
      .filter((row) => row.parent_id === parentId && row.card_count > 0)
      .sort((a, b) => a.deck_position - b.deck_position)
      .map((row) => ({ ...row, children: build(row.id) }));

  return build(null);
}
