import { Suspense } from "react";
import { CopyButton } from "@/components/install/CopyButton";
import { PageShell } from "@/components/layout/PageShell";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchPage } from "@/components/search/SearchPage";
import { getCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";

export default function Home() {
  const { marketplace, plugins } = getCatalog();
  const command = `claude plugin marketplace add ${marketplace.repo}`;

  return (
    <PageShell width="max-w-6xl" back={false}>
      <SiteHeader
        name={t("site.title")}
        description={t("site.tagline")}
        repoUrl={marketplace.repoUrl}
      />
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("install.addMarketplaceHeading")}</h2>
        <div className="flex items-start justify-between gap-2 rounded-lg bg-muted p-3">
          <pre className="overflow-x-auto font-mono text-sm">{command}</pre>
          <CopyButton text={command} label="install.copy" />
        </div>
      </section>
      <Suspense fallback={<p>{t("search.loading")}</p>}>
        <SearchPage
          plugins={plugins.map((p) => p.name)}
          repo={marketplace.repo}
          marketplaceName={marketplace.name}
        />
      </Suspense>
    </PageShell>
  );
}
