// "1 word", "3 words": the browser's plural rules pick the form, so languages with more than two
// forms (Polish has three, for example) only need to list them.
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export function plural(locale: string, count: number, forms: PluralForms) {
  return `${count} ${pluralForm(locale, count, forms)}`;
}

// The word alone, for when the number shows on its own, such as large above it.
export function pluralForm(locale: string, count: number, forms: PluralForms) {
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}
