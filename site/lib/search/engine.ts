import MiniSearch from "minisearch";
import type { ArtifactType } from "@/lib/catalog/types";
import type { SearchDoc } from "./index-docs";

export interface SearchFilters {
  types: ArtifactType[];
  plugin?: string;
}

const TYPE_ORDER: Record<ArtifactType, number> = {
  plugin: 0,
  skill: 1,
  agent: 2,
  command: 3,
  hook: 4,
  mcp: 5,
};

function compareDocs(a: SearchDoc, b: SearchDoc): number {
  return (
    a.plugin.localeCompare(b.plugin) ||
    TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
    a.name.localeCompare(b.name)
  );
}

export function createSearch(docs: SearchDoc[]): (query: string, filters: SearchFilters) => SearchDoc[] {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const mini = new MiniSearch<SearchDoc>({
    fields: ["name", "title", "tags", "description", "body"],
    storeFields: [
      "type", "plugin", "name", "title", "description", "tags", "url",
      "version", "referenceOnly", "manualOnly",
    ],
    searchOptions: {
      boost: { name: 4, title: 3, tags: 2, description: 2, body: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR",
    },
  });
  mini.addAll(docs);

  const passes = (d: { type: ArtifactType; plugin: string }, f: SearchFilters) =>
    (f.types.length === 0 || f.types.includes(d.type)) && (!f.plugin || d.plugin === f.plugin);

  return (query, filters) => {
    const terms = query.trim();
    if (!terms) return docs.filter((d) => passes(d, filters)).sort(compareDocs);
    return mini
      .search(terms, { filter: (r) => passes(r as unknown as SearchDoc, filters) })
      .map((r) => byId.get(r.id))
      .filter((d): d is SearchDoc => d !== undefined);
  };
}
