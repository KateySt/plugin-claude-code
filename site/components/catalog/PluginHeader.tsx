import { BundleToggle } from "@/components/bundle/BundleToggle";
import { VersionBadge } from "@/components/catalog/VersionBadge";
import { Badge } from "@/components/ui/badge";
import type { PluginInfo } from "@/lib/catalog/types";
import { t } from "@/lib/i18n";

export function PluginHeader({ plugin }: { plugin: PluginInfo }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{plugin.displayName}</h1>
        <VersionBadge version={plugin.version} />
        {plugin.category ? (
          <Badge variant="secondary" title={t("artifact.category")}>
            {plugin.category}
          </Badge>
        ) : null}
        <BundleToggle name={plugin.name} />
      </div>
      {plugin.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1">
          {plugin.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-muted-foreground">{plugin.description}</p>
      {plugin.dependencies.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold">{t("artifact.dependencies")}</h2>
          <ul className="text-sm text-muted-foreground">
            {plugin.dependencies.map((d) => (
              <li key={`${d.marketplace}/${d.name}`}>
                {t("artifact.dependencyFrom", { name: d.name, marketplace: d.marketplace })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
