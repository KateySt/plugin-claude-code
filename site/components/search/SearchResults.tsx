"use client";

import { BundleToggle } from "@/components/bundle/BundleToggle";
import { ArtifactCard } from "@/components/catalog/ArtifactCard";
import { ArtifactGrid } from "@/components/catalog/ArtifactGrid";
import { TypeBadge } from "@/components/catalog/TypeBadge";
import { VersionBadge } from "@/components/catalog/VersionBadge";
import { CopyButton } from "@/components/install/CopyButton";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { installCommands } from "@/lib/install/commands";
import type { SearchDoc } from "@/lib/search/index-docs";

interface SearchResultsProps {
  results: SearchDoc[];
  query: string;
  filtersActive: boolean;
  repo: string;
  marketplaceName: string;
  onClearFilters(): void;
}

function ResultCard({
  doc,
  repo,
  marketplaceName,
}: {
  doc: SearchDoc;
  repo: string;
  marketplaceName: string;
}) {
  const isPlugin = doc.type === "plugin";
  return (
    <div data-testid="result" className="contents">
      <ArtifactCard>
        <ArtifactCard.Header>
          <ArtifactCard.Title href={doc.url}>{doc.title}</ArtifactCard.Title>
          <ArtifactCard.Meta>
            <TypeBadge type={doc.type} referenceOnly={doc.referenceOnly} manualOnly={doc.manualOnly} />
            {isPlugin && doc.version ? <VersionBadge version={doc.version} /> : null}
            <span className="text-xs text-muted-foreground">{doc.plugin}</span>
          </ArtifactCard.Meta>
        </ArtifactCard.Header>
        <ArtifactCard.Description>
          <p className="line-clamp-3">{doc.description}</p>
        </ArtifactCard.Description>
        {isPlugin ? (
          <ArtifactCard.Actions>
            <CopyButton
              text={installCommands(repo, marketplaceName, doc.plugin).cli.join("\n")}
              label="install.copyInstall"
            />
            <BundleToggle name={doc.plugin} />
          </ArtifactCard.Actions>
        ) : null}
      </ArtifactCard>
    </div>
  );
}

export function SearchResults({
  results,
  query,
  filtersActive,
  repo,
  marketplaceName,
  onClearFilters,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2" role="status">
        <p>{query ? t("search.noResults", { query }) : t("search.noResultsFiltered")}</p>
        {filtersActive ? (
          <Button type="button" variant="outline" onClick={onClearFilters}>
            {t("search.clearFilters")}
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <>
      <p className="text-sm text-muted-foreground" role="status">
        {t("search.resultsCount", { count: results.length })}
      </p>
      <ArtifactGrid>
        {results.map((doc) => (
          <ResultCard key={doc.id} doc={doc} repo={repo} marketplaceName={marketplaceName} />
        ))}
      </ArtifactGrid>
    </>
  );
}
