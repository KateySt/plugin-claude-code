import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/lib/catalog/load";
import {
  bundleCommands,
  bundleSettings,
  bundleSourceFrom,
} from "@/lib/bundle/settings";
import { parseBundleParam, serializeBundleParam } from "@/lib/bundle/param";

const realCatalog = loadCatalog(path.resolve(__dirname, "../../.."));
const src = bundleSourceFrom(realCatalog);

describe("bundleSettings", () => {
  it("matches the exact settings JSON from spec §9", () => {
    expect(bundleSettings(["sdd-engineering", "agent-harness"], src)).toEqual({
      extraKnownMarketplaces: {
        "kateyst-plugins": {
          source: { source: "github", repo: "KateySt/plugin-claude-code" },
        },
      },
      enabledPlugins: {
        "agent-harness@kateyst-plugins": true,
        "sdd-engineering@kateyst-plugins": true,
        "superpowers@claude-plugins-official": true,
      },
    });
  });

  it("gives an empty enabledPlugins for an empty bundle", () => {
    expect(bundleSettings([], src).enabledPlugins).toEqual({});
  });
});

describe("bundleCommands", () => {
  it("emits one marketplace add and one project-scoped install", () => {
    expect(bundleCommands(["agent-harness"], src)).toEqual([
      "claude plugin marketplace add KateySt/plugin-claude-code",
      "claude plugin install agent-harness@kateyst-plugins --scope project",
    ]);
  });
});

describe("parseBundleParam", () => {
  it("trims, drops empties, dedupes, and splits known from unknown", () => {
    expect(parseBundleParam(" a, ,b,a,zzz ", ["a", "b"])).toEqual({
      plugins: ["a", "b"],
      unknown: ["zzz"],
    });
  });

  it("returns empty lists for a null param", () => {
    expect(parseBundleParam(null, ["a"])).toEqual({ plugins: [], unknown: [] });
  });
});

describe("serializeBundleParam", () => {
  it("sorts and joins with a comma", () => {
    expect(serializeBundleParam(["superpowers", "agent-harness"])).toBe(
      "agent-harness,superpowers",
    );
  });
});
