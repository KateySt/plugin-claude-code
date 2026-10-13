import type { Metadata } from "next";
import { BundleChecklist } from "@/components/bundle/BundleChecklist";
import { BundleOutput } from "@/components/bundle/BundleOutput";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("bundle.pageTitle"),
};

export default function BundlePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1>{t("bundle.pageTitle")}</h1>
      <p>{t("bundle.pageIntro")}</p>
      <section className="flex flex-col gap-2">
        <h2>{t("bundle.selectHeading")}</h2>
        <BundleChecklist />
      </section>
      <BundleOutput />
    </main>
  );
}
