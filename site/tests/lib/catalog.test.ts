import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CatalogError, loadCatalog } from "@/lib/catalog/load";
import { artifactUrl, githubBlobUrl, githubTreeUrl, pluginUrl } from "@/lib/catalog/urls";

const fixtures = path.resolve(__dirname, "../fixtures");
const repo = loadCatalog(path.join(fixtures, "repo"));

describe("loadCatalog (fixture)", () => {
  it("loads both plugins and bare has no artifacts", () => {
    expect(repo.plugins.map((p) => p.name)).toEqual(["alpha", "bare"]);
    expect(repo.plugins[1].artifacts).toEqual([]);
    expect(repo.marketplace).toMatchObject({
      name: "fixture-market",
      repo: "Owner/repo",
      repoUrl: "https://github.com/Owner/repo",
    });
  });

  it("titles skills and flags reference-only ones", () => {
    const skill = repo.artifacts.find((a) => a.id === "alpha/skill/do-thing")!;
    expect(skill.title).toBe("/alpha:do-thing");
    expect(skill.manualOnly).toBe(true);
    expect(skill.meta["argument-hint"]).toBe("[target]");
    expect(skill.sourcePath).toBe("plugins/alpha/skills/do-thing/SKILL.md");
    expect(skill.url).toBe("/plugins/alpha/skill/do-thing/");
    const ref = repo.artifacts.find((a) => a.id === "alpha/skill/background")!;
    expect(ref.title).toBe("alpha:background");
    expect(ref.referenceOnly).toBe(true);
  });

  it("keeps agent tools and ignores list fields in meta", () => {
    const agent = repo.artifacts.find((a) => a.type === "agent")!;
    expect(agent.title).toBe("alpha:helper");
    expect(agent.meta).toEqual({ tools: "Read, Grep", model: "sonnet" });
  });

  it("loads commands, hooks and mcp servers", () => {
    expect(repo.artifacts.find((a) => a.type === "command")!.title).toBe("/alpha:legacy");
    const hook = repo.artifacts.find((a) => a.type === "hook")!;
    expect(hook.title).toBe("PreToolUse");
    expect(hook.url).toBe(pluginUrl("alpha"));
    const mcp = repo.artifacts.find((a) => a.type === "mcp")!;
    expect(mcp.title).toBe("files");
    expect(mcp.url).toBe(pluginUrl("alpha"));
  });

  it("has one plugin artifact per plugin and plugin info", () => {
    const plugins = repo.artifacts.filter((a) => a.type === "plugin");
    expect(plugins.map((a) => a.id)).toEqual(["alpha/plugin/alpha", "bare/plugin/bare"]);
    expect(plugins[0].title).toBe("Alpha Plugin");
    const alpha = repo.plugins[0];
    expect(alpha.readme).toContain("Readme text.");
    expect(alpha.version).toBe("1.2.3");
    expect(alpha.artifacts.some((a) => a.type === "plugin")).toBe(false);
  });

  it("merges and dedupes tags", () => {
    expect(repo.plugins[0].tags).toEqual(["one", "two", "three"]);
  });

  it("resolves dependency marketplaces", () => {
    expect(repo.plugins[0].dependencies).toEqual([
      { name: "gamma", marketplace: "fixture-market" },
      { name: "delta", marketplace: "other-market" },
    ]);
  });

  it("throws CatalogError naming the broken SKILL.md", () => {
    try {
      loadCatalog(path.join(fixtures, "broken"));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CatalogError);
      expect((e as CatalogError).file.replaceAll("\\", "/").endsWith("plugins/alpha/skills/do-thing/SKILL.md")).toBe(
        true,
      );
    }
  });
});

describe("urls", () => {
  it("builds urls", () => {
    expect(artifactUrl("a", "agent", "b")).toBe("/plugins/a/agent/b/");
    expect(githubBlobUrl("https://x/y", "p")).toBe("https://x/y/blob/main/p");
    expect(githubTreeUrl("https://x/y", "p")).toBe("https://x/y/tree/main/p");
  });
});

describe("loadCatalog (real repo)", () => {
  const real = loadCatalog(path.resolve(__dirname, "../../.."));
  const market = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../../../.claude-plugin/marketplace.json"),
      "utf8",
    ),
  );

  it("contains every marketplace plugin with matching version", () => {
    for (const entry of market.plugins) {
      const info = real.plugins.find((p) => p.name === entry.name);
      expect(info).toBeDefined();
      const manifest = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, `../../../plugins/${entry.name}/.claude-plugin/plugin.json`),
          "utf8",
        ),
      );
      expect(info!.version).toBe(manifest.version);
    }
  });

  it("sdd-engineering has 7 agents and 1 skill", () => {
    const sdd = real.plugins.find((p) => p.name === "sdd-engineering")!;
    expect(sdd.artifacts.filter((a) => a.type === "agent")).toHaveLength(7);
    expect(sdd.artifacts.filter((a) => a.type === "skill")).toHaveLength(1);
  });
});

describe("loadCatalog (fail loudly)", () => {
  function tempRepo(mutate: (root: string) => void): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-"));
    fs.cpSync(path.join(fixtures, "repo"), root, { recursive: true });
    mutate(root);
    return root;
  }
  const alpha = (root: string, ...p: string[]) => path.join(root, "plugins", "alpha", ...p);
  const expectError = (root: string, fileEnd: string, message?: RegExp) => {
    try {
      loadCatalog(root);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CatalogError);
      expect((e as CatalogError).file.replaceAll("\\", "/").endsWith(fileEnd)).toBe(true);
      if (message) expect((e as CatalogError).message).toMatch(message);
    }
  };

  it("rejects non-relative plugin sources", () => {
    const root = tempRepo((r) => {
      const file = path.join(r, ".claude-plugin", "marketplace.json");
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      json.plugins[1].source = { source: "github", repo: "a/b" };
      fs.writeFileSync(file, JSON.stringify(json));
    });
    expectError(root, ".claude-plugin/marketplace.json", /Plugin "bare": only relative \.\/ sources/);
  });

  it("rejects skill directories without SKILL.md", () => {
    const root = tempRepo((r) => fs.mkdirSync(alpha(r, "skills", "empty")));
    expectError(root, "plugins/alpha/skills/empty", /missing SKILL\.md/);
  });

  it("rejects a non-object hooks wrapper", () => {
    const root = tempRepo((r) =>
      fs.writeFileSync(alpha(r, "hooks", "hooks.json"), JSON.stringify({ hooks: [1, 2] })),
    );
    expectError(root, "plugins/alpha/hooks/hooks.json");
  });

  it("rejects a non-object mcpServers wrapper", () => {
    const root = tempRepo((r) =>
      fs.writeFileSync(alpha(r, ".mcp.json"), JSON.stringify({ mcpServers: "nope" })),
    );
    expectError(root, "plugins/alpha/.mcp.json");
  });

  it("rejects invalid plugin.json", () => {
    const root = tempRepo((r) => fs.writeFileSync(alpha(r, ".claude-plugin", "plugin.json"), "{ nope"));
    expectError(root, "plugins/alpha/.claude-plugin/plugin.json", /invalid JSON/);
  });

  it("rejects plugins that disagree on repository", () => {
    const root = tempRepo((r) => {
      const file = path.join(r, "plugins", "bare", ".claude-plugin", "plugin.json");
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      json.repository = "https://github.com/Other/thing";
      fs.writeFileSync(file, JSON.stringify(json));
    });
    expectError(root, "plugins/bare/.claude-plugin/plugin.json", /disagrees/);
  });
});
