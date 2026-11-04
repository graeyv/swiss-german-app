// "1 word", "3 words": the browser's plural rules pick the form, so languages with more than two
// forms (Polish has three, for example) only need to list them.
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export function plural(locale: string, count: number, forms: PluralForms) {
  const form = forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
  return `${count} ${form}`;
}
