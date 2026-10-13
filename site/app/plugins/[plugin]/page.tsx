import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTIFACT_LIST_SECTIONS, ArtifactList } from "@/components/catalog/ArtifactList";
import { PluginHeader } from "@/components/catalog/PluginHeader";
import { InstallBlock } from "@/components/install/InstallBlock";
import { PageShell } from "@/components/layout/PageShell";
import { Markdown } from "@/components/markdown/Markdown";
import { getCatalog } from "@/lib/catalog";
import { githubTreeUrl } from "@/lib/catalog/urls";
import { t } from "@/lib/i18n";

export const dynamicParams = false;

type Props = { params: Promise<{ plugin: string }> };

export function generateStaticParams() {
  return getCatalog().plugins.map((p) => ({ plugin: p.name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { plugin: name } = await params;
  const { marketplace, plugins } = getCatalog();
  const plugin = plugins.find((p) => p.name === name);
  if (!plugin) return {};
  return {
    title: t("catalog.pageTitle", { title: plugin.displayName, marketplace: marketplace.name }),
    description: plugin.description,
  };
}

export default async function PluginPage({ params }: Props) {
  const { plugin: name } = await params;
  const { marketplace, plugins } = getCatalog();
  const plugin = plugins.find((p) => p.name === name);
  if (!plugin) notFound();

  return (
    <PageShell width="max-w-6xl">
      <PluginHeader plugin={plugin} />
      <InstallBlock repo={marketplace.repo} marketplaceName={marketplace.name} plugin={plugin.name} />
      {ARTIFACT_LIST_SECTIONS.map(({ type, heading }) => (
        <ArtifactList
          key={type}
          type={type}
          heading={heading}
          artifacts={plugin.artifacts.filter((a) => a.type === type)}
        />
      ))}
      {plugin.readme ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t("artifact.readme")}</h2>
          <Markdown
            source={plugin.readme}
            sourcePath={`${plugin.sourcePath}/README.md`}
            repoUrl={marketplace.repoUrl}
          />
        </section>
      ) : null}
      <a
        href={githubTreeUrl(marketplace.repoUrl, plugin.sourcePath)}
        className="text-sm underline"
        rel="noreferrer"
      >
        {t("artifact.viewSource")}
      </a>
    </PageShell>
  );
}
