import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";
import { dictionary, localeFromAcceptLanguage, LOCALES, translationOf, vocabularyText } from "./index";
import { plural } from "./plural";

describe("localeFromAcceptLanguage", () => {
  it("picks whichever of German and English the browser prefers first", () => {
    expect(localeFromAcceptLanguage("de-CH,de;q=0.9,en;q=0.8")).toBe("de");
    expect(localeFromAcceptLanguage("en-GB,en;q=0.9,de;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-CH,fr;q=0.9,de;q=0.8")).toBe("de");
  });

  it("ignores quality values and region subtags", () => {
    expect(localeFromAcceptLanguage("it-CH;q=0.9, DE-AT ;q=0.8")).toBe("de");
  });

  it("falls back to English", () => {
    expect(localeFromAcceptLanguage("fr-FR")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});

describe("translationOf", () => {
  const card = { meaning: "Good morning", high_german: "Guten Morgen" };

  it("uses the meaning, or the card's High German in German", () => {
    expect(translationOf(card, "en")).toBe("Good morning");
    expect(translationOf(card, "de")).toBe("Guten Morgen");
  });
});

// Every text in a dictionary, including what its functions return for a sample value.
function texts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [String(value(2, "x"))];
  if (value && typeof value === "object") return Object.values(value).flatMap(texts);
  return [];
}

describe("dictionaries", () => {
  it("use Swiss Standard German spelling, without ß", () => {
    expect(texts(de).filter((text) => text.includes("ß"))).toEqual([]);
  });

  it("have no empty texts", () => {
    expect(texts(en).filter((text) => !text.trim())).toEqual([]);
    expect(texts(de).filter((text) => !text.trim())).toEqual([]);
  });

  it("pluralise in both languages", () => {
    expect(en.flashcards.reviewCount(1)).toBe("1 review");
    expect(en.flashcards.reviewCount(3)).toBe("3 reviews");
    expect(de.flashcards.reviewCount(1)).toBe("1 Wiederholung");
    expect(de.flashcards.reviewCount(3)).toBe("3 Wiederholungen");
  });
});

describe("languages", () => {
  it("each have a dictionary that names itself", () => {
    expect(LOCALES).toEqual(["en", "de"]);
    expect(LOCALES.map((locale) => dictionary(locale).languageName)).toEqual(["English", "Deutsch"]);
  });
});

describe("plural", () => {
  it("follows each language's plural rules, with other as the fallback", () => {
    expect(plural("en", 1, { one: "word", other: "words" })).toBe("1 word");
    expect(plural("en", 0, { one: "word", other: "words" })).toBe("0 words");
    // Polish has a separate form for 2–4.
    const forms = { one: "słowo", few: "słowa", many: "słów", other: "słowa" };
    expect([1, 3, 5].map((count) => plural("pl", count, forms))).toEqual(["1 słowo", "3 słowa", "5 słów"]);
  });
});

describe("vocabularyText", () => {
  const rows = [
    { locale: "en", meaning: "Hello", notes: "Polite." },
    { locale: "fr", meaning: "Bonjour", notes: null },
  ];

  it("uses the language's own text, and English for whatever it's missing", () => {
    expect(vocabularyText(rows, "en")).toEqual({ meaning: "Hello", notes: "Polite." });
    expect(vocabularyText(rows as never, "fr" as never)).toEqual({ meaning: "Bonjour", notes: "Polite." });
    expect(vocabularyText(rows, "de")).toEqual({ meaning: "Hello", notes: "Polite." });
  });
});
