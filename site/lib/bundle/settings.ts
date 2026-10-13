import type { Catalog } from "@/lib/catalog/types";

export interface BundleSource {
  marketplaceName: string;
  repo: string;
  plugins: { name: string; dependencies: { name: string; marketplace: string }[] }[];
}

export function bundleSourceFrom(catalog: Catalog): BundleSource {
  return {
    marketplaceName: catalog.marketplace.name,
    repo: catalog.marketplace.repo,
    plugins: catalog.plugins.map((p) => ({ name: p.name, dependencies: p.dependencies })),
  };
}

function selectedKnown(selected: string[], src: BundleSource): string[] {
  const known = new Set(src.plugins.map((p) => p.name));
  return [...new Set(selected)].filter((name) => known.has(name)).sort();
}

export function bundleSettings(
  selected: string[],
  src: BundleSource,
): {
  extraKnownMarketplaces: Record<string, { source: { source: "github"; repo: string } }>;
  enabledPlugins: Record<string, true>;
} {
  const keys = new Set<string>();
  for (const name of selectedKnown(selected, src)) {
    keys.add(`${name}@${src.marketplaceName}`);
    const plugin = src.plugins.find((p) => p.name === name)!;
    for (const dep of plugin.dependencies) {
      keys.add(`${dep.name}@${dep.marketplace}`);
    }
  }
  const enabledPlugins: Record<string, true> = {};
  for (const key of [...keys].sort()) {
    enabledPlugins[key] = true;
  }
  return {
    extraKnownMarketplaces: {
      [src.marketplaceName]: { source: { source: "github", repo: src.repo } },
    },
    enabledPlugins,
  };
}

export function bundleCommands(selected: string[], src: BundleSource): string[] {
  return [
    `claude plugin marketplace add ${src.repo}`,
    ...selectedKnown(selected, src).map(
      (name) => `claude plugin install ${name}@${src.marketplaceName} --scope project`,
    ),
  ];
}
