export type ArtifactType = "plugin" | "skill" | "agent" | "command" | "hook" | "mcp";

export interface Artifact {
  /** `${plugin}/${type}/${name}`; plugin artifact: `${plugin}/plugin/${plugin}` */
  id: string;
  type: ArtifactType;
  plugin: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  /** Raw Markdown body ('' for hook/mcp/plugin) */
  body: string;
  /** Repo-relative, forward slashes */
  sourcePath: string;
  /** Site path without basePath, trailing slash; hook/mcp use their plugin's url */
  url: string;
  /** Skill with `user-invocable: false` */
  referenceOnly: boolean;
  /** Skill with `disable-model-invocation: true` */
  manualOnly: boolean;
  /** argument-hint, tools, model when present */
  meta: Record<string, string>;
}

export interface PluginInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  category?: string;
  tags: string[];
  license?: string;
  author?: string;
  dependencies: { name: string; marketplace: string }[];
  readme?: string;
  sourcePath: string;
  url: string;
  /** Non-plugin artifacts of this plugin */
  artifacts: Artifact[];
}

export interface Catalog {
  marketplace: { name: string; description: string; repo: string; repoUrl: string };
  plugins: PluginInfo[];
  /** Every artifact, including one 'plugin' artifact per plugin */
  artifacts: Artifact[];
}

export class CatalogError extends Error {
  constructor(
    public file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = "CatalogError";
  }
}
