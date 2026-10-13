import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/lib/catalog/load";
import { cleanQuery } from "@/lib/search/query";
import { toSearchDocs } from "@/lib/search/index-docs";
import { createSearch } from "@/lib/search/engine";

describe("cleanQuery", () => {
  it("strips filler words and keeps real terms", () => {
    expect(cleanQuery("I need a skill for writing AGENTS.md")).toEqual({ terms: "writing agents.md" });
  });
  it("derives a type filter when only filler and a type word remain", () => {
    expect(cleanQuery("I need a skill")).toEqual({ terms: "", typeFilter: "skill" });
    expect(cleanQuery("agent")).toEqual({ terms: "", typeFilter: "agent" });
  });
  it("normalizes whitespace and case", () => {
    expect(cleanQuery("  Spec   Driven ")).toEqual({ terms: "spec driven" });
  });
});

describe("search over the real catalog", () => {
  const catalog = loadCatalog(path.resolve(__dirname, "../../.."));
  const docs = toSearchDocs(catalog);
  const search = createSearch(docs);

  it("builds docs with version only on plugins and truncated bodies", () => {
    expect(docs.length).toBe(catalog.artifacts.length);
    for (const d of docs) {
      if (d.type === "plugin") expect(d.version).toBeDefined();
      else expect(d.version).toBeUndefined();
      expect(d.body.length).toBeLessThanOrEqual(4000);
    }
  });
  it("ranks sdd-engineering first for 'spec driven'", () => {
    expect(search("spec driven", { types: [] })[0].plugin).toBe("sdd-engineering");
  });
  it("filters by type", () => {
    const res = search("agents.md", { types: ["skill"] });
    expect(res.map((r) => r.id)).toContain("agent-harness/skill/setup");
    expect(res.some((r) => r.type === "agent")).toBe(false);
  });
  it("lists all docs passing filters for an empty query", () => {
    expect(search("", { types: ["agent"], plugin: "sdd-engineering" }).length).toBe(7);
    expect(search("", { types: [] })[0].type).toBe("plugin");
  });
  it("tolerates typos", () => {
    expect(search("spec drivn", { types: [] }).some((r) => r.plugin === "sdd-engineering")).toBe(true);
  });
});
