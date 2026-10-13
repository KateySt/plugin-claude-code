import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { artifactUrl, pluginUrl } from "./urls";
import { CatalogError } from "./types";
import type { Artifact, ArtifactType, Catalog, PluginInfo } from "./types";

export { CatalogError };

type Json = Record<string, unknown>;

const META_KEYS = ["argument-hint", "tools", "model"] as const;

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function readText(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (e) {
    throw new CatalogError(file, `cannot read file: ${(e as Error).message}`);
  }
}

function readJson(file: string): Json {
  const text = readText(file);
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("expected a JSON object");
    }
    return value as Json;
  } catch (e) {
    throw new CatalogError(file, `invalid JSON: ${(e as Error).message}`);
  }
}

function readJsonIfExists(file: string): Json | undefined {
  return fs.existsSync(file) ? readJson(file) : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function listDir(dir: string): fs.Dirent[] {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
}

function parseMarkdown(file: string): { data: Json; body: string } {
  try {
    const parsed = matter(readText(file));
    return { data: parsed.data as Json, body: parsed.content.trim() };
  } catch (e) {
    if (e instanceof CatalogError) throw e;
    throw new CatalogError(file, `invalid frontmatter: ${(e as Error).message}`);
  }
}

function pickMeta(data: Json): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const key of META_KEYS) {
    const value = str(data[key]);
    if (value !== undefined) meta[key] = value;
  }
  return meta;
}

function parseRepository(value: unknown, file: string): { repo: string; repoUrl: string } {
  const raw = typeof value === "string" ? value : str((value as Json | undefined)?.url);
  const match = raw?.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) throw new CatalogError(file, "missing or non-GitHub `repository`");
  return { repo: `${match[1]}/${match[2]}`, repoUrl: `https://github.com/${match[1]}/${match[2]}` };
}

interface Ctx {
  root: string;
  plugin: string;
  pluginDir: string;
  pluginRel: string;
}

function makeArtifact(
  ctx: Ctx,
  type: ArtifactType,
  name: string,
  fields: Partial<Artifact> & Pick<Artifact, "title" | "sourcePath" | "url">,
): Artifact {
  return {
    id: `${ctx.plugin}/${type}/${name}`,
    type,
    plugin: ctx.plugin,
    name,
    description: "",
    tags: [],
    body: "",
    referenceOnly: false,
    manualOnly: false,
    meta: {},
    ...fields,
  };
}

function rel(ctx: Ctx, file: string): string {
  return toPosix(path.relative(ctx.root, file));
}

function loadSkills(ctx: Ctx): Artifact[] {
  const dir = path.join(ctx.pluginDir, "skills");
  return listDir(dir)
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, file: path.join(dir, e.name, "SKILL.md") }))
    .filter(({ file }) => fs.existsSync(file))
    .map(({ name, file }) => {
      const { data, body } = parseMarkdown(file);
      const referenceOnly = data["user-invocable"] === false;
      return makeArtifact(ctx, "skill", name, {
        title: referenceOnly ? `${ctx.plugin}:${name}` : `/${ctx.plugin}:${name}`,
        description: str(data.description) ?? "",
        body,
        sourcePath: rel(ctx, file),
        url: artifactUrl(ctx.plugin, "skill", name),
        referenceOnly,
        manualOnly: data["disable-model-invocation"] === true,
        meta: pickMeta(data),
      });
    });
}

function loadMarkdownDir(
  ctx: Ctx,
  sub: "agents" | "commands",
  type: "agent" | "command",
): Artifact[] {
  const dir = path.join(ctx.pluginDir, sub);
  return listDir(dir)
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => {
      const file = path.join(dir, e.name);
      const name = e.name.slice(0, -3);
      const { data, body } = parseMarkdown(file);
      return makeArtifact(ctx, type, name, {
        title: type === "agent" ? `${ctx.plugin}:${name}` : `/${ctx.plugin}:${name}`,
        description: str(data.description) ?? "",
        body,
        sourcePath: rel(ctx, file),
        url: artifactUrl(ctx.plugin, type, name),
        meta: pickMeta(data),
      });
    });
}

