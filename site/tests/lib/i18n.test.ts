import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { t } from "@/lib/i18n";

describe("t", () => {
  it("returns the message for a key", () => {
    expect(t("site.title")).toBe(en.site.title);
  });

  it("interpolates variables", () => {
    expect(t("search.resultsCount", { count: 3 })).toBe("3 results");
  });

  it("leaves a placeholder in place when its variable is missing", () => {
    expect(t("search.resultsCount")).toBe("{count} results");
    expect(t("search.resultsCount", { other: 1 })).toBe("{count} results");
  });
});
