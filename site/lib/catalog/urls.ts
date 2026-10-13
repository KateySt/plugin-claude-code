export function pluginUrl(plugin: string): string {
  return `/plugins/${plugin}/`;
}

export function artifactUrl(
  plugin: string,
  type: "skill" | "agent" | "command",
  name: string,
): string {
  return `/plugins/${plugin}/${type}/${name}/`;
}

export function githubBlobUrl(repoUrl: string, path: string): string {
  return `${repoUrl}/blob/main/${path}`;
}

export function githubTreeUrl(repoUrl: string, path: string): string {
  return `${repoUrl}/tree/main/${path}`;
}