function loadKeyed(ctx: Ctx, file: string, wrapper: string, type: "hook" | "mcp"): Artifact[] {
  const json = readJsonIfExists(file);
  if (!json) return [];
  const entries = (json[wrapper] ?? json) as Json;
  return Object.keys(entries).map((key) =>
    makeArtifact(ctx, type, key, {
      title: key,
      sourcePath: rel(ctx, file),
      url: pluginUrl(ctx.plugin),
    }),
  );
}

export function loadCatalog(repoRoot: string): Catalog {
  const marketplaceFile = path.join(repoRoot, ".claude-plugin", "marketplace.json");
  const market = readJson(marketplaceFile);
  const marketName = str(market.name);
  if (!marketName) throw new CatalogError(marketplaceFile, "missing `name`");

  const plugins: PluginInfo[] = [];
  const artifacts: Artifact[] = [];
  let repository: { repo: string; repoUrl: string } | undefined;

  for (const raw of (Array.isArray(market.plugins) ? market.plugins : []) as Json[]) {
    const name = str(raw.name);
    const source = str(raw.source);
    if (!name) throw new CatalogError(marketplaceFile, "plugin entry without `name`");
    if (!source?.startsWith("./")) continue; // only relative sources are loadable

    const pluginDir = path.resolve(repoRoot, source);
    const manifestFile = path.join(pluginDir, ".claude-plugin", "plugin.json");
    const manifest = readJson(manifestFile);
    if (manifest.name !== name) {
      throw new CatalogError(
        manifestFile,
        `name "${String(manifest.name)}" does not match marketplace entry "${name}"`,
      );
    }

    const repo = parseRepository(manifest.repository, manifestFile);
    if (repository && repository.repo !== repo.repo) {
      throw new CatalogError(
        manifestFile,
        `repository ${repo.repo} disagrees with ${repository.repo}`,
      );
    }
    repository ??= repo;

    const ctx: Ctx = {
      root: repoRoot,
      plugin: name,
      pluginDir,
      pluginRel: toPosix(path.relative(repoRoot, pluginDir)),
    };
    const pluginArtifacts = [
      ...loadSkills(ctx),
      ...loadMarkdownDir(ctx, "agents", "agent"),
      ...loadMarkdownDir(ctx, "commands", "command"),
      ...loadKeyed(ctx, path.join(pluginDir, "hooks", "hooks.json"), "hooks", "hook"),
      ...loadKeyed(ctx, path.join(pluginDir, ".mcp.json"), "mcpServers", "mcp"),
    ];

    const tags = [...new Set([...strList(raw.tags), ...strList(manifest.keywords)])];
    const description = str(manifest.description) ?? str(raw.description) ?? "";
    const displayName = str(manifest.displayName) ?? name;
    const readmeFile = path.join(pluginDir, "README.md");
    const author = manifest.author;

    const dependencies = (
      Array.isArray(manifest.dependencies) ? manifest.dependencies : []
    ).flatMap((dep: unknown) => {
      if (typeof dep === "string") return [{ name: dep, marketplace: marketName }];
      const d = dep as Json;
      const depName = str(d?.name);
      return depName ? [{ name: depName, marketplace: str(d.marketplace) ?? marketName }] : [];
    });

    plugins.push({
      name,
      displayName,
      version: str(manifest.version) ?? str(raw.version) ?? "",
      description,
      category: str(raw.category),
      tags,
      license: str(manifest.license),
      author: typeof author === "string" ? author : str((author as Json | undefined)?.name),
      dependencies,
      readme: fs.existsSync(readmeFile) ? readText(readmeFile) : undefined,
      sourcePath: ctx.pluginRel,
      url: pluginUrl(name),
      artifacts: pluginArtifacts,
    });
    artifacts.push(
      makeArtifact(ctx, "plugin", name, {
        title: displayName,
        description,
        tags,
        sourcePath: ctx.pluginRel,
        url: pluginUrl(name),
      }),
      ...pluginArtifacts,
    );
  }

  if (!repository) {
    throw new CatalogError(marketplaceFile, "no plugin with a relative source and `repository`");
  }

  return {
    marketplace: { name: marketName, description: str(market.description) ?? "", ...repository },
    plugins,
    artifacts,
  };
}
