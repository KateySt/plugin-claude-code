import type { Artifact, ArtifactType, Catalog } from "@/lib/catalog/types";

export interface SearchDoc {
  id: string;
  type: ArtifactType;
  plugin: string;
  name: string;
  title: string;
  description: string;
  tags: string;
  body: string;
  url: string;
  version?: string;
  referenceOnly: boolean;
  manualOnly: boolean;
}

const BODY_LIMIT = 4000;

/** Strips Markdown syntax so only readable text is indexed. */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[^\n]*\n?/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSearchDocs(catalog: Catalog): SearchDoc[] {
  const versions = new Map(catalog.plugins.map((p) => [p.name, p.version]));
  return catalog.artifacts.map((a: Artifact) => {
    const doc: SearchDoc = {
      id: a.id,
      type: a.type,
      plugin: a.plugin,
      name: a.name,
      title: a.title,
      description: a.description,
      tags: a.tags.join(" "),
      body: stripMarkdown(a.body).slice(0, BODY_LIMIT),
      url: a.url,
      referenceOnly: a.referenceOnly,
      manualOnly: a.manualOnly,
    };
    if (a.type === "plugin") doc.version = versions.get(a.plugin);
    return doc;
  });
}
