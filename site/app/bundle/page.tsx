import type { Metadata } from "next";
import { BundleChecklist } from "@/components/bundle/BundleChecklist";
import { BundleOutput } from "@/components/bundle/BundleOutput";
import { PageShell } from "@/components/layout/PageShell";
import { getCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";

export function generateMetadata(): Metadata {
  return {
    title: t("catalog.pageTitle", {
      title: t("bundle.pageTitle"),
      marketplace: getCatalog().marketplace.name,
    }),
  };
}

export default function BundlePage() {
  return (
    <PageShell width="max-w-3xl">
      <h1 className="text-2xl font-semibold">{t("bundle.pageTitle")}</h1>
      <p>{t("bundle.pageIntro")}</p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("bundle.selectHeading")}</h2>
        <BundleChecklist />
      </section>
      <BundleOutput />
    </PageShell>
  );
}
