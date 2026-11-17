// Vocabulary is single words, sentences or expressions. Learners practise and list them all
// together, which is the default, or words and phrases (sentences and expressions) apart.
export const VOCABULARY_FILTERS = ["all", "words", "phrases"] as const;
export type VocabularyFilter = (typeof VOCABULARY_FILTERS)[number];

// Matches the check on public.vocabulary_items.type.
const TYPES: Record<Exclude<VocabularyFilter, "all">, string[]> = {
  words: ["word"],
  phrases: ["sentence", "expression"],
};

// The filter in the "cards" search parameter. Anything else, or none, means all of them.
export function vocabularyFilter(value: unknown): VocabularyFilter {
  return value === "words" || value === "phrases" ? value : "all";
}

// The vocabulary types a filter keeps, or undefined for every type.
export function typesOf(filter: VocabularyFilter): string[] | undefined {
  return filter === "all" ? undefined : TYPES[filter];
}

export function keeps(filter: VocabularyFilter, type: string): boolean {
  return filter === "all" || TYPES[filter].includes(type);
}

// The search to add to a link for this filter, empty for all.
export function filterSearch(filter: VocabularyFilter): string {
  return filter === "all" ? "" : `?cards=${filter}`;
}

// Whether a deck has words as well as sentences or expressions, so practising or listing them
// apart is a choice at all.
export function hasWordsAndPhrases(deck: { card_count: number; phrase_count: number }): boolean {
  return deck.phrase_count > 0 && deck.phrase_count < deck.card_count;
}
