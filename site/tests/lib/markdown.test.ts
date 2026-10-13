import { describe, expect, it } from "vitest";
import { rewriteRelativeLink } from "@/lib/markdown/links";

const R = "https://github.com/KateySt/plugin-claude-code";
const SRC = "plugins/p/skills/s/SKILL.md";

describe("rewriteRelativeLink", () => {
  it("resolves a sibling path to a GitHub blob URL", () => {
    expect(rewriteRelativeLink("references/a.md", SRC, R)).toBe(
      `${R}/blob/main/plugins/p/skills/s/references/a.md`,
    );
  });

  it("resolves parent segments", () => {
    expect(rewriteRelativeLink("../x.md", SRC, R)).toBe(
      `${R}/blob/main/plugins/p/skills/x.md`,
    );
  });

  it("leaves absolute, anchor and mailto links unchanged", () => {
    for (const href of ["https://example.com/a", "#top", "mailto:a@b.co"]) {
      expect(rewriteRelativeLink(href, SRC, R)).toBe(href);
    }
  });
});
