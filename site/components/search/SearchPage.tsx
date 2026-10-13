"use client";

import { t } from "@/lib/i18n";
import { PluginFilter } from "./PluginFilter";
import { SearchBox } from "./SearchBox";
import { SearchResults } from "./SearchResults";
import { TypeFilter } from "./TypeFilter";
import { useCatalogSearch } from "./useCatalogSearch";

interface SearchPageProps {
  plugins: string[];
  repo: string;
  marketplaceName: string;
}

export function SearchPage({ plugins, repo, marketplaceName }: SearchPageProps) {
  const search = useCatalogSearch();
  const filtersActive = search.types.length > 0 || Boolean(search.plugin);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="sr-only">{t("catalog.heading")}</h2>
      <SearchBox value={search.query} onChange={search.setQuery} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TypeFilter selected={search.types} onToggle={search.toggleType} />
        <PluginFilter plugins={plugins} value={search.plugin} onChange={search.setPlugin} />
      </div>
      {search.status === "loading" ? <p role="status">{t("search.loading")}</p> : null}
      {search.status === "error" ? <p role="alert">{t("search.error")}</p> : null}
      {search.status === "ready" ? (
        <SearchResults
          results={search.results}
          query={search.query}
          filtersActive={filtersActive}
          repo={repo}
          marketplaceName={marketplaceName}
          onClearFilters={search.clearFilters}
        />
      ) : null}
    </section>
  );
}
