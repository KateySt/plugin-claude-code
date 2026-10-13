// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkBasePath } from "@/scripts/check-base-path.mjs";

let dir = "";

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

function makeOut(files: Record<string, string>): string {
  dir = mkdtempSync(path.join(tmpdir(), "base-path-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

describe("checkBasePath", () => {
  it("flags root-relative values missing the base path", () => {
    const out = makeOut({
      "index.html":
        '<a href="/plugins/x/">x</a><img src="/plugin-claude-code/a.png">',
    });
    const offenders = checkBasePath(out, "/plugin-claude-code");
    expect(offenders).toHaveLength(1);
    expect(offenders[0]).toContain("href=/plugins/x/");
    expect(offenders[0]).toContain("index.html");
  });

  it("ignores protocol-relative, external, and relative values", () => {
    const out = makeOut({
      "sub/page.html":
        '<a href="//cdn.example.com/a">a</a><a href="https://example.com/">b</a><a href="#top">c</a><a href="mailto:a@b.c">d</a>',
    });
    expect(checkBasePath(out, "/plugin-claude-code")).toEqual([]);
  });

  it("does not accept a sibling prefix as the base path", () => {
    const out = makeOut({
      "a.html": '<a href="/plugin-claude-code-other/">x</a>',
    });
    expect(checkBasePath(out, "/plugin-claude-code")).toHaveLength(1);
  });
});
