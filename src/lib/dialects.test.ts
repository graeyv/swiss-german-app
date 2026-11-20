import { describe, expect, it } from "vitest";
import { defaultDialect, DIALECT_OPTIONS, isReadyDialect } from "./dialects";

describe("dialects", () => {
  it("chooses Bärndütsch while it's the only dialect ready", () => {
    expect(DIALECT_OPTIONS.filter((dialect) => !dialect.soon).map(({ id }) => id)).toEqual(["be"]);
    expect(defaultDialect()).toBe("be");
  });

  it("lets only ready dialects be chosen", () => {
    expect(isReadyDialect("be")).toBe(true);
    expect(isReadyDialect("zh")).toBe(false);
    expect(isReadyDialect("xx")).toBe(false);
  });
});
