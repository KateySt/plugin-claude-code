"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ArtifactType } from "@/lib/catalog/types";
import { createSearch } from "@/lib/search/engine";
import type { SearchDoc } from "@/lib/search/index-docs";
import { cleanQuery } from "@/lib/search/query";

const URL_DEBOUNCE_MS = 200;
const ALL_TYPES: readonly ArtifactType[] = ["plugin", "skill", "agent", "command", "hook", "mcp"];

export type SearchStatus = "idle" | "loading" | "ready" | "error";

export interface CatalogSearch {
  query: string;
  setQuery(q: string): void;
  types: ArtifactType[];
  toggleType(t: ArtifactType): void;
  plugin?: string;
  setPlugin(p?: string): void;
  clearFilters(): void;
  results: SearchDoc[];
  status: SearchStatus;
}

const EMPTY_DOCS: SearchDoc[] = [];

function parseTypes(raw: string | null): ArtifactType[] {
  if (!raw) return [];
  return ALL_TYPES.filter((type) => raw.split(",").includes(type));
}

function buildSearch(query: string, types: ArtifactType[], plugin?: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (types.length > 0) params.set("type", types.join(","));
  if (plugin) params.set("plugin", plugin);
  const text = params.toString().replace(/%2C/g, ",");
  return text ? `?${text}` : "";
}

export function useCatalogSearch(): CatalogSearch {
  const initial = useSearchParams();
  const [query, setQuery] = useState(() => initial.get("q") ?? "");
  const [types, setTypes] = useState<ArtifactType[]>(() => parseTypes(initial.get("type")));
  const [plugin, setPlugin] = useState<string | undefined>(() => initial.get("plugin") ?? undefined);
  const [docs, setDocs] = useState<SearchDoc[]>(EMPTY_DOCS);
  const [status, setStatus] = useState<SearchStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${base}/search-index.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<SearchDoc[]>;
      })
      .then((data) => {
        setDocs(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = buildSearch(query, types, plugin);
      if (next === window.location.search) return;
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${next}${window.location.hash}`,
      );
    }, URL_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, types, plugin]);

  const search = useMemo(() => createSearch(docs), [docs]);

  const results = useMemo(() => {
    const { terms, typeFilter } = cleanQuery(query);
    const active = typeFilter && !types.includes(typeFilter) ? [...types, typeFilter] : types;
    return search(terms, { types: active, plugin });
  }, [search, query, types, plugin]);

  const toggleType = useCallback((type: ArtifactType) => {
    setTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setTypes([]);
    setPlugin(undefined);
  }, []);

  return { query, setQuery, types, toggleType, plugin, setPlugin, clearFilters, results, status };
}
