import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtifactMeta } from "@/components/catalog/ArtifactMeta";
import { TypeBadge } from "@/components/catalog/TypeBadge";
import { InstallBlock } from "@/components/install/InstallBlock";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Markdown } from "@/components/markdown/Markdown";
import { getCatalog } from "@/lib/catalog";
import type { Artifact } from "@/lib/catalog/types";
import { githubBlobUrl, pluginUrl } from "@/lib/catalog/urls";
import { t } from "@/lib/i18n";

export const dynamicParams = false;

type Params = { plugin: string; type: string; name: string };
type Props = { params: Promise<Params> };

const PAGE_TYPES = ["skill", "agent", "command"];

export function generateStaticParams() {
  return getCatalog()
    .artifacts.filter((a) => PAGE_TYPES.includes(a.type))
    .map((a) => ({ plugin: a.plugin, type: a.type, name: a.name }));
}

function findArtifact({ plugin, type, name }: Params): Artifact | undefined {
  if (!PAGE_TYPES.includes(type)) return undefined;
  return getCatalog().artifacts.find((a) => a.id === `${plugin}/${type}/${name}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artifact = findArtifact(await params);
  if (!artifact) return {};
  return {
    title: t("catalog.pageTitle", {
      title: artifact.title,
      marketplace: getCatalog().marketplace.name,
    }),
    description: artifact.description,
  };
}

export default async function ArtifactPage({ params }: Props) {
  const artifact = findArtifact(await params);
  if (!artifact) notFound();
  const { marketplace, plugins } = getCatalog();
  const plugin = plugins.find((p) => p.name === artifact.plugin);
  if (!plugin) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Link href="/" className="text-sm underline">
        {t("artifact.backToCatalog")}
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{artifact.title}</h1>
          <TypeBadge
            type={artifact.type}
            referenceOnly={artifact.referenceOnly}
            manualOnly={artifact.manualOnly}
          />
        </div>
        <p className="text-sm">
          {t("artifact.partOf")}{" "}
          <Link href={pluginUrl(plugin.name)} className="underline">
            {plugin.displayName}
          </Link>
        </p>
        {artifact.referenceOnly ? (
          <p className="text-sm text-muted-foreground">{t("artifact.referenceNote")}</p>
        ) : null}
        {artifact.manualOnly ? (
          <p className="text-sm text-muted-foreground">{t("artifact.manualNote")}</p>
        ) : null}
        <p className="text-muted-foreground">{artifact.description}</p>
      </header>
      <ArtifactMeta meta={artifact.meta} />
      <Markdown
        source={artifact.body}
        sourcePath={artifact.sourcePath}
        repoUrl={marketplace.repoUrl}
      />
      <a
        href={githubBlobUrl(marketplace.repoUrl, artifact.sourcePath)}
        className="text-sm underline"
        rel="noreferrer"
      >
        {t("artifact.viewSource")}
      </a>
      <InstallBlock repo={marketplace.repo} marketplaceName={marketplace.name} plugin={plugin.name} />
      <SiteFooter repoUrl={marketplace.repoUrl} />
    </main>
  );
}
